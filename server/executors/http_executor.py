"""
HTTP Request Executor - Make HTTP requests to external APIs.
Supports GET, POST, PUT, DELETE, PATCH methods.
"""

import aiohttp
import json
from typing import Any


async def execute_http(node_data: dict, input_data: dict) -> dict:
    """Execute an HTTP request node."""
    
    config = node_data.get("config", {})
    method = node_data.get("subType", config.get("method", "GET")).upper()
    
    url = config.get("url", "")
    headers = config.get("headers", {})
    body = config.get("body", {})
    timeout = config.get("timeout", 30)
    
    # Template substitution - replace {{variable}} with input data
    url = _substitute_variables(url, input_data)
    headers = _substitute_dict_variables(headers, input_data)
    body = _substitute_dict_variables(body, input_data)

    if not url:
        return {"error": "URL is required", "output": None}

    try:
        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                "url": url,
                "headers": headers,
                "timeout": aiohttp.ClientTimeout(total=timeout)
            }
            
            # Add body for methods that support it
            if method in ("POST", "PUT", "PATCH") and body:
                if isinstance(body, dict):
                    request_kwargs["json"] = body
                else:
                    request_kwargs["data"] = body

            async with session.request(method, **request_kwargs) as response:
                # Try to parse as JSON, fall back to text
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()

                return {
                    "output": response_data,
                    "status_code": response.status,
                    "headers": dict(response.headers),
                    "method": method,
                    "url": url,
                    "success": 200 <= response.status < 300
                }

    except aiohttp.ClientError as e:
        return {
            "error": f"HTTP request failed: {str(e)}",
            "output": None,
            "method": method,
            "url": url
        }
    except Exception as e:
        return {
            "error": str(e),
            "output": None
        }


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
    import re
    
    def replacer(match):
        key = match.group(1)
        value = _get_nested_value(data, key)
        return str(value) if value is not None else match.group(0)
    
    return re.sub(r'\{\{([^}]+)\}\}', replacer, text)


def _substitute_dict_variables(obj: Any, data: dict) -> Any:
    """Recursively substitute variables in a dict/list structure."""
    if isinstance(obj, str):
        return _substitute_variables(obj, data)
    elif isinstance(obj, dict):
        return {k: _substitute_dict_variables(v, data) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_substitute_dict_variables(item, data) for item in obj]
    return obj


def _get_nested_value(data: dict, key: str) -> Any:
    """Get a nested value using dot notation (e.g., 'user.name')."""
    keys = key.split('.')
    value = data
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return None
    return value
