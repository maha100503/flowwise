from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


# ── Node / Edge schemas (match React Flow) ──────────────────────

class Position(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    type: str
    subType: Optional[str] = None
    config: dict = {}


class WorkflowNode(BaseModel):
    id: str
    type: Optional[str] = None
    position: Position
    data: NodeData


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    animated: Optional[bool] = None


# ── Workflow CRUD schemas ────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str
    nodes: list[WorkflowNode] = []
    edges: list[WorkflowEdge] = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[list[WorkflowNode]] = None
    edges: Optional[list[WorkflowEdge]] = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    nodes: list[Any]
    edges: list[Any]
    created_at: str
    updated_at: str


class WorkflowListItem(BaseModel):
    id: str
    name: str
    node_count: int
    edge_count: int
    created_at: str
    updated_at: str


# ── Execution schemas ────────────────────────────────────────────

class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None


class ExecuteRequest(BaseModel):
    input_data: dict = {}
