"""
JSON Transform Executor - Query, merge, flatten, diff, pick/omit, convert operations.
"""

import json
import re
import copy
from typing import Any


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
    def replacer(match):
        key = match.group(1)
        value = _get_nested_value(data, key)
        return str(value) if value is not None else match.group(0)
    return re.sub(r'\{\{([^}]+)\}\}', replacer, text)


def _get_nested_value(data: dict, key: str) -> Any:
    """Get a nested value using dot notation."""
    keys = key.split('.')
    value = data
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        elif isinstance(value, list):
            try:
                value = value[int(k)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return value


def _flatten_dict(d: dict, parent_key: str = '', sep: str = '.') -> dict:
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(_flatten_dict(v, new_key, sep).items())
        elif isinstance(v, list):
            for i, item in enumerate(v):
                if isinstance(item, dict):
                    items.extend(_flatten_dict(item, f"{new_key}[{i}]", sep).items())
                else:
                    items.append((f"{new_key}[{i}]", item))
        else:
            items.append((new_key, v))
    return dict(items)


def _unflatten_dict(d: dict, sep: str = '.') -> dict:
    result = {}
    for flat_key, value in d.items():
        keys = flat_key.split(sep)
        current = result
        for i, key in enumerate(keys[:-1]):
            if key not in current:
                current[key] = {}
            current = current[key]
        current[keys[-1]] = value
    return result


def _deep_merge(base: dict, override: dict) -> dict:
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def _json_diff(obj1: Any, obj2: Any, path: str = "") -> list:
    diffs = []
    if type(obj1) != type(obj2):
        diffs.append({"path": path or "$", "type": "type_change", "old": str(type(obj1).__name__), "new": str(type(obj2).__name__)})
        return diffs
    if isinstance(obj1, dict):
        all_keys = set(list(obj1.keys()) + list(obj2.keys()))
        for key in sorted(all_keys):
            p = f"{path}.{key}" if path else key
            if key not in obj1:
                diffs.append({"path": p, "type": "added", "value": obj2[key]})
            elif key not in obj2:
                diffs.append({"path": p, "type": "removed", "value": obj1[key]})
            else:
                diffs.extend(_json_diff(obj1[key], obj2[key], p))
    elif isinstance(obj1, list):
        for i in range(max(len(obj1), len(obj2))):
            p = f"{path}[{i}]"
            if i >= len(obj1):
                diffs.append({"path": p, "type": "added", "value": obj2[i]})
            elif i >= len(obj2):
                diffs.append({"path": p, "type": "removed", "value": obj1[i]})
            else:
                diffs.extend(_json_diff(obj1[i], obj2[i], p))
    elif obj1 != obj2:
        diffs.append({"path": path or "$", "type": "changed", "old": obj1, "new": obj2})
    return diffs


def _simple_jsonpath_query(data: Any, expression: str) -> Any:
    """Simple JSONPath query implementation supporting basic dot and bracket notation."""
    if expression.startswith('$'):
        expression = expression[1:]
    if expression.startswith('.'):
        expression = expression[1:]

    if not expression:
        return data

    # Handle recursive descent ..key
    if expression.startswith('.'):
        key = expression[1:].split('.')[0].split('[')[0]
        results = []
        _recursive_find(data, key, results)
        return results

    # Split on . but not inside brackets
    parts = re.split(r'\.(?![^\[]*\])', expression)
    current = data

    for part in parts:
        if not part:
            continue
        # Handle array index: key[0]
        bracket_match = re.match(r'(\w+)\[(\d+|\*)\]', part)
        if bracket_match:
            key, idx = bracket_match.group(1), bracket_match.group(2)
            if key and isinstance(current, dict):
                current = current.get(key)
            if current is None:
                return None
            if idx == '*':
                if isinstance(current, list):
                    # Continue with next parts for each element
                    remaining = '.'.join(parts[parts.index(part)+1:])
                    if remaining:
                        return [_simple_jsonpath_query(item, remaining) for item in current]
                    return current
            else:
                if isinstance(current, list) and int(idx) < len(current):
                    current = current[int(idx)]
                else:
                    return None
        elif isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            try:
                current = current[int(part)]
            except (ValueError, IndexError):
                return [_simple_jsonpath_query(item, part) if isinstance(item, dict) else None for item in current]
        else:
            return None

    return current


def _recursive_find(data: Any, key: str, results: list):
    if isinstance(data, dict):
        if key in data:
            results.append(data[key])
        for v in data.values():
            _recursive_find(v, key, results)
    elif isinstance(data, list):
        for item in data:
            _recursive_find(item, key, results)


async def execute_json_transform(node_data: dict, input_data: dict) -> dict:
    """Execute a JSON transformation operation."""
    config = node_data.get("config", {})
    operation = config.get("operation", "query")

    # Get input data - either from config or from upstream
    raw_input = config.get("input", "")
    if raw_input:
        raw_input = _substitute_variables(raw_input, input_data)
        try:
            data = json.loads(raw_input)
        except (json.JSONDecodeError, TypeError):
            data = raw_input
    else:
        data = input_data.get("output", input_data)

    try:
        if operation == "query":
            expression = config.get("expression", "$")
            result = _simple_jsonpath_query(data, expression)
            return {"output": result, "expression": expression}

        elif operation == "merge":
            merge_raw = config.get("mergeData", config.get("secondInput", "{}"))
            try:
                merge_obj = json.loads(merge_raw)
            except (json.JSONDecodeError, TypeError):
                merge_obj = {}
            if isinstance(data, dict):
                result = _deep_merge(data, merge_obj)
            else:
                result = merge_obj
            return {"output": result}

        elif operation == "flatten":
            sep = config.get("separator", ".")
            if isinstance(data, dict):
                return {"output": _flatten_dict(data, sep=sep)}
            return {"error": "Flatten requires a dict/object input", "output": None}

        elif operation == "unflatten":
            sep = config.get("separator", ".")
            if isinstance(data, dict):
                return {"output": _unflatten_dict(data, sep=sep)}
            return {"error": "Unflatten requires a flat dict/object input", "output": None}

        elif operation == "pick":
            keys_str = config.get("keys", "")
            keys = [k.strip() for k in keys_str.split(",") if k.strip()]
            if isinstance(data, dict):
                result = {k: data[k] for k in keys if k in data}
                return {"output": result, "picked": list(result.keys())}
            return {"error": "Pick requires a dict/object input", "output": None}

        elif operation == "omit":
            keys_str = config.get("keys", "")
            keys = [k.strip() for k in keys_str.split(",") if k.strip()]
            if isinstance(data, dict):
                result = {k: v for k, v in data.items() if k not in keys}
                return {"output": result, "omitted": keys}
            return {"error": "Omit requires a dict/object input", "output": None}

        elif operation == "sort_keys":
            if isinstance(data, dict):
                return {"output": dict(sorted(data.items()))}
            return {"error": "Sort keys requires a dict/object input", "output": None}

        elif operation == "to_array":
            if isinstance(data, dict):
                result = [{"key": k, "value": v} for k, v in data.items()]
                return {"output": result, "count": len(result)}
            return {"output": data if isinstance(data, list) else [data]}

        elif operation == "from_array":
            key_field = config.get("keyField", "id")
            if isinstance(data, list):
                result = {}
                for item in data:
                    if isinstance(item, dict) and key_field in item:
                        result[str(item[key_field])] = item
                return {"output": result, "count": len(result)}
            return {"error": "from_array requires a list input", "output": None}

        elif operation == "diff":
            compare_raw = config.get("compareData", config.get("secondInput", "{}"))
            try:
                compare_obj = json.loads(compare_raw)
            except (json.JSONDecodeError, TypeError):
                compare_obj = {}
            diffs = _json_diff(data, compare_obj)
            return {
                "output": diffs,
                "has_changes": len(diffs) > 0,
                "change_count": len(diffs),
            }

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except Exception as e:
        return {"error": str(e), "output": None}
