"""
Microsoft OAuth routes — handles authorization code callback,
provides auth URL generation, and token status checking.
"""

import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Lazy-import to avoid circular issues
_auth_module = None

def _get_auth():
    global _auth_module
    if _auth_module is None:
        import microsoft_auth as ma
        _auth_module = ma
    return _auth_module


@router.get("/microsoft/login")
async def microsoft_login():
    """Return the Microsoft OAuth authorization URL."""
    auth = _get_auth()
    scopes = [
        "openid", "profile", "email", "offline_access",
        "Mail.Send", "Mail.Read",
        "ChannelMessage.Send", "Chat.ReadWrite",
        "Team.ReadBasic.All", "Channel.ReadBasic.All",
    ]
    url = auth.get_auth_url(scopes)
    return {"auth_url": url}


@router.get("/microsoft/callback")
async def microsoft_callback(code: str = Query(...)):
    """Handle the OAuth2 authorization code callback from Azure AD."""
    auth = _get_auth()
    try:
        token_data = await auth.exchange_code_for_token(code)
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data)
        # Return a simple success page that closes itself
        return HTMLResponse(content="""
        <html>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#e2e8f0;">
            <div style="text-align:center;">
                <h2 style="color:#22d3ee;">✅ Microsoft OAuth Connected</h2>
                <p>You can close this window and return to FlowCraft.</p>
                <script>setTimeout(()=>window.close(),3000)</script>
            </div>
        </body>
        </html>
        """)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/microsoft/status")
async def microsoft_status():
    """Check if Microsoft OAuth tokens are configured."""
    client_id = os.getenv("MICROSOFT_CLIENT_ID", "")
    client_secret = os.getenv("MICROSOFT_CLIENT_SECRET", "")
    tenant_id = os.getenv("MICROSOFT_TENANT_ID", "")

    return {
        "configured": bool(client_id and client_secret and tenant_id),
        "client_id_set": bool(client_id),
        "tenant_id_set": bool(tenant_id),
        "client_secret_set": bool(client_secret),
    }
