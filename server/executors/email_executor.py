"""
Email Executor - Send emails via SMTP, SendGrid, or Mailgun.
"""

import os
import smtplib
import aiohttp
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


async def execute_email(node_data: dict, input_data: dict) -> dict:
    """Execute an email sending node."""
    
    config = node_data.get("config", {})
    provider = node_data.get("subType", config.get("provider", "SMTP"))
    
    to_email = config.get("to", "")
    subject = config.get("subject", "")
    body = config.get("body", "")
    from_email = config.get("from", "")
    is_html = config.get("isHtml", False)
    
    # Template substitution
    to_email = _substitute_variables(to_email, input_data)
    subject = _substitute_variables(subject, input_data)
    body = _substitute_variables(body, input_data)
    
    if not to_email:
        return {"error": "Recipient email (to) is required", "output": None}
    if not subject:
        return {"error": "Subject is required", "output": None}
    if not body:
        return {"error": "Body is required", "output": None}

    try:
        if provider == "SMTP":
            return await _send_smtp(to_email, subject, body, from_email, is_html, config)
        elif provider == "SendGrid":
            return await _send_sendgrid(to_email, subject, body, from_email, is_html)
        elif provider == "Mailgun":
            return await _send_mailgun(to_email, subject, body, from_email, is_html, config)
        else:
            return {"error": f"Unsupported email provider: {provider}", "output": None}
    
    except Exception as e:
        return {"error": str(e), "output": None}


async def _send_smtp(to_email: str, subject: str, body: str, from_email: str, is_html: bool, config: dict) -> dict:
    """Send email via SMTP."""
    
    smtp_host = config.get("smtpHost") or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(config.get("smtpPort") or os.getenv("SMTP_PORT", 587))
    smtp_user = config.get("smtpUser") or os.getenv("SMTP_USER", "")
    smtp_pass = config.get("smtpPassword") or os.getenv("SMTP_PASSWORD", "")
    
    if not smtp_user or not smtp_pass:
        return {"error": "SMTP credentials not configured", "output": None}
    
    from_email = from_email or smtp_user
    
    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    
    content_type = "html" if is_html else "plain"
    msg.attach(MIMEText(body, content_type))
    
    # Send
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        
        return {
            "output": {"success": True, "message": f"Email sent to {to_email}"},
            "to": to_email,
            "subject": subject,
            "provider": "SMTP"
        }
    except smtplib.SMTPException as e:
        return {"error": f"SMTP error: {str(e)}", "output": None}


async def _send_sendgrid(to_email: str, subject: str, body: str, from_email: str, is_html: bool) -> dict:
    """Send email via SendGrid API."""
    
    api_key = os.getenv("SENDGRID_API_KEY", "")
    
    if not api_key:
        return {"error": "SENDGRID_API_KEY not configured", "output": None}
    
    from_email = from_email or os.getenv("SENDGRID_FROM_EMAIL", "")
    
    if not from_email:
        return {"error": "From email is required for SendGrid", "output": None}
    
    content_type = "text/html" if is_html else "text/plain"
    
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_email},
        "subject": subject,
        "content": [{"type": content_type, "value": body}]
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        ) as response:
            if response.status == 202:
                return {
                    "output": {"success": True, "message": f"Email sent to {to_email}"},
                    "to": to_email,
                    "subject": subject,
                    "provider": "SendGrid"
                }
            else:
                error_text = await response.text()
                return {"error": f"SendGrid error: {error_text}", "output": None}


async def _send_mailgun(to_email: str, subject: str, body: str, from_email: str, is_html: bool, config: dict) -> dict:
    """Send email via Mailgun API."""
    
    api_key = os.getenv("MAILGUN_API_KEY", "")
    domain = config.get("mailgunDomain") or os.getenv("MAILGUN_DOMAIN", "")
    
    if not api_key:
        return {"error": "MAILGUN_API_KEY not configured", "output": None}
    if not domain:
        return {"error": "Mailgun domain is required", "output": None}
    
    from_email = from_email or f"mailgun@{domain}"
    
    data = {
        "from": from_email,
        "to": to_email,
        "subject": subject,
    }
    
    if is_html:
        data["html"] = body
    else:
        data["text"] = body
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=aiohttp.BasicAuth("api", api_key),
            data=data
        ) as response:
            if response.status == 200:
                return {
                    "output": {"success": True, "message": f"Email sent to {to_email}"},
                    "to": to_email,
                    "subject": subject,
                    "provider": "Mailgun"
                }
            else:
                error_text = await response.text()
                return {"error": f"Mailgun error: {error_text}", "output": None}


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
