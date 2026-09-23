"""
Crypto Executor - Hashing, HMAC, encoding/decoding, JWT, UUID operations.
"""

import hashlib
import hmac as hmac_lib
import base64
import urllib.parse
import uuid
import json
import re
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


async def execute_crypto(node_data: dict, input_data: dict) -> dict:
    """Execute a cryptographic operation."""
    config = node_data.get("config", {})
    operation = config.get("operation", "hash")
    input_text = config.get("inputData", "") or config.get("input", "")
    
    # Substitute variables
    input_text = _substitute_variables(input_text, input_data)
    
    # If no explicit input, use upstream data
    if not input_text:
        output = input_data.get("output", input_data)
        if isinstance(output, dict):
            input_text = json.dumps(output, sort_keys=True)
        else:
            input_text = str(output) if output else ""

    try:
        if operation == "hash":
            algorithm = config.get("algorithm", "sha256")
            h = hashlib.new(algorithm, input_text.encode('utf-8'))
            digest = h.hexdigest()
            return {
                "output": digest,
                "algorithm": algorithm,
                "input_length": len(input_text),
            }

        elif operation == "hmac":
            algorithm = config.get("algorithm", "sha256")
            secret = config.get("secret", "")
            secret = _substitute_variables(secret, input_data)
            
            if not secret:
                return {"error": "HMAC requires a secret key", "output": None}
            
            h = hmac_lib.new(
                secret.encode('utf-8'),
                input_text.encode('utf-8'),
                getattr(hashlib, algorithm)
            )
            return {
                "output": h.hexdigest(),
                "algorithm": algorithm,
            }

        elif operation == "base64_encode":
            encoded = base64.b64encode(input_text.encode('utf-8')).decode('utf-8')
            return {"output": encoded, "original_length": len(input_text)}

        elif operation == "base64_decode":
            try:
                decoded = base64.b64decode(input_text.encode('utf-8')).decode('utf-8')
                return {"output": decoded}
            except Exception:
                return {"error": "Invalid base64 input", "output": None}

        elif operation == "url_encode":
            encoded = urllib.parse.quote(input_text, safe='')
            return {"output": encoded}

        elif operation == "url_decode":
            decoded = urllib.parse.unquote(input_text)
            return {"output": decoded}

        elif operation == "jwt_decode":
            # Decode JWT without verification (inspection only)
            parts = input_text.split('.')
            if len(parts) < 2:
                return {"error": "Invalid JWT format", "output": None}
            
            # Decode header and payload
            def _b64_decode_part(part: str) -> dict:
                padding = 4 - len(part) % 4
                part += '=' * padding
                decoded = base64.urlsafe_b64decode(part)
                return json.loads(decoded)
            
            header = _b64_decode_part(parts[0])
            payload = _b64_decode_part(parts[1])
            
            return {
                "output": payload,
                "header": header,
                "has_signature": len(parts) == 3,
                "warning": "Signature NOT verified",
            }

        elif operation == "uuid":
            generated = str(uuid.uuid4())
            return {"output": generated}

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except Exception as e:
        return {"error": str(e), "output": None}
