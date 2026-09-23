"""
Telegram Executor - Send messages/media via Telegram Bot API.

Actions:
  - send_message: Send a text message
  - send_photo: Send a photo with optional caption
  - send_document: Send a document file
  - forward_message: Forward a message to another chat
  - get_updates: Get recent messages/updates
"""

import os
import re
import json
import aiohttp
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

TELEGRAM_API_BASE = "https://api.telegram.org"


def _substitute_variables(text: str, data: dict) -> str:
    def replacer(match):
        key = match.group(1)
        value = _get_nested_value(data, key)
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        return str(value) if value is not None else match.group(0)
    return re.sub(r'\{\{([^}]+)\}\}', replacer, text)


def _get_nested_value(data: dict, key: str) -> Any:
    keys = key.split('.')
    value = data
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return None
    return value


async def execute_telegram(node_data: dict, input_data: dict) -> dict:
    """Execute a Telegram Bot API action."""
    config = node_data.get("config", {})
    action = config.get("action", "send_message")

    bot_token = config.get("botToken", "") or os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not bot_token:
        return {"error": "Telegram Bot Token is required. Set TELEGRAM_BOT_TOKEN in .env or provide in node config", "output": None}

    try:
        if action == "send_message":
            return await _send_message(config, input_data, bot_token)
        elif action == "send_photo":
            return await _send_photo(config, input_data, bot_token)
        elif action == "send_document":
            return await _send_document(config, input_data, bot_token)
        elif action == "forward_message":
            return await _forward_message(config, input_data, bot_token)
        elif action == "get_updates":
            return await _get_updates(config, input_data, bot_token)
        else:
            return {"error": f"Unknown Telegram action: {action}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _telegram_request(bot_token: str, method: str, payload: dict = None) -> dict:
    url = f"{TELEGRAM_API_BASE}/bot{bot_token}/{method}"
    headers = {"Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        if payload:
            async with session.post(url, headers=headers, json=payload) as resp:
                data = await resp.json()
                return data
        else:
            async with session.get(url) as resp:
                data = await resp.json()
                return data


async def _send_message(config: dict, input_data: dict, bot_token: str) -> dict:
    chat_id = _substitute_variables(config.get("chatId", ""), input_data)
    message = _substitute_variables(config.get("message", ""), input_data)
    parse_mode = config.get("parseMode", "")  # HTML, Markdown, MarkdownV2, or empty
    disable_preview = config.get("disablePreview", False)
    disable_notification = config.get("disableNotification", False)

    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", ""))

    if not chat_id:
        return {"error": "Chat ID is required", "output": None}
    if not message:
        return {"error": "Message text is required", "output": None}

    payload = {
        "chat_id": chat_id,
        "text": message,
        "disable_web_page_preview": disable_preview,
        "disable_notification": disable_notification,
    }
    if parse_mode:
        payload["parse_mode"] = parse_mode

    result = await _telegram_request(bot_token, "sendMessage", payload)

    if result.get("ok"):
        msg = result["result"]
        return {
            "output": {
                "success": True,
                "messageId": msg.get("message_id"),
                "chatId": chat_id,
                "date": msg.get("date"),
            },
            "action": "send_message",
        }
    return {"error": result.get("description", "Failed to send Telegram message"), "output": None}


async def _send_photo(config: dict, input_data: dict, bot_token: str) -> dict:
    chat_id = _substitute_variables(config.get("chatId", ""), input_data)
    photo_url = _substitute_variables(config.get("photoUrl", ""), input_data)
    caption = _substitute_variables(config.get("caption", ""), input_data)

    if not chat_id or not photo_url:
        return {"error": "Chat ID and photo URL are required", "output": None}

    payload = {"chat_id": chat_id, "photo": photo_url}
    if caption:
        payload["caption"] = caption

    result = await _telegram_request(bot_token, "sendPhoto", payload)

    if result.get("ok"):
        msg = result["result"]
        return {
            "output": {
                "success": True,
                "messageId": msg.get("message_id"),
                "chatId": chat_id,
            },
            "action": "send_photo",
        }
    return {"error": result.get("description", "Failed to send photo"), "output": None}


async def _send_document(config: dict, input_data: dict, bot_token: str) -> dict:
    chat_id = _substitute_variables(config.get("chatId", ""), input_data)
    document_url = _substitute_variables(config.get("documentUrl", ""), input_data)
    caption = _substitute_variables(config.get("caption", ""), input_data)

    if not chat_id or not document_url:
        return {"error": "Chat ID and document URL are required", "output": None}

    payload = {"chat_id": chat_id, "document": document_url}
    if caption:
        payload["caption"] = caption

    result = await _telegram_request(bot_token, "sendDocument", payload)

    if result.get("ok"):
        msg = result["result"]
        return {
            "output": {
                "success": True,
                "messageId": msg.get("message_id"),
                "chatId": chat_id,
            },
            "action": "send_document",
        }
    return {"error": result.get("description", "Failed to send document"), "output": None}


async def _forward_message(config: dict, input_data: dict, bot_token: str) -> dict:
    chat_id = _substitute_variables(config.get("chatId", ""), input_data)
    from_chat_id = _substitute_variables(config.get("fromChatId", ""), input_data)
    message_id = config.get("messageId", "")

    if not chat_id or not from_chat_id or not message_id:
        return {"error": "Chat ID, from Chat ID, and message ID are required", "output": None}

    payload = {
        "chat_id": chat_id,
        "from_chat_id": from_chat_id,
        "message_id": int(message_id),
    }

    result = await _telegram_request(bot_token, "forwardMessage", payload)

    if result.get("ok"):
        msg = result["result"]
        return {
            "output": {
                "success": True,
                "messageId": msg.get("message_id"),
                "forwarded": True,
            },
            "action": "forward_message",
        }
    return {"error": result.get("description", "Failed to forward message"), "output": None}


async def _get_updates(config: dict, input_data: dict, bot_token: str) -> dict:
    offset = config.get("offset", "")
    limit = config.get("limit", 10)
    timeout = config.get("timeout", 0)

    payload = {"limit": int(limit), "timeout": int(timeout)}
    if offset:
        payload["offset"] = int(offset)

    result = await _telegram_request(bot_token, "getUpdates", payload)

    if result.get("ok"):
        updates = result.get("result", [])
        messages = []
        for upd in updates:
            msg = upd.get("message", {})
            messages.append({
                "updateId": upd.get("update_id"),
                "messageId": msg.get("message_id"),
                "chatId": msg.get("chat", {}).get("id"),
                "from": msg.get("from", {}).get("username", "unknown"),
                "text": msg.get("text", ""),
                "date": msg.get("date"),
            })
        return {
            "output": {"updates": messages, "count": len(messages)},
            "action": "get_updates",
        }
    return {"error": result.get("description", "Failed to get updates"), "output": None}
