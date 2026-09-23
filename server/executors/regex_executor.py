"""
Regex Executor - Pattern matching, replacement, splitting, and extraction.
"""

import re
import json
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
        else:
            return None
    return value


async def execute_regex(node_data: dict, input_data: dict) -> dict:
    """Execute a regex operation."""
    config = node_data.get("config", {})
    operation = config.get("operation", "match")
    pattern = config.get("pattern", "")
    flags_str = config.get("flags", "")
    text = config.get("testInput", "") or config.get("text", "")
    replacement = config.get("replacement", "")

    # Substitute variables
    pattern = _substitute_variables(pattern, input_data)
    text = _substitute_variables(text, input_data)
    replacement = _substitute_variables(replacement, input_data)

    # If no text provided, try to use input data
    if not text:
        output = input_data.get("output", input_data)
        text = str(output) if output else ""

    if not pattern:
        return {"error": "Regex pattern is required", "output": None}

    # Build flags
    flags = 0
    if 'i' in flags_str:
        flags |= re.IGNORECASE
    if 'm' in flags_str:
        flags |= re.MULTILINE
    if 's' in flags_str:
        flags |= re.DOTALL

    try:
        compiled = re.compile(pattern, flags)

        if operation == "match":
            match = compiled.search(text)
            if match:
                return {
                    "output": match.group(0),
                    "groups": list(match.groups()),
                    "span": list(match.span()),
                    "matched": True,
                }
            return {"output": None, "matched": False}

        elif operation == "match_all":
            matches = compiled.findall(text)
            return {
                "output": matches,
                "count": len(matches),
                "matched": len(matches) > 0,
            }

        elif operation == "replace":
            result = compiled.sub(replacement, text)
            return {
                "output": result,
                "original": text,
                "replacements_made": len(compiled.findall(text)),
            }

        elif operation == "split":
            parts = compiled.split(text)
            return {
                "output": parts,
                "count": len(parts),
            }

        elif operation == "extract":
            matches = list(compiled.finditer(text))
            groups = []
            for m in matches:
                gd = m.groupdict()
                if gd:
                    groups.append(gd)
                else:
                    groups.append(list(m.groups()))
            return {
                "output": groups if groups else [m.group(0) for m in compiled.finditer(text)],
                "count": len(matches),
            }

        elif operation == "test":
            matched = bool(compiled.search(text))
            return {
                "output": matched,
                "matched": matched,
                "branch": "true" if matched else "false",
            }

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except re.error as e:
        return {"error": f"Invalid regex: {str(e)}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}
