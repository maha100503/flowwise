"""
Cache Executor - In-memory key-value cache with TTL support.
Persists across workflow executions within the same server instance.
"""

import time
import json
import re
from typing import Any

# Global in-memory cache store: { namespace: { key: { value, expires_at } } }
_CACHE_STORE: dict[str, dict[str, dict]] = {}


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
        else:
            return None
    return value


def _get_namespace(namespace: str) -> dict:
    if namespace not in _CACHE_STORE:
        _CACHE_STORE[namespace] = {}
    return _CACHE_STORE[namespace]


def _cleanup_expired(ns_store: dict) -> None:
    now = time.time()
    expired = [k for k, v in ns_store.items() if v.get("expires_at") and v["expires_at"] < now]
    for k in expired:
        del ns_store[k]


async def execute_cache(node_data: dict, input_data: dict) -> dict:
    """Execute a cache operation."""
    config = node_data.get("config", {})
    operation = config.get("operation", "get")
    namespace = _substitute_variables(config.get("namespace", "default") or "default", input_data)
    key = _substitute_variables(config.get("key", ""), input_data)
    ttl = int(config.get("ttl", 300) or 300)

    ns_store = _get_namespace(namespace)
    _cleanup_expired(ns_store)

    try:
        if operation == "get":
            if not key:
                return {"error": "Key is required for get operation", "output": None}
            entry = ns_store.get(key)
            if entry is None:
                return {"output": None, "found": False, "key": key}
            return {"output": entry["value"], "found": True, "key": key}

        elif operation == "set":
            if not key:
                return {"error": "Key is required for set operation", "output": None}
            value_str = config.get("value", "")
            if value_str:
                value = _substitute_variables(value_str, input_data)
                # Try to parse JSON
                try:
                    value = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    pass
            else:
                # Cache the input data
                value = input_data.get("output", input_data)

            expires_at = time.time() + ttl if ttl > 0 else None
            ns_store[key] = {"value": value, "expires_at": expires_at}
            return {
                "output": value,
                "key": key,
                "ttl": ttl,
                "stored": True,
            }

        elif operation == "delete":
            if not key:
                return {"error": "Key is required for delete operation", "output": None}
            existed = key in ns_store
            if existed:
                del ns_store[key]
            return {"output": existed, "key": key, "deleted": existed}

        elif operation == "has":
            if not key:
                return {"error": "Key is required for has operation", "output": None}
            exists = key in ns_store
            return {"output": exists, "key": key, "exists": exists}

        elif operation == "clear":
            count = len(ns_store)
            ns_store.clear()
            return {"output": count, "namespace": namespace, "cleared": count}

        elif operation == "keys":
            keys = list(ns_store.keys())
            return {"output": keys, "namespace": namespace, "count": len(keys)}

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except Exception as e:
        return {"error": str(e), "output": None}
