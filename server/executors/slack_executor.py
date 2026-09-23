"""
Slack Executor - Send messages to Slack channels.
Supports Webhook URLs and Bot tokens.
"""

import os
import aiohttp
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


async def execute_slack(node_data: dict, input_data: dict) -> dict:
    """Execute a Slack message node."""
    
    config = node_data.get("config", {})
    
    channel = config.get("channel", "")
    message = config.get("message", "")
    webhook_url = config.get("webhookUrl", "") or os.getenv("SLACK_WEBHOOK_URL", "")
    bot_token = config.get("botToken", "") or os.getenv("SLACK_BOT_TOKEN", "")
    
    # Template substitution
    channel = _substitute_variables(channel, input_data)
    message = _substitute_variables(message, input_data)
    
    # If message is empty, check if input has an 'output' field to use
    if not message and isinstance(input_data, dict):
        message = str(input_data.get("output", input_data.get("text", "")))
    
    if not message:
        return {"error": "Message is required", "output": None}

    try:
        if webhook_url:
            return await _send_via_webhook(webhook_url, message, channel)
        elif bot_token:
            return await _send_via_bot(bot_token, message, channel)
        else:
            return {"error": "Either webhookUrl or botToken is required", "output": None}
    
    except Exception as e:
        return {"error": str(e), "output": None}


async def _send_via_webhook(webhook_url: str, message: str, channel: str) -> dict:
    """Send message via Slack Incoming Webhook."""
    
    payload = {"text": message}
    
    # Channel override only works for legacy webhooks
    if channel:
        payload["channel"] = channel
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        ) as response:
            response_text = await response.text()
            
            if response.status == 200 and response_text == "ok":
                return {
                    "output": {"success": True, "message": "Message sent to Slack"},
                    "channel": channel or "webhook-default",
                    "method": "webhook"
                }
            else:
                return {
                    "error": f"Slack webhook error: {response_text}",
                    "output": None
                }


async def _send_via_bot(bot_token: str, message: str, channel: str) -> dict:
    """Send message via Slack Bot (chat.postMessage API)."""
    
    if not channel:
        return {"error": "Channel is required when using bot token", "output": None}
    
    # Ensure channel starts with # or is a channel ID
    if not channel.startswith("#") and not channel.startswith("C"):
        channel = f"#{channel}"
    
    payload = {
        "channel": channel,
        "text": message,
        "mrkdwn": True
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json"
            },
            json=payload
        ) as response:
            result = await response.json()
            
            if result.get("ok"):
                return {
                    "output": {
                        "success": True,
                        "message": "Message sent to Slack",
                        "ts": result.get("ts"),
                        "channel": result.get("channel")
                    },
                    "channel": channel,
                    "method": "bot"
                }
            else:
                return {
                    "error": f"Slack API error: {result.get('error', 'Unknown error')}",
                    "output": None
                }


async def send_slack_blocks(bot_token: str, channel: str, blocks: list, text: str = "") -> dict:
    """Send rich message with Slack Blocks (for advanced formatting)."""
    
    if not channel:
        return {"error": "Channel is required", "output": None}
    
    payload = {
        "channel": channel,
        "blocks": blocks,
        "text": text or "New message"  # Fallback text for notifications
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://slack.com/api/chat.postMessage",
            headers={
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json"
            },
            json=payload
        ) as response:
            result = await response.json()
            
            if result.get("ok"):
                return {
                    "output": {"success": True, "ts": result.get("ts")},
                    "channel": channel
                }
            else:
                return {"error": result.get("error", "Unknown error"), "output": None}


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
    import re
    
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
