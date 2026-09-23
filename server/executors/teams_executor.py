"""
Microsoft Teams Executor - Send/read messages to Teams channels and chats.
Uses Microsoft Graph API via OAuth2 tokens.

Actions:
  - send_channel: Post to a Teams channel
  - send_chat: Send a 1:1 or group chat message
  - read_channel: Fetch recent channel messages
  - list_teams: List joined teams
  - list_channels: List channels in a team
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
    """Replace {{variable}} patterns with values from data."""
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
    """Make authenticated request to Microsoft Graph API."""
    url = f"{GRAPH_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
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


async def execute_teams(node_data: dict, input_data: dict) -> dict:
    """Execute a Microsoft Teams action."""
    config = node_data.get("config", {})
    action = config.get("action", "send_channel")

    # Token from config or env
    token = config.get("accessToken", "") or os.getenv("MICROSOFT_ACCESS_TOKEN", "")
    if not token:
        return {"error": "Microsoft access token is required. Configure OAuth or set MICROSOFT_ACCESS_TOKEN in .env", "output": None}

    try:
        if action == "send_channel":
            return await _send_channel_message(config, input_data, token)
        elif action == "send_chat":
            return await _send_chat_message(config, input_data, token)
        elif action == "read_channel":
            return await _read_channel_messages(config, input_data, token)
        elif action == "list_teams":
            return await _list_teams(token)
        elif action == "list_channels":
            return await _list_channels(config, token)
        else:
            return {"error": f"Unknown Teams action: {action}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _send_channel_message(config: dict, input_data: dict, token: str) -> dict:
    team_id = _substitute_variables(config.get("teamId", ""), input_data)
    channel_id = _substitute_variables(config.get("channelId", ""), input_data)
    message = _substitute_variables(config.get("message", ""), input_data)

    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", ""))

    if not team_id or not channel_id:
        return {"error": "Team ID and Channel ID are required", "output": None}
    if not message:
        return {"error": "Message is required", "output": None}

    content_type = "html" if config.get("isHtml", False) else "text"
    body = {
        "body": {
            "contentType": content_type,
            "content": message,
        }
    }

    result = await _graph_request(
        "POST",
        f"/teams/{team_id}/channels/{channel_id}/messages",
        token,
        json_body=body,
    )

    if result.get("id"):
        return {
            "output": {
                "success": True,
                "messageId": result["id"],
                "teamId": team_id,
                "channelId": channel_id,
            },
            "action": "send_channel",
        }
    return {"error": result.get("error", {}).get("message", "Failed to send message"), "output": None}


async def _send_chat_message(config: dict, input_data: dict, token: str) -> dict:
    chat_id = _substitute_variables(config.get("chatId", ""), input_data)
    user_email = _substitute_variables(config.get("userEmail", ""), input_data)
    message = _substitute_variables(config.get("message", ""), input_data)

    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", ""))

    if not message:
        return {"error": "Message is required", "output": None}

    # If no chat_id but have user email, create a 1:1 chat first
    if not chat_id and user_email:
        # Get current user
        me = await _graph_request("GET", "/me", token)
        my_id = me.get("id")
        if not my_id:
            return {"error": "Could not get current user. Token may lack User.Read scope.", "output": None}

        # Get target user by email
        user = await _graph_request("GET", f"/users/{user_email}", token)
        target_id = user.get("id")
        if not target_id:
            return {"error": f"Could not find user: {user_email}", "output": None}

        # Create 1:1 chat
        chat_body = {
            "chatType": "oneOnOne",
            "members": [
                {"@odata.type": "#microsoft.graph.aadUserConversationMember", "roles": ["owner"], "user@odata.bind": f"https://graph.microsoft.com/v1.0/users('{my_id}')"},
                {"@odata.type": "#microsoft.graph.aadUserConversationMember", "roles": ["owner"], "user@odata.bind": f"https://graph.microsoft.com/v1.0/users('{target_id}')"},
            ],
        }
        chat = await _graph_request("POST", "/chats", token, json_body=chat_body)
        chat_id = chat.get("id")
        if not chat_id:
            return {"error": "Failed to create chat", "output": None}

    if not chat_id:
        return {"error": "Chat ID or user email is required", "output": None}

    body = {"body": {"contentType": "text", "content": message}}
    result = await _graph_request("POST", f"/chats/{chat_id}/messages", token, json_body=body)

    if result.get("id"):
        return {
            "output": {"success": True, "messageId": result["id"], "chatId": chat_id},
            "action": "send_chat",
        }
    return {"error": result.get("error", {}).get("message", "Failed to send chat"), "output": None}


async def _read_channel_messages(config: dict, input_data: dict, token: str) -> dict:
    team_id = _substitute_variables(config.get("teamId", ""), input_data)
    channel_id = _substitute_variables(config.get("channelId", ""), input_data)
    max_messages = int(config.get("maxMessages", 10))

    if not team_id or not channel_id:
        return {"error": "Team ID and Channel ID are required", "output": None}

    result = await _graph_request(
        "GET",
        f"/teams/{team_id}/channels/{channel_id}/messages",
        token,
        params={"$top": str(max_messages)},
    )

    messages = result.get("value", [])
    parsed = []
    for msg in messages:
        parsed.append({
            "id": msg.get("id"),
            "from": msg.get("from", {}).get("user", {}).get("displayName", "Unknown"),
            "body": msg.get("body", {}).get("content", ""),
            "createdAt": msg.get("createdDateTime"),
        })

    return {"output": parsed, "count": len(parsed), "action": "read_channel"}


async def _list_teams(token: str) -> dict:
    result = await _graph_request("GET", "/me/joinedTeams", token)
    teams = result.get("value", [])
    parsed = [{"id": t["id"], "name": t.get("displayName", ""), "description": t.get("description", "")} for t in teams]
    return {"output": parsed, "count": len(parsed), "action": "list_teams"}


async def _list_channels(config: dict, token: str) -> dict:
    team_id = config.get("teamId", "")
    if not team_id:
        return {"error": "Team ID is required", "output": None}
    result = await _graph_request("GET", f"/teams/{team_id}/channels", token)
    channels = result.get("value", [])
    parsed = [{"id": c["id"], "name": c.get("displayName", ""), "description": c.get("description", "")} for c in channels]
    return {"output": parsed, "count": len(parsed), "action": "list_channels"}
