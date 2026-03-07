from fastapi import APIRouter, Query
from db.neo4j_client import db
from services.graph.builder import make_id

router = APIRouter()

@router.get("/connections")
def get_connections(
    user_id: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    company: str = Query(None)
):
    """Returns paginated 1st-degree connections for the user."""
    skip = (page - 1) * page_size
    
    # Base pattern
    match_clause = "MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)"
    where_clauses = []
    params = {"user_id": user_id, "skip": skip, "limit": page_size}
    
    if search:
        where_clauses.append("(toLower(p.name) CONTAINS toLower($search) OR toLower(p.title) CONTAINS toLower($search))")
        params["search"] = search
    
    if company:
        # Check if the person works at this specific company
        where_clauses.append("EXISTS { (p)-[:WORKS_AT]->(:Company {name: $company}) }")
        params["company"] = company
        
    where_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    # 1. Get total count
    count_query = f"{match_clause}{where_str} RETURN count(p) as total"
    count_result = db.run(count_query, **params)
    total_count = count_result[0]["total"] if count_result else 0
    
    # 2. Get paginated results
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
def get_user_companies(user_id: str = Query(...)):
    """Returns all unique companies for the user's 1st-degree connections."""
    results = db.run("""
        MATCH (u:Person {id: $user_id})-[:KNOWS]->(p:Person)-[:WORKS_AT]->(c:Company)
        RETURN DISTINCT c.name as name
        ORDER BY name
    """, user_id=user_id)
    return [r["name"] for r in results]

@router.get("/stats")
def get_stats(user_id: str = Query(...)):
    """Returns summary stats for the dashboard."""
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
def get_graph_overview(user_id: str = Query(...)):
    """Returns the full graph for the network visualizer with nodes + links."""

    # Get the central user node
    user_rows = db.run("""
        MATCH (u:Person {id: $user_id})
        RETURN u
    """, user_id=user_id)

    if not user_rows:
        return {"nodes": [], "links": []}

    user_node = dict(user_rows[0]["u"])
    user_name = user_node.get("name", "You")

    # Get all connections and their companies in one query
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

    # Central user node
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

            # KNOWS edge: user -> connection
            links.append({
                "source": user_id,
                "target": pid,
                "label": "KNOWS",
            })

        # Company node + WORKS_AT edge
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

                # WORKS_AT edge: connection -> company
                if pid:
                    links.append({
                        "source": pid,
                        "target": cid,
                        "label": "WORKS_AT",
                    })

    return {"nodes": nodes, "links": links}

@router.get("/company/{company_name}")
def get_company_subgraph(company_name: str, user_id: str = Query(...)):
    """Returns the subgraph relevant to a specific company search."""
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
