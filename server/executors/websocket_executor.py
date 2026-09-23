"""
WebSocket Executor - Send messages via WebSocket connections.
"""

import json
import re
import asyncio
from typing import Any


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
    def replacer(match):
        key = match.group(1)
        value = _get_nested_value(data, key)
        if isinstance(value, (dict, list)):
            return json.dumps(value)
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


async def execute_websocket(node_data: dict, input_data: dict) -> dict:
    """Execute a WebSocket operation."""
    config = node_data.get("config", {})
    action = config.get("action", "send")
    url = config.get("url", "")
    message = config.get("message", "")
    timeout = int(config.get("timeout", 30))
    headers = config.get("headers", {})

    url = _substitute_variables(url, input_data)
    message = _substitute_variables(message, input_data)

    if isinstance(headers, str):
        try:
            headers = json.loads(headers)
        except (json.JSONDecodeError, TypeError):
            headers = {}

    if not url:
        return {"error": "WebSocket URL is required", "output": None}

    try:
        import aiohttp

        if action == "send":
            if not message:
                # Use input data as message
                msg_data = input_data.get("output", input_data)
                if isinstance(msg_data, (dict, list)):
                    message = json.dumps(msg_data)
                else:
                    message = str(msg_data) if msg_data else ""
            
            if not message:
                return {"error": "Message is required for send action", "output": None}

            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, headers=headers, timeout=timeout) as ws:
                    await ws.send_str(message)
                    # Wait for a response
                    try:
                        response = await asyncio.wait_for(ws.receive(), timeout=min(timeout, 10))
                        if response.type == aiohttp.WSMsgType.TEXT:
                            try:
                                resp_data = json.loads(response.data)
                            except json.JSONDecodeError:
                                resp_data = response.data
                            return {
                                "output": resp_data,
                                "sent": message[:200],
                                "action": "send",
                                "success": True,
                            }
                        elif response.type == aiohttp.WSMsgType.BINARY:
                            return {
                                "output": f"<binary {len(response.data)} bytes>",
                                "sent": message[:200],
                                "action": "send",
                                "success": True,
                            }
                    except asyncio.TimeoutError:
                        return {
                            "output": None,
                            "sent": message[:200],
                            "action": "send",
                            "success": True,
                            "note": "Message sent, no response within timeout",
                        }

            return {
                "output": None,
                "sent": message[:200],
                "action": "send",
                "success": True,
            }

        elif action == "listen":
            messages = []
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, headers=headers, timeout=timeout) as ws:
                    try:
                        while True:
                            msg = await asyncio.wait_for(ws.receive(), timeout=timeout)
                            if msg.type == aiohttp.WSMsgType.TEXT:
                                try:
                                    messages.append(json.loads(msg.data))
                                except json.JSONDecodeError:
                                    messages.append(msg.data)
                            elif msg.type == aiohttp.WSMsgType.CLOSED:
                                break
                            elif msg.type == aiohttp.WSMsgType.ERROR:
                                break
                            # Only collect up to first message for workflow execution
                            if len(messages) >= 1:
                                break
                    except asyncio.TimeoutError:
                        pass

            return {
                "output": messages[0] if len(messages) == 1 else messages,
                "count": len(messages),
                "action": "listen",
                "success": True,
            }

        elif action == "broadcast":
            channel = config.get("channel", "default")
            channel = _substitute_variables(channel, input_data)
            
            if not message:
                msg_data = input_data.get("output", input_data)
                if isinstance(msg_data, (dict, list)):
                    message = json.dumps(msg_data)
                else:
                    message = str(msg_data) if msg_data else ""

            # For broadcast, we wrap in a channel envelope
            broadcast_msg = json.dumps({
                "channel": channel,
                "data": message,
                "type": "broadcast",
            })

            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, headers=headers, timeout=timeout) as ws:
                    await ws.send_str(broadcast_msg)
                    return {
                        "output": {"channel": channel, "message": message[:200]},
                        "action": "broadcast",
                        "success": True,
                    }

        else:
            return {"error": f"Unknown action: {action}", "output": None}

    except ImportError:
        return {"error": "aiohttp is required for WebSocket connections", "output": None}
    except Exception as e:
        return {"error": f"WebSocket error: {str(e)}", "output": None}
