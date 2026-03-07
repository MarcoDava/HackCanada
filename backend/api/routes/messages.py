from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from services.ai.message_generator import generate_outreach_message
from db.neo4j_client import db
from api.routes.auth import get_current_user

router = APIRouter()


class MessageRequest(BaseModel):
    target_person: dict
    target_company: str
    bridge_person: dict | None = None


class MessageLogRequest(BaseModel):
    target_name: str
    target_company: str
    channel: str = "copy"  # "copy" or "email"


class LinkedInVisitRequest(BaseModel):
    person_id: str
    person_name: str
    company_name: str | None = None


@router.post("/generate")
async def generate_message(
    req: MessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate an outreach message. User info is extracted from JWT.
    """
    try:
        user = {
            "id": current_user["id"],
            "name": current_user["name"] or current_user["email"].split("@")[0],
            "email": current_user["email"],
        }
        
        message = generate_outreach_message(
            user=user,
            target_person=req.target_person,
            target_company=req.target_company,
            context={"bridge_person": req.bridge_person}
        )
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/log")
async def log_message(
    req: MessageLogRequest,
    current_user: dict = Depends(get_current_user)
):
    """Log an outreach event (copy or email send) for tracking."""
    user_id = current_user["id"]
    try:
        db.run_write(
            """
            MATCH (u:Person {id: $user_id})
            CREATE (m:SentMessage {
                target_name: $target_name,
                target_company: $target_company,
                channel: $channel,
                created_at: $created_at
            })
            CREATE (u)-[:SENT]->(m)
            """,
            user_id=user_id,
            target_name=req.target_name,
            target_company=req.target_company,
            channel=req.channel,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_message_stats(current_user: dict = Depends(get_current_user)):
    """Return outreach stats for the authenticated user."""
    user_id = current_user["id"]
    result = db.run(
        """
        MATCH (u:Person {id: $user_id})-[:SENT]->(m:SentMessage)
        RETURN count(m) as messages_sent
        """,
        user_id=user_id,
    )
    return {"messages_sent": result[0]["messages_sent"] if result else 0}


@router.post("/visit")
async def log_linkedin_visit(
    req: LinkedInVisitRequest,
    current_user: dict = Depends(get_current_user)
):
    """Log a LinkedIn profile visit for tracking unique connections and companies."""
    user_id = current_user["id"]
    try:
        db.run_write(
            """
            MATCH (u:Person {id: $user_id})
            MERGE (v:LinkedInVisit {user_id: $user_id, person_id: $person_id})
            ON CREATE SET 
                v.person_name = $person_name,
                v.company_name = $company_name,
                v.created_at = $created_at
            ON MATCH SET
                v.last_visited = $created_at
            MERGE (u)-[:VISITED]->(v)
            """,
            user_id=user_id,
            person_id=req.person_id,
            person_name=req.person_name,
            company_name=req.company_name,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visit-stats")
def get_visit_stats(current_user: dict = Depends(get_current_user)):
    """Return unique connections and companies visited for the authenticated user."""
    user_id = current_user["id"]
    
    connections_result = db.run(
        """
        MATCH (u:Person {id: $user_id})-[:VISITED]->(v:LinkedInVisit)
        RETURN count(DISTINCT v.person_id) as connections_visited
        """,
        user_id=user_id,
    )
    
    companies_result = db.run(
        """
        MATCH (u:Person {id: $user_id})-[:VISITED]->(v:LinkedInVisit)
        WHERE v.company_name IS NOT NULL AND v.company_name <> ''
        RETURN count(DISTINCT v.company_name) as companies_visited
        """,
        user_id=user_id,
    )
    
    return {
        "connections_visited": connections_result[0]["connections_visited"] if connections_result else 0,
        "companies_visited": companies_result[0]["companies_visited"] if companies_result else 0
    }


@router.get("/daily-visits")
def get_daily_visits(current_user: dict = Depends(get_current_user)):
    """Return per-day visit counts for the current month (for the heatmap)."""
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    result = db.run(
        """
        MATCH (u:Person {id: $user_id})-[:VISITED]->(v:LinkedInVisit)
        WHERE v.created_at >= $month_start
        WITH v, substring(v.created_at, 0, 10) AS day_str
        RETURN day_str, count(v) AS visits
        ORDER BY day_str
        """,
        user_id=user_id,
        month_start=month_start,
    )

    # Convert to {day_of_month: count}
    daily: dict[int, int] = {}
    for row in result:
        try:
            day_num = int(row["day_str"].split("-")[2])
            daily[day_num] = row["visits"]
        except (IndexError, ValueError):
            pass

    return {"daily": daily, "year": now.year, "month": now.month}
