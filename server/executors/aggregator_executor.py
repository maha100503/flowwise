"""
Aggregator Executor - Statistical aggregation, sorting, grouping, and slicing of data arrays.
"""

import json
import re
from typing import Any
from collections import defaultdict


def _get_nested_value(data: dict, key: str) -> Any:
    """Get a nested value using dot notation."""
    keys = key.split('.')
    value = data
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return None
    return value


def _extract_field_values(items: list, field: str) -> list:
    """Extract field values from a list of dicts."""
    values = []
    for item in items:
        if isinstance(item, dict):
            val = _get_nested_value(item, field)
            if val is not None:
                values.append(val)
        else:
            values.append(item)
    return values


async def execute_aggregator(node_data: dict, input_data: dict) -> dict:
    """Execute an aggregation operation on array data."""
    config = node_data.get("config", {})
    operation = config.get("operation", "count")
    field = config.get("field", "")
    
    # Get input data - should be a list
    data = input_data.get("output", input_data)
    
    # Normalize to list
    if isinstance(data, dict):
        # Try common patterns: items, data, results, output
        for key in ["items", "data", "results", "output", "rows"]:
            if key in data and isinstance(data[key], list):
                data = data[key]
                break
        else:
            data = [data]
    elif not isinstance(data, list):
        data = [data]

    try:
        if operation == "count":
            return {"output": len(data), "count": len(data)}

        elif operation == "sum":
            values = _extract_field_values(data, field) if field else data
            numeric = [float(v) for v in values if _is_numeric(v)]
            total = sum(numeric)
            return {"output": total, "count": len(numeric)}

        elif operation == "avg":
            values = _extract_field_values(data, field) if field else data
            numeric = [float(v) for v in values if _is_numeric(v)]
            if not numeric:
                return {"output": 0, "count": 0, "error": "No numeric values found"}
            avg = sum(numeric) / len(numeric)
            return {"output": round(avg, 4), "count": len(numeric)}

        elif operation == "min":
            values = _extract_field_values(data, field) if field else data
            numeric = [float(v) for v in values if _is_numeric(v)]
            if not numeric:
                return {"output": None, "error": "No numeric values found"}
            return {"output": min(numeric), "count": len(numeric)}

        elif operation == "max":
            values = _extract_field_values(data, field) if field else data
            numeric = [float(v) for v in values if _is_numeric(v)]
            if not numeric:
                return {"output": None, "error": "No numeric values found"}
            return {"output": max(numeric), "count": len(numeric)}

        elif operation == "group_by":
            if not field:
                return {"error": "Field is required for group_by", "output": None}
            
            agg_func = config.get("aggFunc", "count")
            groups = defaultdict(list)
            
            for item in data:
                if isinstance(item, dict):
                    key = _get_nested_value(item, field)
                    if key is not None:
                        groups[str(key)].append(item)
            
            if agg_func == "count":
                result = {k: len(v) for k, v in groups.items()}
            elif agg_func == "sum":
                result = {k: sum(float(x) for x in _extract_field_values(v, field) if _is_numeric(x)) for k, v in groups.items()}
            elif agg_func == "avg":
                result = {}
                for k, v in groups.items():
                    nums = [float(x) for x in _extract_field_values(v, field) if _is_numeric(x)]
                    result[k] = round(sum(nums) / len(nums), 4) if nums else 0
            elif agg_func == "list":
                result = {k: v for k, v in groups.items()}
            else:
                result = {k: len(v) for k, v in groups.items()}
            
            return {"output": result, "groups": len(groups)}

        elif operation == "unique":
            values = _extract_field_values(data, field) if field else data
            # Convert to strings for uniqueness, then back
            seen = set()
            unique = []
            for v in values:
                key = json.dumps(v, sort_keys=True, default=str) if isinstance(v, (dict, list)) else str(v)
                if key not in seen:
                    seen.add(key)
                    unique.append(v)
            return {"output": unique, "count": len(unique), "total": len(values)}

        elif operation == "sort":
            direction = config.get("direction", "asc")
            reverse = direction == "desc"
            
            if field:
                def sort_key(item):
                    val = _get_nested_value(item, field) if isinstance(item, dict) else item
                    if _is_numeric(val):
                        return (0, float(val))
                    return (1, str(val) if val is not None else "")
                sorted_data = sorted(data, key=sort_key, reverse=reverse)
            else:
                sorted_data = sorted(data, key=lambda x: (0, float(x)) if _is_numeric(x) else (1, str(x)), reverse=reverse)
            
            return {"output": sorted_data, "count": len(sorted_data)}

        elif operation == "first":
            n = int(config.get("count", 5))
            result = data[:n]
            return {"output": result, "count": len(result), "total": len(data)}

        elif operation == "last":
            n = int(config.get("count", 5))
            result = data[-n:] if n <= len(data) else data
            return {"output": result, "count": len(result), "total": len(data)}

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except Exception as e:
        return {"error": str(e), "output": None}


def _is_numeric(value: Any) -> bool:
    """Check if a value can be converted to float."""
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        try:
            float(value)
            return True
        except ValueError:
            return False
    return False
