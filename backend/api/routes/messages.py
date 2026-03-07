from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.ai.message_generator import generate_outreach_message
from api.routes.auth import get_current_user

router = APIRouter()


class MessageRequest(BaseModel):
    target_person: dict
    target_company: str
    bridge_person: dict | None = None


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
