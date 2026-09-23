"""
Markdown Executor - Convert markdown to HTML/plain text, extract headings/links/code blocks.
"""

import re
import json
import html
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


def _md_to_html(md: str, sanitize: bool = True) -> str:
    """Simple markdown to HTML converter."""
    lines = md.split('\n')
    html_lines = []
    in_code_block = False
    in_list = False
    code_lang = ""

    for line in lines:
        # Code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                html_lines.append('</code></pre>')
                in_code_block = False
            else:
                code_lang = line.strip()[3:].strip()
                html_lines.append(f'<pre><code class="language-{code_lang}">' if code_lang else '<pre><code>')
                in_code_block = True
            continue

        if in_code_block:
            html_lines.append(html.escape(line))
            continue

        # Headings
        heading_match = re.match(r'^(#{1,6})\s+(.*)', line)
        if heading_match:
            level = len(heading_match.group(1))
            text = _inline_md(heading_match.group(2))
            html_lines.append(f'<h{level}>{text}</h{level}>')
            continue

        # Horizontal rule
        if re.match(r'^---+\s*$|^\*\*\*+\s*$|^___+\s*$', line.strip()):
            html_lines.append('<hr/>')
            continue

        # Blockquote
        if line.strip().startswith('>'):
            text = _inline_md(line.strip()[1:].strip())
            html_lines.append(f'<blockquote>{text}</blockquote>')
            continue

        # Unordered list
        list_match = re.match(r'^[\s]*[-*+]\s+(.*)', line)
        if list_match:
            if not in_list:
                html_lines.append('<ul>')
                in_list = True
            html_lines.append(f'<li>{_inline_md(list_match.group(1))}</li>')
            continue
        elif in_list:
            html_lines.append('</ul>')
            in_list = False

        # Ordered list
        ol_match = re.match(r'^[\s]*\d+\.\s+(.*)', line)
        if ol_match:
            html_lines.append(f'<li>{_inline_md(ol_match.group(1))}</li>')
            continue

        # Empty line
        if not line.strip():
            if in_list:
                html_lines.append('</ul>')
                in_list = False
            html_lines.append('')
            continue

        # Paragraph
        html_lines.append(f'<p>{_inline_md(line)}</p>')

    if in_list:
        html_lines.append('</ul>')
    if in_code_block:
        html_lines.append('</code></pre>')

    result = '\n'.join(html_lines)
    
    if sanitize:
        # Remove script tags and event handlers
        result = re.sub(r'<script[^>]*>.*?</script>', '', result, flags=re.DOTALL | re.IGNORECASE)
        result = re.sub(r'\bon\w+\s*=', '', result, flags=re.IGNORECASE)

    return result


def _inline_md(text: str) -> str:
    """Convert inline markdown."""
    # Images
    text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1"/>', text)
    # Links
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.+?)__', r'<strong>\1</strong>', text)
    # Italic
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.+?)_', r'<em>\1</em>', text)
    # Strikethrough
    text = re.sub(r'~~(.+?)~~', r'<del>\1</del>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text


def _md_to_plain(md: str) -> str:
    """Strip markdown to plain text."""
    text = md
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    # Remove headings marks
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    # Remove links but keep text
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove images
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'\1', text)
    # Remove inline code backticks
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


async def execute_markdown(node_data: dict, input_data: dict) -> dict:
    """Execute a markdown operation."""
    config = node_data.get("config", {})
    operation = config.get("operation", "to_html")
    content = config.get("content", "")
    sanitize = config.get("sanitize", True)

    content = _substitute_variables(content, input_data)
    
    if not content:
        output = input_data.get("output", input_data)
        content = str(output) if output else ""

    if not content:
        return {"error": "No markdown content provided", "output": None}

    try:
        if operation == "to_html":
            html_output = _md_to_html(content, sanitize=sanitize)
            return {"output": html_output, "format": "html"}

        elif operation == "to_plain":
            plain = _md_to_plain(content)
            return {"output": plain, "format": "plain_text"}

        elif operation == "extract_headings":
            headings = []
            for match in re.finditer(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE):
                headings.append({
                    "level": len(match.group(1)),
                    "text": match.group(2).strip(),
                })
            return {
                "output": headings,
                "count": len(headings),
            }

        elif operation == "extract_links":
            links = []
            for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content):
                links.append({"text": match.group(1), "url": match.group(2)})
            return {
                "output": links,
                "count": len(links),
            }

        elif operation == "extract_code":
            blocks = []
            for match in re.finditer(r'```(\w*)\n([\s\S]*?)```', content):
                blocks.append({
                    "language": match.group(1) or "text",
                    "code": match.group(2).strip(),
                })
            return {
                "output": blocks,
                "count": len(blocks),
            }

        elif operation == "word_count":
            plain = _md_to_plain(content)
            words = len(plain.split())
            chars = len(plain)
            chars_no_space = len(plain.replace(' ', '').replace('\n', ''))
            lines = len(content.split('\n'))
            return {
                "output": {
                    "words": words,
                    "characters": chars,
                    "characters_no_spaces": chars_no_space,
                    "lines": lines,
                },
                "words": words,
            }

        else:
            return {"error": f"Unknown operation: {operation}", "output": None}

    except Exception as e:
        return {"error": str(e), "output": None}
