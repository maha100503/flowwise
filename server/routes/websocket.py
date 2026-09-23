"""
WebSocket support for real-time workflow execution with streaming updates.
"""

import json
import uuid
import asyncio
from datetime import datetime
from collections import defaultdict, deque
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import get_connection
from executors.ai_executor import execute_ai
from executors.code_executor import execute_code
from executors.conditional_executor import execute_conditional
from executors.template_executor import execute_template
from executors.io_executor import execute_io
from executors.http_executor import execute_http
from executors.database_executor import execute_database
from executors.email_executor import execute_email
from executors.slack_executor import execute_slack
from executors.ml_executor import execute_ml
from executors.timeseries_executor import execute_timeseries
from executors.data_prep_executor import execute_data_prep
from executors.evaluate_executor import execute_evaluate
from executors.clustering_executor import execute_clustering
from executors.dimensionality_executor import execute_dimensionality
from executors.anomaly_executor import execute_anomaly
from executors.ensemble_executor import execute_ensemble
from executors.neural_network_executor import execute_neural_network
from executors.file_upload_executor import execute_file_upload
from executors.data_cleaner_executor import execute_data_cleaner
from executors.merge_executor import execute_merge
from executors.feature_engineer_executor import execute_feature_engineer
from executors.model_selector_executor import execute_model_selector
from executors.predict_executor import execute_predict
from executors.file_export_executor import execute_file_export

router = APIRouter(tags=["websocket"])

# Active WebSocket connections per workflow
active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)

# Map node types to their executor functions
EXECUTORS = {
    "ai": execute_ai,
    "code": execute_code,
    "conditional": execute_conditional,
    "template": execute_template,
    "io": execute_io,
    "http": execute_http,
    "database": execute_database,
    "email": execute_email,
    "slack": execute_slack,
    "ml": execute_ml,
    "timeseries": execute_timeseries,
    "data_prep": execute_data_prep,
    "evaluate": execute_evaluate,
    "clustering": execute_clustering,
    "dimensionality": execute_dimensionality,
    "anomaly": execute_anomaly,
    "ensemble": execute_ensemble,
    "neural_network": execute_neural_network,
    "file_upload": execute_file_upload,
    "data_cleaner": execute_data_cleaner,
    "merge": execute_merge,
    "feature_engineer": execute_feature_engineer,
    "model_selector": execute_model_selector,
    "predict": execute_predict,
    "file_export": execute_file_export,
}

PASSTHROUGH_TYPES = {"webhook", "timer", "notification", "integration", "logic", "server"}

MAX_DISPLAY_ROWS = 100  # Max rows to send to the browser for display


def _truncate_for_display(result: dict, max_rows: int = MAX_DISPLAY_ROWS) -> dict:
    """Truncate large data arrays in results to prevent browser page freeze."""
    if not isinstance(result, dict):
        return result
    truncated = {}
    for key, value in result.items():
        if key == "output" and isinstance(value, dict):
            truncated[key] = _truncate_for_display(value, max_rows)
        elif key in ("rows", "X", "data", "predictions") and isinstance(value, list) and len(value) > max_rows:
            truncated[key] = value[:max_rows]
            truncated[f"_{key}_truncated"] = True
            truncated[f"_{key}_total"] = len(value)
        else:
            truncated[key] = value
    return truncated


class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, workflow_id: str):
        await websocket.accept()
        self.active_connections[workflow_id].add(websocket)

    def disconnect(self, websocket: WebSocket, workflow_id: str):
        self.active_connections[workflow_id].discard(websocket)

    async def broadcast(self, workflow_id: str, message: dict):
        """Send message to all connections for a workflow."""
        dead_connections = set()
        for connection in self.active_connections[workflow_id]:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.active_connections[workflow_id].discard(conn)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific connection."""
        try:
            await websocket.send_json(message)
        except Exception:
            pass


manager = ConnectionManager()


def topological_sort(nodes: list[dict], edges: list[dict]) -> list[str]:
    """Sort nodes in execution order using Kahn's algorithm."""
    node_ids = {n["id"] for n in nodes}
    in_degree: dict[str, int] = defaultdict(int)
    adj: dict[str, list[str]] = defaultdict(list)

    for node_id in node_ids:
        in_degree[node_id] = 0

    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        if src in node_ids and tgt in node_ids:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    queue = deque([nid for nid in node_ids if in_degree[nid] == 0])
    order = []

    while queue:
        node_id = queue.popleft()
        order.append(node_id)
        for neighbor in adj[node_id]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order


@router.websocket("/ws/execute/{workflow_id}")
async def websocket_execute(websocket: WebSocket, workflow_id: str):
    """WebSocket endpoint for real-time workflow execution with streaming updates."""
    
    await manager.connect(websocket, workflow_id)
    
    try:
        while True:
            # Wait for execution request
            data = await websocket.receive_json()
            
            if data.get("action") == "execute":
                input_data = data.get("input_data", {})
                await execute_workflow_streaming(websocket, workflow_id, input_data)
            elif data.get("action") == "ping":
                await manager.send_personal(websocket, {"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)
    except Exception as e:
        await manager.send_personal(websocket, {
            "type": "error",
            "error": str(e)
        })
        manager.disconnect(websocket, workflow_id)


async def execute_workflow_streaming(websocket: WebSocket, workflow_id: str, input_data: dict):
    """Execute workflow with streaming updates via WebSocket."""
    
    conn = await get_connection()
    
    try:
        async with conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
            row = await cursor.fetchone()
        
        if not row:
            await manager.send_personal(websocket, {
                "type": "error",
                "error": "Workflow not found"
            })
            return

        nodes = json.loads(row["nodes"])
        edges = json.loads(row["edges"])
        node_map = {n["id"]: n for n in nodes}

        # Create execution record
        exec_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO executions (id, workflow_id, status) VALUES (?, ?, 'running')",
            (exec_id, workflow_id),
        )
        await conn.commit()

        # Send execution started
        await manager.send_personal(websocket, {
            "type": "execution_started",
            "execution_id": exec_id,
            "workflow_id": workflow_id,
            "total_nodes": len(nodes)
        })

        # Topological sort for execution order
        exec_order = topological_sort(nodes, edges)

        # Build adjacency for finding inputs
        incoming: dict[str, list[str]] = defaultdict(list)
        edge_handles: dict[str, str] = {}
        for edge in edges:
            incoming[edge["target"]].append(edge["source"])
            if edge.get("sourceHandle"):
                edge_handles[f"{edge['source']}->{edge['target']}"] = edge["sourceHandle"]

        # Execute nodes in order with streaming updates
        node_outputs: dict[str, dict] = {}
        node_results: dict[str, dict] = {}
        completed_count = 0

        for node_id in exec_order:
            node = node_map.get(node_id)
            if not node:
                continue

            node_data = node.get("data", {})
            node_type = node_data.get("type", node.get("type", ""))
            node_label = node_data.get("label", node_id)

            # Route "data" nodes to proper executors if they match known expressions
            if node_type == "data":
                from routes.execute import _resolve_data_node
                resolved_type, resolved_data = _resolve_data_node(node_data)
                if resolved_type != "data":
                    node_type = resolved_type
                    node_data = resolved_data

            # Send node started
            await manager.send_personal(websocket, {
                "type": "node_started",
                "node_id": node_id,
                "node_label": node_label,
                "node_type": node_type,
                "progress": completed_count / len(nodes)
            })

            # Gather input from parent nodes
            parent_ids = incoming.get(node_id, [])
            if parent_ids:
                node_input = {}
                for pid in parent_ids:
                    parent_output = node_outputs.get(pid, {})
                    edge_key = f"{pid}->{node_id}"
                    handle = edge_handles.get(edge_key)

                    if handle:
                        parent_result = node_results.get(pid, {})
                        if parent_result.get("branch") and parent_result["branch"] != handle:
                            continue

                    node_input.update(parent_output if isinstance(parent_output, dict) else {"output": parent_output})
            else:
                node_input = input_data

            # Execute the node
            start_time = datetime.now()
            STREAMING_TYPES = {"code", "ml", "timeseries", "data_prep", "evaluate", "clustering", "dimensionality", "anomaly", "ensemble", "neural_network", "file_upload", "data_cleaner", "merge", "feature_engineer", "model_selector", "predict", "file_export"}
            try:
                if node_type in STREAMING_TYPES:
                    # Stream output for nodes that support on_output callback
                    async def _on_stream_output(line: str, _nid=node_id):
                        await manager.send_personal(websocket, {
                            "type": "node_output_stream",
                            "node_id": _nid,
                            "chunk": line,
                        })
                    result = await EXECUTORS[node_type](node_data, node_input, on_output=_on_stream_output)
                elif node_type in EXECUTORS:
                    result = await EXECUTORS[node_type](node_data, node_input)
                elif node_type in PASSTHROUGH_TYPES:
                    passthrough_output = dict(node_input) if isinstance(node_input, dict) else {"output": node_input}
                    node_config = node_data.get("config", {})
                    if node_config:
                        passthrough_output.update({k: v for k, v in node_config.items() if v})
                    result = {"output": passthrough_output}
                else:
                    result = {"output": node_input, "warning": f"Unknown node type: {node_type}"}
                
                execution_time = (datetime.now() - start_time).total_seconds() * 1000

                node_results[node_id] = result
                node_outputs[node_id] = result.get("output", result)
                completed_count += 1

                # Truncate large data for browser display to prevent page freeze
                display_result = _truncate_for_display(result)

                # Send node completed
                await manager.send_personal(websocket, {
                    "type": "node_completed",
                    "node_id": node_id,
                    "node_label": node_label,
                    "result": display_result,
                    "execution_time_ms": execution_time,
                    "progress": completed_count / len(nodes)
                })

            except Exception as e:
                # Send node error
                await manager.send_personal(websocket, {
                    "type": "node_error",
                    "node_id": node_id,
                    "node_label": node_label,
                    "error": str(e)
                })
                raise

            # Small delay for visual effect
            await asyncio.sleep(0.05)

        # Save results
        result_json = json.dumps({
            "execution_order": exec_order,
            "node_results": node_results,
        }, default=str)

        await conn.execute(
            "UPDATE executions SET status = 'completed', result = ?, completed_at = ? WHERE id = ?",
            (result_json, datetime.now().isoformat(), exec_id),
        )
        await conn.commit()

        # Send execution completed (use truncated results for browser)
        display_node_results = {nid: _truncate_for_display(r) for nid, r in node_results.items()}
        await manager.send_personal(websocket, {
            "type": "execution_completed",
            "execution_id": exec_id,
            "workflow_id": workflow_id,
            "result": {
                "execution_order": exec_order,
                "node_results": display_node_results,
            }
        })

    except Exception as e:
        await conn.execute(
            "UPDATE executions SET status = 'failed', error = ?, completed_at = ? WHERE id = ?",
            (str(e), datetime.now().isoformat(), exec_id),
        )
        await conn.commit()
        
        await manager.send_personal(websocket, {
            "type": "execution_failed",
            "execution_id": exec_id,
            "error": str(e)
        })
    
    finally:
        await conn.close()


@router.websocket("/ws/workflow/{workflow_id}")
async def websocket_workflow_updates(websocket: WebSocket, workflow_id: str):
    """WebSocket for receiving workflow updates (collaborative editing future feature)."""
    
    await manager.connect(websocket, workflow_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Broadcast updates to all connected clients
            if data.get("type") == "node_update":
                await manager.broadcast(workflow_id, {
                    "type": "node_updated",
                    "node_id": data.get("node_id"),
                    "changes": data.get("changes")
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)
