"""
Instagram Executor - Interact with Instagram via Meta Graph API.

Actions:
  - send_dm: Send a direct message (Instagram Messaging API)
  - post_comment: Comment on a media post
  - get_media: Get recent media/posts from user
  - get_comments: Get comments on a media post
  - publish_post: Create a media post (photo)
"""

import os
import re
import json
import aiohttp
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


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


async def execute_instagram(node_data: dict, input_data: dict) -> dict:
    """Execute an Instagram Graph API action."""
    config = node_data.get("config", {})
    action = config.get("action", "get_media")

    token = config.get("accessToken", "") or os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    ig_user_id = config.get("igUserId", "") or os.getenv("INSTAGRAM_USER_ID", "")

    if not token:
        return {"error": "Instagram access token is required. Set INSTAGRAM_ACCESS_TOKEN in .env", "output": None}

    try:
        if action == "send_dm":
            return await _send_dm(config, input_data, token, ig_user_id)
        elif action == "post_comment":
            return await _post_comment(config, input_data, token)
        elif action == "get_media":
            return await _get_media(config, input_data, token, ig_user_id)
        elif action == "get_comments":
            return await _get_comments(config, input_data, token)
        elif action == "publish_post":
            return await _publish_post(config, input_data, token, ig_user_id)
        else:
            return {"error": f"Unknown Instagram action: {action}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _graph_request(method: str, url: str, token: str, payload: dict = None, params: dict = None) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    if params is None:
        params = {}

    async with aiohttp.ClientSession() as session:
        if method.upper() == "GET":
            params["access_token"] = token
            async with session.get(url, params=params) as resp:
                try:
                    data = await resp.json()
                except Exception:
                    data = {"raw": await resp.text()}
                data["_status"] = resp.status
                return data
        else:
            headers["Content-Type"] = "application/json"
            async with session.post(url, headers=headers, json=payload) as resp:
                try:
                    data = await resp.json()
                except Exception:
                    data = {"raw": await resp.text()}
                data["_status"] = resp.status
                return data


async def _send_dm(config: dict, input_data: dict, token: str, ig_user_id: str) -> dict:
    recipient_id = _substitute_variables(config.get("recipientId", ""), input_data)
    message = _substitute_variables(config.get("message", ""), input_data)

    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", ""))

    if not ig_user_id:
        return {"error": "Instagram User ID is required for sending DMs", "output": None}
    if not recipient_id:
        return {"error": "Recipient ID (Instagram-scoped user ID) is required", "output": None}
    if not message:
        return {"error": "Message text is required", "output": None}

    url = f"{GRAPH_API_BASE}/{ig_user_id}/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message},
    }

    result = await _graph_request("POST", url, token, payload)

    if result.get("_status", 0) < 300 and not result.get("error"):
        return {
            "output": {
                "success": True,
                "recipientId": recipient_id,
                "messageId": result.get("message_id", result.get("id", "")),
            },
            "action": "send_dm",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to send Instagram DM"), "output": None}


async def _post_comment(config: dict, input_data: dict, token: str) -> dict:
    media_id = _substitute_variables(config.get("mediaId", ""), input_data)
    comment_text = _substitute_variables(config.get("commentText", ""), input_data)

    if not media_id:
        return {"error": "Media ID is required", "output": None}
    if not comment_text:
        return {"error": "Comment text is required", "output": None}

    url = f"{GRAPH_API_BASE}/{media_id}/comments"
    payload = {"message": comment_text}

    result = await _graph_request("POST", url, token, payload)

    if result.get("id"):
        return {
            "output": {"success": True, "commentId": result["id"], "mediaId": media_id},
            "action": "post_comment",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to post comment"), "output": None}


async def _get_media(config: dict, input_data: dict, token: str, ig_user_id: str) -> dict:
    limit = int(config.get("limit", 10))

    if not ig_user_id:
        return {"error": "Instagram User ID is required", "output": None}

    url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
    params = {
        "fields": "id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count",
        "limit": str(limit),
    }

    result = await _graph_request("GET", url, token, params=params)

    if "data" in result:
        posts = result["data"]
        return {
            "output": {"posts": posts, "count": len(posts)},
            "action": "get_media",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to get media"), "output": None}


async def _get_comments(config: dict, input_data: dict, token: str) -> dict:
    media_id = _substitute_variables(config.get("mediaId", ""), input_data)
    limit = int(config.get("limit", 25))

    if not media_id:
        return {"error": "Media ID is required", "output": None}

    url = f"{GRAPH_API_BASE}/{media_id}/comments"
    params = {
        "fields": "id,text,timestamp,from,like_count",
        "limit": str(limit),
    }

    result = await _graph_request("GET", url, token, params=params)

    if "data" in result:
        comments = result["data"]
        return {
            "output": {"comments": comments, "count": len(comments)},
            "action": "get_comments",
        }
    error = result.get("error", {})
    return {"error": error.get("message", "Failed to get comments"), "output": None}


async def _publish_post(config: dict, input_data: dict, token: str, ig_user_id: str) -> dict:
    image_url = _substitute_variables(config.get("imageUrl", ""), input_data)
    caption = _substitute_variables(config.get("caption", ""), input_data)

    if not ig_user_id:
        return {"error": "Instagram User ID is required", "output": None}
    if not image_url:
        return {"error": "Image URL is required for publishing", "output": None}

    # Step 1: Create media container
    container_url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
    container_payload = {"image_url": image_url}
    if caption:
        container_payload["caption"] = caption

    container_result = await _graph_request("POST", container_url, token, container_payload)

    creation_id = container_result.get("id")
    if not creation_id:
        error = container_result.get("error", {})
        return {"error": error.get("message", "Failed to create media container"), "output": None}

    # Step 2: Publish the container
    publish_url = f"{GRAPH_API_BASE}/{ig_user_id}/media_publish"
    publish_payload = {"creation_id": creation_id}

    publish_result = await _graph_request("POST", publish_url, token, publish_payload)

    if publish_result.get("id"):
        return {
            "output": {
                "success": True,
                "postId": publish_result["id"],
                "containerId": creation_id,
            },
            "action": "publish_post",
        }
    error = publish_result.get("error", {})
    return {"error": error.get("message", "Failed to publish post"), "output": None}
