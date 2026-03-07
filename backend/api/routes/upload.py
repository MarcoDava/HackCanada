from fastapi import APIRouter, UploadFile, File, HTTPException
from services.graph.builder import parse_csv, build_graph
from db.neo4j_client import db
from services.graph.builder import make_id

router = APIRouter()

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...), 
    user_id: str = "default_id", 
    user_name: str = "Me", 
    user_title: str = ""
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    contents = await file.read()
    df = parse_csv(contents)
    stats = build_graph(df, {"id": user_id, "name": user_name, "title": user_title})

    return {
        "success": True,
        "user_id": user_id,
        "stats": stats,
        "message": f"Graph built: {stats['persons']} people, {stats['companies']} companies"
    }
