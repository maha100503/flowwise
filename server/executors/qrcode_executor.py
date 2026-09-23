"""
QR Code Executor - Generate QR codes as base64 PNG or SVG strings.
Uses a simple QR generation approach without external QR libraries.
Generates via external API if qrcode library not available.
"""

import json
import re
import urllib.parse
from typing import Any


def _substitute_variables(text: str, data: dict) -> str:
    """Replace {{variable}} patterns with values from data."""
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


def _build_qr_content(config: dict, input_data: dict) -> str:
    """Build QR code content string based on type."""
    qr_type = config.get("qrType", "text")

    if qr_type == "text":
        content = config.get("content", "")
        return _substitute_variables(content, input_data) if content else str(input_data.get("output", ""))

    elif qr_type == "url":
        url = config.get("content", "")
        return _substitute_variables(url, input_data) if url else str(input_data.get("output", ""))

    elif qr_type == "email":
        email = config.get("email", "")
        email = _substitute_variables(email, input_data)
        return f"mailto:{email}"

    elif qr_type == "phone":
        phone = config.get("phone", "")
        phone = _substitute_variables(phone, input_data)
        return f"tel:{phone}"

    elif qr_type == "wifi":
        ssid = _substitute_variables(config.get("ssid", ""), input_data)
        password = _substitute_variables(config.get("wifiPassword", ""), input_data)
        encryption = config.get("encryption", "WPA")
        return f"WIFI:T:{encryption};S:{ssid};P:{password};;"

    elif qr_type == "vcard":
        name = _substitute_variables(config.get("vcardName", ""), input_data)
        phone = _substitute_variables(config.get("vcardPhone", ""), input_data)
        email = _substitute_variables(config.get("vcardEmail", ""), input_data)
        return f"BEGIN:VCARD\nVERSION:3.0\nFN:{name}\nTEL:{phone}\nEMAIL:{email}\nEND:VCARD"

    return str(input_data.get("output", ""))


async def execute_qrcode(node_data: dict, input_data: dict) -> dict:
    """Generate a QR code."""
    config = node_data.get("config", {})
    size = int(config.get("size", 256))
    output_format = config.get("outputFormat", "base64")

    content = _build_qr_content(config, input_data)

    if not content:
        return {"error": "No content to encode", "output": None}

    try:
        # Try using the qrcode library if available
        try:
            import qrcode
            import qrcode.constants
            import io
            import base64

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=max(1, size // 33),
                border=2,
            )
            qr.add_data(content)
            qr.make(fit=True)

            if output_format == "svg":
                import qrcode.image.svg
                factory = qrcode.image.svg.SvgPathImage
                img = qr.make_image(image_factory=factory)
                svg_io = io.BytesIO()
                img.save(svg_io)
                svg_str = svg_io.getvalue().decode('utf-8')
                return {
                    "output": svg_str,
                    "format": "svg",
                    "content": content[:100],
                    "size": size,
                }
            else:
                img = qr.make_image(fill_color="black", back_color="white")
                img = img.resize((size, size))
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                return {
                    "output": f"data:image/png;base64,{b64}",
                    "format": "base64_png",
                    "content": content[:100],
                    "size": size,
                }

        except ImportError:
            # Fallback: use QR server API
            import aiohttp
            encoded = urllib.parse.quote(content)
            api_url = f"https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&data={encoded}"

            if output_format == "svg":
                api_url += "&format=svg"
                async with aiohttp.ClientSession() as session:
                    async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        if resp.status == 200:
                            svg_data = await resp.text()
                            return {
                                "output": svg_data,
                                "format": "svg",
                                "content": content[:100],
                                "size": size,
                                "source": "qrserver_api",
                            }
            else:
                import base64 as b64_module
                async with aiohttp.ClientSession() as session:
                    async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        if resp.status == 200:
                            img_bytes = await resp.read()
                            b64 = b64_module.b64encode(img_bytes).decode('utf-8')
                            return {
                                "output": f"data:image/png;base64,{b64}",
                                "format": "base64_png",
                                "content": content[:100],
                                "size": size,
                                "source": "qrserver_api",
                            }

            return {
                "output": api_url,
                "format": "url",
                "content": content[:100],
                "note": "QR code URL (qrcode library not installed)",
            }

    except Exception as e:
        return {"error": str(e), "output": None}
