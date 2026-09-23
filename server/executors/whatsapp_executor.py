"""
WhatsApp Executor - Send messages via WhatsApp Business Cloud API (Meta).
Uses the official Meta Business API for WhatsApp.

Actions:
  - send_text: Send a text message
  - send_template: Send a template message
  - send_media: Send image/document/video
  - send_interactive: Send interactive buttons/lists
"""

import os
import re
import json
import aiohttp
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

WHATSAPP_API_BASE = "https://graph.facebook.com/v19.0"


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


async def execute_whatsapp(node_data: dict, input_data: dict) -> dict:
    """Execute a WhatsApp message action."""
    config = node_data.get("config", {})
    action = config.get("action", "send_text")

    token = config.get("accessToken", "") or os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    phone_number_id = config.get("phoneNumberId", "") or os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

    if not token:
        return {"error": "WhatsApp Business API access token is required. Set WHATSAPP_ACCESS_TOKEN in .env", "output": None}
    if not phone_number_id:
        return {"error": "WhatsApp Phone Number ID is required. Set WHATSAPP_PHONE_NUMBER_ID in .env", "output": None}

    try:
        if action == "send_text":
            return await _send_text(config, input_data, token, phone_number_id)
        elif action == "send_template":
            return await _send_template(config, input_data, token, phone_number_id)
        elif action == "send_media":
            return await _send_media(config, input_data, token, phone_number_id)
        elif action == "send_interactive":
            return await _send_interactive(config, input_data, token, phone_number_id)
        else:
            return {"error": f"Unknown WhatsApp action: {action}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _whatsapp_request(phone_number_id: str, token: str, payload: dict) -> dict:
    url = f"{WHATSAPP_API_BASE}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            try:
                data = await resp.json()
            except Exception:
                data = {"raw": await resp.text()}
            data["_status"] = resp.status
            return data


async def _send_text(config: dict, input_data: dict, token: str, phone_number_id: str) -> dict:
    to_number = _substitute_variables(config.get("toNumber", ""), input_data)
    message = _substitute_variables(config.get("message", ""), input_data)
    preview_url = config.get("previewUrl", False)

    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", ""))

    if not to_number:
        return {"error": "Recipient phone number is required (with country code, e.g. +1234567890)", "output": None}
    if not message:
        return {"error": "Message text is required", "output": None}

    # Strip + and non-digits for WhatsApp API
    to_clean = re.sub(r'[^\d]', '', to_number)

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_clean,
        "type": "text",
        "text": {"preview_url": preview_url, "body": message},
    }

    result = await _whatsapp_request(phone_number_id, token, payload)

    if result.get("messages"):
        msg_id = result["messages"][0].get("id", "")
        return {
            "output": {"success": True, "messageId": msg_id, "to": to_number},
            "action": "send_text",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to send WhatsApp message"), "output": None}


async def _send_template(config: dict, input_data: dict, token: str, phone_number_id: str) -> dict:
    to_number = _substitute_variables(config.get("toNumber", ""), input_data)
    template_name = config.get("templateName", "")
    language_code = config.get("languageCode", "en_US")

    if not to_number or not template_name:
        return {"error": "Recipient number and template name are required", "output": None}

    to_clean = re.sub(r'[^\d]', '', to_number)

    # Parse template parameters
    params_raw = config.get("templateParams", "")
    params_list = []
    if params_raw:
        params_str = _substitute_variables(params_raw, input_data)
        try:
            params_list = json.loads(params_str) if params_str.startswith("[") else [p.strip() for p in params_str.split(",")]
        except json.JSONDecodeError:
            params_list = [p.strip() for p in params_str.split(",")]

    components = []
    if params_list:
        parameters = [{"type": "text", "text": str(p)} for p in params_list]
        components.append({"type": "body", "parameters": parameters})

    payload = {
        "messaging_product": "whatsapp",
        "to": to_clean,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
        },
    }
    if components:
        payload["template"]["components"] = components

    result = await _whatsapp_request(phone_number_id, token, payload)

    if result.get("messages"):
        return {
            "output": {"success": True, "messageId": result["messages"][0].get("id"), "template": template_name},
            "action": "send_template",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to send template"), "output": None}


async def _send_media(config: dict, input_data: dict, token: str, phone_number_id: str) -> dict:
    to_number = _substitute_variables(config.get("toNumber", ""), input_data)
    media_type = config.get("mediaType", "image")  # image, document, video, audio
    media_url = _substitute_variables(config.get("mediaUrl", ""), input_data)
    caption = _substitute_variables(config.get("caption", ""), input_data)

    if not to_number or not media_url:
        return {"error": "Recipient number and media URL are required", "output": None}

    to_clean = re.sub(r'[^\d]', '', to_number)

    media_obj = {"link": media_url}
    if caption and media_type in ("image", "video", "document"):
        media_obj["caption"] = caption

    payload = {
        "messaging_product": "whatsapp",
        "to": to_clean,
        "type": media_type,
        media_type: media_obj,
    }

    result = await _whatsapp_request(phone_number_id, token, payload)

    if result.get("messages"):
        return {
            "output": {"success": True, "messageId": result["messages"][0].get("id"), "mediaType": media_type},
            "action": "send_media",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to send media"), "output": None}


async def _send_interactive(config: dict, input_data: dict, token: str, phone_number_id: str) -> dict:
    to_number = _substitute_variables(config.get("toNumber", ""), input_data)
    interactive_type = config.get("interactiveType", "button")  # button or list
    header_text = _substitute_variables(config.get("headerText", ""), input_data)
    body_text = _substitute_variables(config.get("bodyText", ""), input_data)
    footer_text = _substitute_variables(config.get("footerText", ""), input_data)
    buttons_raw = config.get("buttons", "")

    if not to_number or not body_text:
        return {"error": "Recipient number and body text are required", "output": None}

    to_clean = re.sub(r'[^\d]', '', to_number)

    interactive = {"type": interactive_type, "body": {"text": body_text}}

    if header_text:
        interactive["header"] = {"type": "text", "text": header_text}
    if footer_text:
        interactive["footer"] = {"text": footer_text}

    if interactive_type == "button" and buttons_raw:
        try:
            buttons = json.loads(buttons_raw) if isinstance(buttons_raw, str) else buttons_raw
        except json.JSONDecodeError:
            buttons = [{"type": "reply", "reply": {"id": f"btn_{i}", "title": b.strip()}} for i, b in enumerate(buttons_raw.split(","))]
        interactive["action"] = {"buttons": buttons[:3]}

    payload = {
        "messaging_product": "whatsapp",
        "to": to_clean,
        "type": "interactive",
        "interactive": interactive,
    }

    result = await _whatsapp_request(phone_number_id, token, payload)

    if result.get("messages"):
        return {
            "output": {"success": True, "messageId": result["messages"][0].get("id"), "type": interactive_type},
            "action": "send_interactive",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to send interactive message"), "output": None}
