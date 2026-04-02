
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.graph.builder import parse_csv, build_graph, make_id, make_scoped_id
from db.neo4j_client import db
from api.routes.auth import get_current_user
import asyncio


router = APIRouter()


def _parse_and_build(contents: bytes, user_dict: dict) -> dict:
    """Run the blocking CSV parse + graph build in a worker thread."""
    df = parse_csv(contents)
    stats = build_graph(df, user_dict)
    return stats


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    user_title: str = "",
    current_user: dict = Depends(get_current_user)
):
    """
    Upload LinkedIn connections CSV. User is authenticated via JWT.
    The user_id and user_name are extracted from the token, not query params.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")
    if file.content_type not in ("text/csv", "application/csv", "application/octet-stream", "text/plain"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    user_id = current_user["id"]
    user_name = current_user["name"] or current_user["email"].split("@")[0]

    MAX_CSV_BYTES = 10 * 1024 * 1024  # 10 MB
    contents = await file.read()
    if len(contents) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    # Ensure we have a stable user_id that matches the graph's Person node
    # If the client passes an empty or placeholder id, derive one from the name.
    effective_user_id = user_id or make_id(user_name or "Me")

    # Offload blocking I/O (HTTP lookups + Neo4j writes) to a thread pool
    loop = asyncio.get_running_loop()
    stats = await loop.run_in_executor(
        None,
        _parse_and_build,
        contents,
        {
            "id": effective_user_id,
            "name": user_name,
            "title": user_title,
            "is_user": True,
            "is_source": True,
            "network_name": "Primary Network",
            "owner_user_id": effective_user_id,
        },
    )

    return {
        "success": True,
        "user_id": effective_user_id,
        "stats": stats,
        "message": f"Graph built: {stats['persons']} people, {stats['companies']} companies"
    }


@router.post("/network")
async def upload_additional_network(
    file: UploadFile = File(...),
    source_name: str = "Imported Network",
    source_title: str = "",
    source_email: str = "",
    network_name: str = "",
    current_user: dict = Depends(get_current_user),
):
    """
    Upload an additional LinkedIn Connections.csv file representing
    another person's network.

    This builds a new "source network" rooted at that person but merges
    high-confidence matches (e.g. by email) into the existing graph.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")
    if file.content_type not in ("text/csv", "application/csv", "application/octet-stream", "text/plain"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    owner_user_id = current_user["id"]
    owner_rows = db.run(
        """
        MATCH (owner:Person {id: $owner_id})
        WHERE owner.is_user = true
        RETURN owner
        LIMIT 1
        """,
        owner_id=owner_user_id,
    )
    if not owner_rows:
        raise HTTPException(
            status_code=400,
            detail="Upload your own Connections.csv first before adding trusted networks.",
        )

    MAX_CSV_BYTES = 10 * 1024 * 1024  # 10 MB
    contents = await file.read()
    if len(contents) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    # Derive a stable id for the source person
    source_person_id = make_scoped_id(
        owner_user_id,
        source_name or "Imported Network",
        source_email or "",
    )

    # Network label shown in UI
    resolved_network_name = network_name or f"{source_name}'s Network"

    # Offload blocking I/O to a thread pool
    loop = asyncio.get_running_loop()
    stats = await loop.run_in_executor(
        None,
        _parse_and_build,
        contents,
        {
            "id": source_person_id,
            "name": source_name,
            "title": source_title,
            "email": source_email,
            "is_user": False,
            "is_source": True,
            "network_name": resolved_network_name,
            "owner_user_id": owner_user_id,
        },
    )

    # Connect the owner user to this source person so the additional
    # network becomes reachable from the primary graph.
    if owner_user_id and owner_user_id != source_person_id:
        db.run_write(
            """
            MATCH (owner:Person {id: $owner_id}), (src:Person {id: $src_id})
            MERGE (owner)-[:KNOWS]->(src)
        """,
            owner_id=owner_user_id,
            src_id=source_person_id,
        )

        # Remove connections that the primary user already has directly.
        # We only want unique 2nd-degree connections from this secondary network.
        db.run_write(
            """
            MATCH (owner:Person {id: $owner_id})-[:KNOWS]->(shared:Person)<-[:KNOWS]-(src:Person {id: $src_id})
            WHERE shared.id <> $owner_id AND shared.id <> $src_id
            WITH src, shared
            MATCH (src)-[r:KNOWS]->(shared)
            DELETE r
        """,
            owner_id=owner_user_id,
            src_id=source_person_id,
        )

        # Also remove any company nodes that are now orphaned
        # (no person connects to them anymore)
        db.run_write(
            """
            MATCH (c:Company)
            WHERE NOT EXISTS { ()-[:WORKS_AT]->(c) }
            DETACH DELETE c
        """,
        )

    return {
        "success": True,
        "source_person_id": source_person_id,
        "owner_user_id": owner_user_id,
        "stats": stats,
        "message": (
            f"Additional network '{resolved_network_name}' built: "
            f"{stats['persons']} people, {stats['companies']} companies"
        ),
    }
