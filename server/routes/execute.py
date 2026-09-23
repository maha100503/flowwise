import json
import uuid
import time
import asyncio
from datetime import datetime
from collections import defaultdict, deque
from fastapi import APIRouter, HTTPException

from database import get_connection
from models import ExecuteRequest, ExecutionResponse
from executors.ai_executor import execute_ai
from executors.code_executor import execute_code
from executors.conditional_executor import execute_conditional
from executors.template_executor import execute_template
from executors.io_executor import execute_io
from executors.http_executor import execute_http
from executors.database_executor import execute_database
from executors.email_executor import execute_email
from executors.slack_executor import execute_slack
from executors.regex_executor import execute_regex
from executors.cache_executor import execute_cache
from executors.crypto_executor import execute_crypto
from executors.json_transform_executor import execute_json_transform
from executors.validator_executor import execute_validator
from executors.aggregator_executor import execute_aggregator
from executors.rss_executor import execute_rss
from executors.qrcode_executor import execute_qrcode
from executors.markdown_executor import execute_markdown
from executors.websocket_executor import execute_websocket
from executors.teams_executor import execute_teams
from executors.outlook_executor import execute_outlook
from executors.whatsapp_executor import execute_whatsapp
from executors.telegram_executor import execute_telegram
from executors.instagram_executor import execute_instagram
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

router = APIRouter(tags=["execution"])

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
    "regex": execute_regex,
    "cache": execute_cache,
    "crypto": execute_crypto,
    "json_transform": execute_json_transform,
    "validator": execute_validator,
    "aggregator": execute_aggregator,
    "rss": execute_rss,
    "qrcode": execute_qrcode,
    "markdown": execute_markdown,
    "websocket": execute_websocket,
    "teams": execute_teams,
    "outlook": execute_outlook,
    "whatsapp": execute_whatsapp,
    "telegram": execute_telegram,
    "instagram": execute_instagram,
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

# Passthrough nodes — just forward input to output (except io which has special handling)
PASSTHROUGH_TYPES = {"webhook", "timer", "notification", "integration", "logic", "server"}

# Route "data" nodes to proper executors based on expression/label
_DATA_EXPRESSION_MAP = {
    "parse_dates": ("data_cleaner", {"subType": "ParseDates", "config": {"operation": "ParseDates"}}),
    "normalize_text": ("data_cleaner", {"subType": "NormalizeText", "config": {"operation": "NormalizeText"}}),
    "drop_nulls": ("data_cleaner", {"subType": "DropNulls", "config": {"operation": "DropNulls"}}),
    "drop_duplicates": ("data_cleaner", {"subType": "DropDuplicates", "config": {"operation": "DropDuplicates"}}),
    "coerce_types": ("data_cleaner", {"subType": "CoerceTypes", "config": {"operation": "CoerceTypes"}}),
    "train_test_split": ("data_prep", {"subType": "TrainTestSplit"}),
    "standard_scaler": ("data_prep", {"subType": "Standardize"}),
    "normalize": ("data_prep", {"subType": "Normalize"}),
    "fill_missing": ("data_prep", {"subType": "FillMissing"}),
    "encode": ("data_prep", {"subType": "Encode"}),
    "label_encode": ("data_prep", {"subType": "Encode"}),
    "feature_engineering": ("feature_engineer", {}),
    "merge": ("merge", {}),
    "evaluate_model": ("evaluate", {}),
}


def _resolve_data_node(node_data: dict) -> tuple[str, dict]:
    """If a 'data' type node has a known expression, resolve it to a real executor."""
    config = node_data.get("config", {})
    expression = config.get("expression", "").lower().strip().rstrip("()")
    label = node_data.get("label", "").lower().strip()

    # Try matching expression first, then label
    for key, (executor_type, overrides) in _DATA_EXPRESSION_MAP.items():
        if key in expression or key in label.replace(" ", "_").replace("/", "_"):
            # Merge config from fields into the node config
            resolved_data = dict(node_data)
            resolved_config = dict(config)
            # Convert fields to config params
            for field in config.get("fields", []):
                fk = field.get("key", "").strip().lower().replace(" ", "_")
                fv = field.get("value", "").strip()
                if fk and fv:
                    resolved_config[fk] = fv
            resolved_config.update(overrides.get("config", {}))
            resolved_data["config"] = resolved_config
            if "subType" in overrides:
                resolved_data["subType"] = overrides["subType"]
            return executor_type, resolved_data

    return "data", node_data


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


@router.post("/api/execute/{workflow_id}", response_model=ExecutionResponse)
async def execute_workflow(workflow_id: str, payload: ExecuteRequest = ExecuteRequest()):
    """Execute a workflow — topological sort → run each node in order."""
    conn = await get_connection()
    async with conn.execute("SELECT * FROM workflows WHERE id = ?", (workflow_id,)) as cursor:
        row = await cursor.fetchone()
    
    if not row:
        await conn.close()
        raise HTTPException(status_code=404, detail="Workflow not found")

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

    try:
        # Topological sort for execution order
        exec_order = topological_sort(nodes, edges)

        # Build adjacency for finding inputs
        incoming: dict[str, list[str]] = defaultdict(list)
        edge_handles: dict[str, str] = {}
        for edge in edges:
            incoming[edge["target"]].append(edge["source"])
            if edge.get("sourceHandle"):
                edge_handles[f"{edge['source']}->{edge['target']}"] = edge["sourceHandle"]

        # Execute nodes in order
        node_outputs: dict[str, dict] = {}
        node_results: dict[str, dict] = {}
        node_timings: dict[str, float] = {}
        node_retries: dict[str, int] = {}
        total_start = time.perf_counter()

        for node_id in exec_order:
            node = node_map.get(node_id)
            if not node:
                continue

            node_data = node.get("data", {})
            node_type = node_data.get("type", node.get("type", ""))
            node_config = node_data.get("config", {})

            # Route "data" nodes to proper executors if they match known expressions
            if node_type == "data":
                resolved_type, resolved_data = _resolve_data_node(node_data)
                if resolved_type != "data":
                    node_type = resolved_type
                    node_data = resolved_data

            # Unique feature: per-node retry configuration
            max_retries = int(node_config.get("retries", 0))
            retry_delay = float(node_config.get("retryDelay", 1))

            # Gather input from parent nodes
            parent_ids = incoming.get(node_id, [])
            if parent_ids:
                # Merge all parent outputs
                input_data = {}
                for pid in parent_ids:
                    parent_output = node_outputs.get(pid, {})
                    # Check if this edge should only pass on a specific branch
                    edge_key = f"{pid}->{node_id}"
                    handle = edge_handles.get(edge_key)

                    if handle:
                        # Conditional routing — check if the branch matches
                        parent_result = node_results.get(pid, {})
                        if parent_result.get("branch") and parent_result["branch"] != handle:
                            continue  # Skip this parent — wrong branch

                    input_data.update(parent_output if isinstance(parent_output, dict) else {"output": parent_output})
            else:
                input_data = payload.input_data

            # Execute the node with timing and retry
            node_start = time.perf_counter()
            attempts = 0
            result = None

            while attempts <= max_retries:
                try:
                    if node_type in EXECUTORS:
                        result = await EXECUTORS[node_type](node_data, input_data)
                    elif node_type in PASSTHROUGH_TYPES:
                        # Pass through input, but enrich with node config for trigger nodes
                        passthrough_output = dict(input_data) if isinstance(input_data, dict) else {"output": input_data}
                        if node_config:
                            passthrough_output.update({k: v for k, v in node_config.items() if v})
                        result = {"output": passthrough_output}
                    else:
                        result = {"output": input_data, "warning": f"Unknown node type: {node_type}"}

                    # If no error in result, break out of retry loop
                    if not result.get("error"):
                        break
                    # If there's an error but we have retries left, retry
                    if attempts < max_retries:
                        attempts += 1
                        await asyncio.sleep(retry_delay)
                        continue
                    break
                except Exception as exc:
                    if attempts < max_retries:
                        attempts += 1
                        await asyncio.sleep(retry_delay)
                        continue
                    result = {"error": str(exc), "output": None}
                    break

            node_elapsed = round((time.perf_counter() - node_start) * 1000, 2)
            node_timings[node_id] = node_elapsed
            if attempts > 0:
                node_retries[node_id] = attempts

            # Attach timing metadata to result
            if isinstance(result, dict):
                result["_timing_ms"] = node_elapsed
                if attempts > 0:
                    result["_retries"] = attempts

            node_results[node_id] = result
            node_outputs[node_id] = result.get("output", result)

        total_elapsed = round((time.perf_counter() - total_start) * 1000, 2)

        # Unique feature: execution metrics summary
        metrics = {
            "total_time_ms": total_elapsed,
            "node_count": len(exec_order),
            "node_timings": node_timings,
            "slowest_node": max(node_timings, key=node_timings.get) if node_timings else None,
            "fastest_node": min(node_timings, key=node_timings.get) if node_timings else None,
            "retried_nodes": node_retries if node_retries else None,
            "avg_node_time_ms": round(sum(node_timings.values()) / len(node_timings), 2) if node_timings else 0,
        }

        # Save results
        result_json = json.dumps({
            "execution_order": exec_order,
            "node_results": node_results,
            "metrics": metrics,
        }, default=str)

        await conn.execute(
            "UPDATE executions SET status = 'completed', result = ?, completed_at = ? WHERE id = ?",
            (result_json, datetime.now().isoformat(), exec_id),
        )
        await conn.commit()

        async with conn.execute("SELECT * FROM executions WHERE id = ?", (exec_id,)) as cursor:
            execution = await cursor.fetchone()
        await conn.close()

        return ExecutionResponse(
            id=execution["id"],
            workflow_id=execution["workflow_id"],
            status=execution["status"],
            result=json.loads(execution["result"]) if execution["result"] else None,
            error=execution["error"],
            started_at=execution["started_at"],
            completed_at=execution["completed_at"],
        )

    except Exception as e:
        await conn.execute(
            "UPDATE executions SET status = 'failed', error = ?, completed_at = ? WHERE id = ?",
            (str(e), datetime.now().isoformat(), exec_id),
        )
        await conn.commit()
        await conn.close()
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@router.get("/api/executions/{workflow_id}", response_model=list[ExecutionResponse])
async def get_executions(workflow_id: str):
    """Get execution history for a workflow."""
    conn = await get_connection()
    async with conn.execute(
        "SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 20",
        (workflow_id,),
    ) as cursor:
        rows = await cursor.fetchall()
    await conn.close()

    return [
        ExecutionResponse(
            id=row["id"],
            workflow_id=row["workflow_id"],
            status=row["status"],
            result=json.loads(row["result"]) if row["result"] else None,
            error=row["error"],
            started_at=row["started_at"],
            completed_at=row["completed_at"],
        )
        for row in rows
    ]
