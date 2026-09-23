import json
import uuid
from fastapi import APIRouter, HTTPException
from database import get_connection
from models import WorkflowCreate, WorkflowUpdate, WorkflowResponse, WorkflowListItem

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("/", response_model=list[WorkflowListItem])
async def list_workflows():
    """List all saved workflows."""
    conn = await get_connection()
    async with conn.execute(
        "SELECT id, name, nodes, edges, created_at, updated_at FROM workflows ORDER BY updated_at DESC"
    ) as cursor:
        rows = await cursor.fetchall()
    await conn.close()

    result = []
    for row in rows:
        nodes = json.loads(row["nodes"])
        edges = json.loads(row["edges"])
        result.append(WorkflowListItem(
            id=row["id"],
            name=row["name"],
            node_count=len(nodes),
            edge_count=len(edges),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        ))
    return result


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """Get a single workflow by ID."""
    conn = await get_connection()
    async with conn.execute(
        "SELECT * FROM workflows WHERE id = ?", (workflow_id,)
    ) as cursor:
        row = await cursor.fetchone()
    await conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return WorkflowResponse(
        id=row["id"],
        name=row["name"],
        nodes=json.loads(row["nodes"]),
        edges=json.loads(row["edges"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("/", response_model=WorkflowResponse, status_code=201)
async def create_workflow(payload: WorkflowCreate):
    """Create a new workflow."""
    workflow_id = str(uuid.uuid4())
    nodes_json = json.dumps([n.model_dump() for n in payload.nodes])
    edges_json = json.dumps([e.model_dump() for e in payload.edges])

    conn = await get_connection()
    await conn.execute(
        "INSERT INTO workflows (id, name, nodes, edges) VALUES (?, ?, ?, ?)",
        (workflow_id, payload.name, nodes_json, edges_json),
    )
    await conn.commit()

    async with conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
        row = await cursor.fetchone()
    await conn.close()

    return WorkflowResponse(
        id=row["id"],
        name=row["name"],
        nodes=json.loads(row["nodes"]),
        edges=json.loads(row["edges"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, payload: WorkflowUpdate):
    """Update an existing workflow."""
    conn = await get_connection()
    async with conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
        existing = await cursor.fetchone()
    
    if not existing:
        await conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

    name = payload.name if payload.name is not None else existing["name"]
    nodes_json = (
        json.dumps([n.model_dump() for n in payload.nodes])
        if payload.nodes is not None
        else existing["nodes"]
    )
    edges_json = (
        json.dumps([e.model_dump() for e in payload.edges])
        if payload.edges is not None
        else existing["edges"]
    )

    await conn.execute(
        "UPDATE workflows SET name = ?, nodes = ?, edges = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (name, nodes_json, edges_json, workflow_id),
    )
    await conn.commit()

    async with conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
        row = await cursor.fetchone()
    await conn.close()

    return WorkflowResponse(
        id=row["id"],
        name=row["name"],
        nodes=json.loads(row["nodes"]),
        edges=json.loads(row["edges"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow and its executions."""
    conn = await get_connection()
    async with conn.execute("SELECT id FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
        existing = await cursor.fetchone()
    
    if not existing:
        await conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

    await conn.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
    await conn.commit()
    await conn.close()

    return {"message": "Workflow deleted", "id": workflow_id}
