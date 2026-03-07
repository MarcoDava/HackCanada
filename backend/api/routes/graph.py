from fastapi import APIRouter, Query, Depends
from db.neo4j_client import db
from api.routes.auth import get_current_user

router = APIRouter()


@router.get("/connections")
def get_connections(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    company: str = Query(None)
):
    """Returns paginated 1st-degree connections for the authenticated user."""
    user_id = current_user["id"]
    skip = (page - 1) * page_size
    
    match_clause = "MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)"
    where_clauses = []
    params = {"user_id": user_id, "skip": skip, "limit": page_size}
    
    if search:
        where_clauses.append("(toLower(p.name) CONTAINS toLower($search) OR toLower(p.title) CONTAINS toLower($search))")
        params["search"] = search
    
    if company:
        where_clauses.append("EXISTS { (p)-[:WORKS_AT]->(:Company {name: $company}) }")
        params["company"] = company
        
    where_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    count_query = f"{match_clause}{where_str} RETURN count(p) as total"
    count_result = db.run(count_query, **params)
    total_count = count_result[0]["total"] if count_result else 0
    
    results_query = f"""
        {match_clause}{where_str}
        OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
        RETURN p, c
        ORDER BY p.name
        SKIP $skip
        LIMIT $limit
    """
    results = db.run(results_query, **params)

    connections = []
    for r in results:
        person = dict(r["p"])
        company_node = dict(r["c"]) if r.get("c") else {}
        person["company"] = company_node.get("name", "")
        person["degree"] = "1st"
        connections.append(person)

    return {
        "connections": connections,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }


@router.get("/companies")
def get_user_companies(current_user: dict = Depends(get_current_user)):
    """Returns all unique companies for the authenticated user's 1st-degree connections."""
    user_id = current_user["id"]
    results = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        RETURN DISTINCT c.name as name
        ORDER BY name
    """, user_id=user_id)
    return [r["name"] for r in results]


@router.get("/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    """Returns summary stats for the authenticated user's dashboard."""
    user_id = current_user["id"]
    
    person_count = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)
        RETURN count(p) as count
    """, user_id=user_id)

    company_count = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        RETURN count(DISTINCT c) as count
    """, user_id=user_id)

    recruiter_count = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)
        WHERE p.is_recruiter = true
        RETURN count(p) as count
    """, user_id=user_id)

    top_companies = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        RETURN c.name as company, count(p) as connections
        ORDER BY connections DESC
        LIMIT 5
    """, user_id=user_id)

    return {
        "connections": person_count[0]["count"] if person_count else 0,
        "companies": company_count[0]["count"] if company_count else 0,
        "recruiters": recruiter_count[0]["count"] if recruiter_count else 0,
        "top_companies": top_companies,
    }


@router.get("/overview")
def get_graph_overview(current_user: dict = Depends(get_current_user)):
    """Returns the full graph for the authenticated user's network visualizer."""
    user_id = current_user["id"]

    user_rows = db.run("""
        MATCH (u:Person {id: $user_id})
        RETURN u
    """, user_id=user_id)

    if not user_rows:
        return {"nodes": [], "links": []}

    user_node = dict(user_rows[0]["u"])
    user_name = user_node.get("name", "You")

    rows = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)
        OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
        RETURN p, c
        LIMIT 200
    """, user_id=user_id)

    nodes = []
    links = []
    seen_nodes = set()
    seen_companies = set()

    nodes.append({
        "id": user_id,
        "name": user_name,
        "type": "user",
        "title": user_node.get("title", ""),
        "initials": user_node.get("initials", ""), 
    })
    seen_nodes.add(user_id)

    for r in rows:
        person = dict(r["p"])
        pid = person.get("id", "")

        if pid and pid not in seen_nodes:
            nodes.append({
                "id": pid,
                "name": person.get("name", ""),
                "type": "person",
                "title": person.get("title", ""),
                "is_recruiter": person.get("is_recruiter", False),
                "initials": person.get("initials", ""),
                "profile_url": person.get("profile_url", ""),
                "connected_on": person.get("connected_on", ""),
            })
            seen_nodes.add(pid)

            links.append({
                "source": user_id,
                "target": pid,
                "label": "KNOWS",
            })

        company = dict(r["c"]) if r.get("c") else None
        if company:
            cname = company.get("name", "")
            if cname:
                cid = f"company_{cname}"
                if cid not in seen_companies:
                    nodes.append({
                        "id": cid,
                        "name": cname,
                        "type": "company",
                        "logo": company.get("logo", ""),
                    })
                    seen_companies.add(cid)

                if pid:
                    links.append({
                        "source": pid,
                        "target": cid,
                        "label": "WORKS_AT",
                    })

    return {"nodes": nodes, "links": links}


@router.get("/company/{company_name}")
def get_company_subgraph(
    company_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Returns the subgraph relevant to a specific company search."""
    user_id = current_user["id"]
    result = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        WHERE toLower(c.name) CONTAINS toLower($company)
        RETURN u, p, c
        UNION
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(bridge:Person)-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        WHERE toLower(c.name) CONTAINS toLower($company)
        RETURN u, bridge as p, c
    """, user_id=user_id, company=company_name)
    return result
