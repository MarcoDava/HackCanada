from fastapi import APIRouter, Depends
from services.enrichment.scrapfly_enricher import enrich_profile
from db.neo4j_client import db
from api.routes.auth import get_current_user

router = APIRouter()


@router.post("/profile")
async def enrich_connection(
    person_id: str,
    profile_url: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Enrich a single profile on-demand. Only call for top candidates.
    Requires authentication.
    """
    enriched = await enrich_profile(profile_url)

    if enriched:
        db.run_write("""
            MATCH (p:Person {id: $id})
            SET p.enriched = true,
                p.headline = $headline,
                p.location = $location
        """, id=person_id, **{k: v for k, v in enriched.items() if k in ["headline", "location"]})

    return {"person_id": person_id, "enriched_data": enriched}
