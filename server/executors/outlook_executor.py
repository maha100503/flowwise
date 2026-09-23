"""
Microsoft Outlook Executor - Send/read/search emails via Microsoft Graph API.

Actions:
  - send: Send an email
  - read_inbox: Read recent inbox messages
  - search: Search emails by query
  - reply: Reply to a specific message
  - create_draft: Create a draft email
"""

import os
import re
import json
import aiohttp
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


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


async def _graph_request(method: str, endpoint: str, token: str, json_body: dict = None, params: dict = None) -> dict:
    url = f"{GRAPH_BASE}{endpoint}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        kwargs = {"headers": headers}
        if json_body:
            kwargs["json"] = json_body
        if params:
            kwargs["params"] = params
        async with session.request(method, url, **kwargs) as resp:
            if resp.status in (202, 204):
                return {"success": True, "status": resp.status}
            try:
                data = await resp.json()
            except Exception:
                data = {"raw": await resp.text()}
            data["_status"] = resp.status
            return data


async def execute_outlook(node_data: dict, input_data: dict) -> dict:
    """Execute a Microsoft Outlook action."""
    config = node_data.get("config", {})
    action = config.get("action", "send")

    token = config.get("accessToken", "") or os.getenv("MICROSOFT_ACCESS_TOKEN", "")
    if not token:
        return {"error": "Microsoft access token is required. Configure OAuth or set MICROSOFT_ACCESS_TOKEN in .env", "output": None}

    try:
        if action == "send":
            return await _send_email(config, input_data, token)
        elif action == "read_inbox":
            return await _read_inbox(config, input_data, token)
        elif action == "search":
            return await _search_emails(config, input_data, token)
        elif action == "reply":
            return await _reply_email(config, input_data, token)
        elif action == "create_draft":
            return await _create_draft(config, input_data, token)
        else:
            return {"error": f"Unknown Outlook action: {action}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _send_email(config: dict, input_data: dict, token: str) -> dict:
    to = _substitute_variables(config.get("to", ""), input_data)
    cc = _substitute_variables(config.get("cc", ""), input_data)
    subject = _substitute_variables(config.get("subject", ""), input_data)
    body = _substitute_variables(config.get("body", ""), input_data)
    is_html = config.get("isHtml", False)

    if not body and isinstance(input_data, dict):
        body = str(input_data.get("output", ""))

    if not to:
        return {"error": "Recipient (to) is required", "output": None}
    if not subject:
        return {"error": "Subject is required", "output": None}

    to_recipients = [{"emailAddress": {"address": addr.strip()}} for addr in to.split(",") if addr.strip()]
    cc_recipients = [{"emailAddress": {"address": addr.strip()}} for addr in cc.split(",") if addr.strip()] if cc else []

    mail_body = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML" if is_html else "Text",
                "content": body,
            },
            "toRecipients": to_recipients,
        },
        "saveToSentItems": True,
    }
    if cc_recipients:
        mail_body["message"]["ccRecipients"] = cc_recipients

    result = await _graph_request("POST", "/me/sendMail", token, json_body=mail_body)

    if result.get("success") or result.get("_status") in (200, 202):
        return {
            "output": {"success": True, "message": f"Email sent to {to}", "subject": subject},
            "action": "send",
        }
    return {"error": result.get("error", {}).get("message", "Failed to send email"), "output": None}


async def _read_inbox(config: dict, input_data: dict, token: str) -> dict:
    max_messages = int(config.get("maxMessages", 10))
    folder = config.get("folder", "inbox")
    unread_only = config.get("unreadOnly", False)

    params = {"$top": str(max_messages), "$orderby": "receivedDateTime desc"}
    if unread_only:
        params["$filter"] = "isRead eq false"

    endpoint = f"/me/mailFolders/{folder}/messages" if folder != "inbox" else "/me/messages"
    result = await _graph_request("GET", endpoint, token, params=params)

    messages = result.get("value", [])
    parsed = []
    for msg in messages:
        parsed.append({
            "id": msg.get("id"),
            "subject": msg.get("subject", ""),
            "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
            "fromName": msg.get("from", {}).get("emailAddress", {}).get("name", ""),
            "receivedAt": msg.get("receivedDateTime"),
            "preview": msg.get("bodyPreview", "")[:200],
            "isRead": msg.get("isRead"),
            "hasAttachments": msg.get("hasAttachments"),
        })

    return {"output": parsed, "count": len(parsed), "action": "read_inbox"}


async def _search_emails(config: dict, input_data: dict, token: str) -> dict:
    query = _substitute_variables(config.get("searchQuery", ""), input_data)
    max_results = int(config.get("maxMessages", 10))

    if not query:
        return {"error": "Search query is required", "output": None}

    params = {"$search": f'"{query}"', "$top": str(max_results)}
    result = await _graph_request("GET", "/me/messages", token, params=params)

    messages = result.get("value", [])
    parsed = []
    for msg in messages:
        parsed.append({
            "id": msg.get("id"),
            "subject": msg.get("subject", ""),
            "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
            "receivedAt": msg.get("receivedDateTime"),
            "preview": msg.get("bodyPreview", "")[:200],
        })

    return {"output": parsed, "count": len(parsed), "action": "search", "query": query}


async def _reply_email(config: dict, input_data: dict, token: str) -> dict:
    message_id = _substitute_variables(config.get("messageId", ""), input_data)
    comment = _substitute_variables(config.get("replyBody", ""), input_data)

    if not comment and isinstance(input_data, dict):
        comment = str(input_data.get("output", ""))

    if not message_id:
        return {"error": "Message ID is required to reply", "output": None}
    if not comment:
        return {"error": "Reply body is required", "output": None}

    body = {"comment": comment}
    result = await _graph_request("POST", f"/me/messages/{message_id}/reply", token, json_body=body)

    if result.get("success") or result.get("_status") in (200, 202):
        return {"output": {"success": True, "message": "Reply sent", "messageId": message_id}, "action": "reply"}
    return {"error": result.get("error", {}).get("message", "Failed to reply"), "output": None}


async def _create_draft(config: dict, input_data: dict, token: str) -> dict:
    to = _substitute_variables(config.get("to", ""), input_data)
    subject = _substitute_variables(config.get("subject", ""), input_data)
    body = _substitute_variables(config.get("body", ""), input_data)
    is_html = config.get("isHtml", False)

    to_recipients = [{"emailAddress": {"address": addr.strip()}} for addr in to.split(",") if addr.strip()] if to else []

    draft_body = {
        "subject": subject,
        "body": {"contentType": "HTML" if is_html else "Text", "content": body or ""},
        "toRecipients": to_recipients,
    }

    result = await _graph_request("POST", "/me/messages", token, json_body=draft_body)

    if result.get("id"):
        return {"output": {"success": True, "draftId": result["id"], "subject": subject}, "action": "create_draft"}
    return {"error": result.get("error", {}).get("message", "Failed to create draft"), "output": None}
