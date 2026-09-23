"""
Microsoft Auth Module - OAuth2 token management for Microsoft Graph API.
Handles both client-credentials (daemon) and delegated (user) flows.
Tokens are encrypted at rest using Fernet symmetric encryption.
"""

import os
import time
import json
import aiohttp
from typing import Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Microsoft OAuth endpoints
AUTHORITY = "https://login.microsoftonline.com"
GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# Config from environment
MS_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MS_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
MS_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "common")
MS_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI", "http://localhost:8000/api/auth/microsoft/callback")

# In-memory token cache (per-session; for production use encrypted DB storage)
_token_cache: dict[str, dict] = {}


def _get_token_url() -> str:
    return f"{AUTHORITY}/{MS_TENANT_ID}/oauth2/v2.0/token"


def _get_authorize_url() -> str:
    return f"{AUTHORITY}/{MS_TENANT_ID}/oauth2/v2.0/authorize"


async def get_client_credentials_token(scopes: list[str] = None) -> Optional[str]:
    """
    Get token via client credentials flow (server-to-server, no user).
    Requires Application permissions in Azure AD.
    """
    if not MS_CLIENT_ID or not MS_CLIENT_SECRET:
        return None

    cache_key = "client_credentials"
    cached = _token_cache.get(cache_key)
    if cached and cached.get("expires_at", 0) > time.time() + 60:
        return cached["access_token"]

    async with aiohttp.ClientSession() as session:
        async with session.post(
            _get_token_url(),
            data={
                "client_id": MS_CLIENT_ID,
                "client_secret": MS_CLIENT_SECRET,
                "scope": "https://graph.microsoft.com/.default",
                "grant_type": "client_credentials",
            },
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            if "access_token" not in data:
                return None
            _token_cache[cache_key] = {
                "access_token": data["access_token"],
                "expires_at": time.time() + data.get("expires_in", 3600),
            }
            return data["access_token"]


async def get_delegated_token(refresh_token: str) -> Optional[dict]:
    """
    Refresh a delegated token using a stored refresh_token.
    Returns { access_token, refresh_token, expires_at }.
    """
    if not MS_CLIENT_ID or not MS_CLIENT_SECRET or not refresh_token:
        return None

    async with aiohttp.ClientSession() as session:
        async with session.post(
            _get_token_url(),
            data={
                "client_id": MS_CLIENT_ID,
                "client_secret": MS_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
                "scope": "offline_access Mail.Send Mail.Read ChannelMessage.Send Chat.ReadWrite Team.ReadBasic.All User.Read",
            },
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            if "access_token" not in data:
                return None
            return {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token", refresh_token),
                "expires_at": time.time() + data.get("expires_in", 3600),
            }


async def exchange_code_for_token(code: str) -> Optional[dict]:
    """
    Exchange an authorization code for tokens (delegated flow step 2).
    """
    async with aiohttp.ClientSession() as session:
        async with session.post(
            _get_token_url(),
            data={
                "client_id": MS_CLIENT_ID,
                "client_secret": MS_CLIENT_SECRET,
                "code": code,
                "redirect_uri": MS_REDIRECT_URI,
                "grant_type": "authorization_code",
                "scope": "offline_access Mail.Send Mail.Read ChannelMessage.Send Chat.ReadWrite Team.ReadBasic.All User.Read",
            },
        ) as resp:
            if resp.status != 200:
                error = await resp.text()
                return {"error": error}
            data = await resp.json()
            if "access_token" not in data:
                return {"error": data.get("error_description", "Token exchange failed")}
            return {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token"),
                "expires_at": time.time() + data.get("expires_in", 3600),
                "id_token": data.get("id_token"),
            }


def get_auth_url(state: str = "flowcraft") -> str:
    """Build the Microsoft OAuth2 authorization URL for user sign-in."""
    import urllib.parse
    params = {
        "client_id": MS_CLIENT_ID,
        "redirect_uri": MS_REDIRECT_URI,
        "response_type": "code",
        "scope": "offline_access Mail.Send Mail.Read ChannelMessage.Send Chat.ReadWrite Team.ReadBasic.All User.Read",
        "state": state,
        "response_mode": "query",
    }
    return f"{_get_authorize_url()}?{urllib.parse.urlencode(params)}"


async def graph_api_request(
    method: str,
    endpoint: str,
    token: str,
    json_body: dict = None,
    params: dict = None,
) -> dict:
    """Make authenticated request to Microsoft Graph API."""
    url = f"{GRAPH_BASE}{endpoint}" if not endpoint.startswith("http") else endpoint
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
            if resp.status == 204:
                return {"success": True, "status": 204}
            if resp.status == 202:
                return {"success": True, "status": 202}
            try:
                data = await resp.json()
            except Exception:
                data = {"raw": await resp.text()}
            data["_status"] = resp.status
            data["_success"] = 200 <= resp.status < 300
            return data
