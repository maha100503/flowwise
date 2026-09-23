"""
RSS Feed Executor - Fetch and parse RSS/Atom feeds.
"""

import aiohttp
import re
import xml.etree.ElementTree as ET
from typing import Any
from datetime import datetime


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


def _strip_html(text: str) -> str:
    """Remove HTML tags from text."""
    return re.sub(r'<[^>]+>', '', text or '')


def _parse_rss(xml_content: str) -> list[dict]:
    """Parse RSS 2.0 feed."""
    items = []
    try:
        root = ET.fromstring(xml_content)
        # RSS 2.0
        channel = root.find('channel')
        if channel is not None:
            for item in channel.findall('item'):
                entry = {
                    "title": (item.findtext('title') or '').strip(),
                    "link": (item.findtext('link') or '').strip(),
                    "description": _strip_html(item.findtext('description') or ''),
                    "pubDate": (item.findtext('pubDate') or '').strip(),
                    "author": (item.findtext('author') or item.findtext('{http://purl.org/dc/elements/1.1/}creator') or '').strip(),
                }
                items.append(entry)
            return items

        # Atom format
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        for entry_el in root.findall('atom:entry', ns):
            link_el = entry_el.find('atom:link', ns)
            entry = {
                "title": (entry_el.findtext('atom:title', '', ns) or '').strip(),
                "link": link_el.get('href', '') if link_el is not None else '',
                "description": _strip_html(entry_el.findtext('atom:summary', '', ns) or entry_el.findtext('atom:content', '', ns) or ''),
                "pubDate": (entry_el.findtext('atom:updated', '', ns) or entry_el.findtext('atom:published', '', ns) or '').strip(),
                "author": (entry_el.findtext('atom:author/atom:name', '', ns) or '').strip(),
            }
            items.append(entry)

        # Fallback: try without namespace
        if not items:
            for entry_el in root.findall('entry'):
                link_el = entry_el.find('link')
                entry = {
                    "title": (entry_el.findtext('title') or '').strip(),
                    "link": link_el.get('href', '') if link_el is not None else '',
                    "description": _strip_html(entry_el.findtext('summary') or entry_el.findtext('content') or ''),
                    "pubDate": (entry_el.findtext('updated') or entry_el.findtext('published') or '').strip(),
                    "author": (entry_el.findtext('author/name') or '').strip(),
                }
                items.append(entry)

    except ET.ParseError:
        pass
    return items


async def execute_rss(node_data: dict, input_data: dict) -> dict:
    """Fetch and parse an RSS feed."""
    config = node_data.get("config", {})
    feed_url = config.get("feedUrl", config.get("url", ""))
    max_items = int(config.get("maxItems", 10))
    output_format = config.get("outputFormat", config.get("format", "full"))
    filter_keyword = config.get("filter", "")
    
    feed_url = _substitute_variables(feed_url, input_data)
    filter_keyword = _substitute_variables(filter_keyword, input_data)

    if not feed_url:
        return {"error": "Feed URL is required", "output": None}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(feed_url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    return {
                        "error": f"HTTP {response.status} fetching feed",
                        "output": None,
                        "status_code": response.status,
                    }
                xml_content = await response.text()

        items = _parse_rss(xml_content)

        # Filter by keyword
        if filter_keyword:
            kw = filter_keyword.lower()
            items = [
                item for item in items
                if kw in item.get("title", "").lower() or kw in item.get("description", "").lower()
            ]

        # Limit items
        items = items[:max_items]

        # Format output
        if output_format == "titles":
            output = [item["title"] for item in items]
        elif output_format == "links":
            output = [item["link"] for item in items]
        elif output_format == "summary":
            output = [{"title": item["title"], "description": item["description"][:200]} for item in items]
        else:
            output = items

        return {
            "output": output,
            "count": len(output),
            "feed_url": feed_url,
            "success": True,
        }

    except aiohttp.ClientError as e:
        return {"error": f"Failed to fetch feed: {str(e)}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}
