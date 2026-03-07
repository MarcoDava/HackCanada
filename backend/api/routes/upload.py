from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.graph.builder import parse_csv, build_graph
from db.neo4j_client import db
from api.routes.auth import get_current_user

router = APIRouter()


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

    user_id = current_user["id"]
    user_name = current_user["name"] or current_user["email"].split("@")[0]

    contents = await file.read()
    df = parse_csv(contents)
    stats = build_graph(df, {"id": user_id, "name": user_name, "title": user_title})

    return {
        "success": True,
        "user_id": user_id,
        "stats": stats,
        "message": f"Graph built: {stats['persons']} people, {stats['companies']} companies"
    }
