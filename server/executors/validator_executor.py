"""
Validator Executor - Data validation with branching (valid/invalid outputs).
Supports JSON schema, type checking, required fields, range checks, and custom rules.
"""

import json
import re
import ast
from typing import Any


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


async def execute_validator(node_data: dict, input_data: dict) -> dict:
    """Execute a validation operation. Returns branch='valid' or 'invalid'."""
    config = node_data.get("config", {})
    validation_type = config.get("validationType", "json_schema")

    data = input_data.get("output", input_data)

    try:
        if validation_type == "json_schema":
            schema_str = config.get("schema", "{}")
            try:
                schema = json.loads(schema_str) if isinstance(schema_str, str) else schema_str
            except json.JSONDecodeError:
                return {"error": "Invalid JSON schema", "output": None, "branch": "invalid"}

            errors = _validate_schema(data, schema)
            is_valid = len(errors) == 0
            return {
                "output": data,
                "valid": is_valid,
                "errors": errors,
                "branch": "valid" if is_valid else "invalid",
            }

        elif validation_type == "required_fields":
            fields_str = config.get("requiredFields", "")
            fields = [f.strip() for f in fields_str.split(",") if f.strip()]
            
            if not isinstance(data, dict):
                return {
                    "output": data,
                    "valid": False,
                    "errors": ["Input is not an object"],
                    "branch": "invalid",
                }
            
            missing = [f for f in fields if _get_nested_value(data, f) is None]
            is_valid = len(missing) == 0
            return {
                "output": data,
                "valid": is_valid,
                "missing_fields": missing,
                "errors": [f"Missing field: {f}" for f in missing],
                "branch": "valid" if is_valid else "invalid",
            }

        elif validation_type == "type_check":
            rules_str = config.get("typeRules", "{}")
            try:
                rules = json.loads(rules_str) if isinstance(rules_str, str) else rules_str
            except json.JSONDecodeError:
                return {"error": "Invalid type rules JSON", "output": None, "branch": "invalid"}

            type_map = {
                "string": str, "number": (int, float), "boolean": bool,
                "object": dict, "array": list, "null": type(None),
                "int": int, "float": float, "list": list, "dict": dict,
            }

            errors = []
            if isinstance(data, dict):
                for field, expected_type in rules.items():
                    value = _get_nested_value(data, field)
                    expected = type_map.get(expected_type)
                    if expected and value is not None and not isinstance(value, expected):
                        errors.append(f"{field}: expected {expected_type}, got {type(value).__name__}")
            
            is_valid = len(errors) == 0
            return {
                "output": data,
                "valid": is_valid,
                "errors": errors,
                "branch": "valid" if is_valid else "invalid",
            }

        elif validation_type == "range_check":
            rules_str = config.get("rangeRules", "{}")
            try:
                rules = json.loads(rules_str) if isinstance(rules_str, str) else rules_str
            except json.JSONDecodeError:
                return {"error": "Invalid range rules JSON", "output": None, "branch": "invalid"}

            errors = []
            if isinstance(data, dict):
                for field, bounds in rules.items():
                    value = _get_nested_value(data, field)
                    if value is not None:
                        try:
                            num_val = float(value)
                            if "min" in bounds and num_val < bounds["min"]:
                                errors.append(f"{field}: {num_val} < min({bounds['min']})")
                            if "max" in bounds and num_val > bounds["max"]:
                                errors.append(f"{field}: {num_val} > max({bounds['max']})")
                        except (ValueError, TypeError):
                            errors.append(f"{field}: not a number")
            
            is_valid = len(errors) == 0
            return {
                "output": data,
                "valid": is_valid,
                "errors": errors,
                "branch": "valid" if is_valid else "invalid",
            }

        elif validation_type == "custom_rules":
            expression = config.get("expression", "True")
            # Safety: use ast to parse and only allow safe operations
            try:
                tree = ast.parse(expression, mode='eval')
                # Very restricted: only allow comparisons and basic ops
                safe_builtins = {"len": len, "str": str, "int": int, "float": float, "bool": bool, "list": list, "dict": dict, "True": True, "False": False, "None": None}
                result = eval(compile(tree, "<validator>", "eval"), {"__builtins__": safe_builtins}, {"data": data})
                is_valid = bool(result)
                return {
                    "output": data,
                    "valid": is_valid,
                    "expression": expression,
                    "branch": "valid" if is_valid else "invalid",
                }
            except Exception as e:
                return {
                    "output": data,
                    "valid": False,
                    "errors": [f"Expression error: {str(e)}"],
                    "branch": "invalid",
                }

        else:
            return {"error": f"Unknown validation type: {validation_type}", "output": None, "branch": "invalid"}

    except Exception as e:
        return {"error": str(e), "output": None, "branch": "invalid"}


def _validate_schema(data: Any, schema: dict, path: str = "$") -> list[str]:
    """Basic JSON schema validation."""
    errors = []
    
    expected_type = schema.get("type")
    if expected_type:
        type_map = {
            "string": str, "number": (int, float), "integer": int,
            "boolean": bool, "object": dict, "array": list, "null": type(None),
        }
        expected = type_map.get(expected_type)
        if expected and not isinstance(data, expected):
            errors.append(f"{path}: expected {expected_type}, got {type(data).__name__}")
            return errors  # Type mismatch, skip further checks

    # Object validation
    if isinstance(data, dict) and expected_type == "object":
        required = schema.get("required", [])
        for req in required:
            if req not in data:
                errors.append(f"{path}: missing required field '{req}'")
        
        properties = schema.get("properties", {})
        for prop_name, prop_schema in properties.items():
            if prop_name in data:
                errors.extend(_validate_schema(data[prop_name], prop_schema, f"{path}.{prop_name}"))

    # Array validation
    if isinstance(data, list) and expected_type == "array":
        items_schema = schema.get("items")
        if items_schema:
            for i, item in enumerate(data):
                errors.extend(_validate_schema(item, items_schema, f"{path}[{i}]"))
        min_items = schema.get("minItems")
        if min_items and len(data) < min_items:
            errors.append(f"{path}: array has {len(data)} items, minimum is {min_items}")

    # String validation
    if isinstance(data, str):
        min_len = schema.get("minLength")
        max_len = schema.get("maxLength")
        if min_len and len(data) < min_len:
            errors.append(f"{path}: string too short ({len(data)} < {min_len})")
        if max_len and len(data) > max_len:
            errors.append(f"{path}: string too long ({len(data)} > {max_len})")
        pattern = schema.get("pattern")
        if pattern and not re.search(pattern, data):
            errors.append(f"{path}: doesn't match pattern '{pattern}'")

    return errors
