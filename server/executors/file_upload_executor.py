"""
File Upload executor — retrieves parsed file data by file_id.
"""

from typing import Optional, Callable, Awaitable
import aiohttp


async def execute_file_upload(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    file_id = config.get("file_id")

    if not file_id:
        return {"error": "No file uploaded. Please upload a file first."}

    if on_output:
        await on_output(f"Loading file {config.get('filename', file_id)}...")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"http://localhost:8088/api/upload/{file_id}") as resp:
                if resp.status != 200:
                    return {"error": f"File not found (id: {file_id}). Please re-upload."}
                data = await resp.json()
    except Exception as e:
        return {"error": f"Failed to retrieve file: {str(e)}"}

    if on_output:
        fmt = data.get("format", "unknown")
        if fmt in ("csv", "excel", "json"):
            await on_output(f"Loaded {data.get('row_count', 0)} rows, {len(data.get('columns', []))} columns\n")
        elif fmt == "pdf":
            await on_output(f"Loaded {data.get('page_count', 0)} pages\n")
        elif fmt == "text":
            await on_output(f"Loaded {data.get('line_count', 0)} lines\n")

    return data
