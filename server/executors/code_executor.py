import ast
import asyncio
import datetime
import io
import json
import math
import re
from typing import Callable, Awaitable, Optional


async def execute_code(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    """Execute a code node in a restricted sandbox.

    Args:
        node_data: Node configuration from the workflow.
        input_data: Data passed from upstream nodes.
        on_output: Optional async callback invoked for each ``print()`` call,
                   enabling real-time output streaming.
    """
    config = node_data.get("config", {})
    code = config.get("code", "")
    language = config.get("language", "Python")

    if not code.strip():
        return {"output": input_data, "language": language, "skipped": True}

    if language != "Python":
        return {
            "output": input_data,
            "warning": f"Only Python execution is supported server-side. Got: {language}",
        }

    # Capture print output for streaming
    output_lines: list[str] = []
    pending_callbacks: list[asyncio.Task] = []
    loop = asyncio.get_event_loop()

    def _streaming_print(*args, **kwargs):
        buf = io.StringIO()
        print(*args, file=buf, **kwargs)
        line = buf.getvalue()
        output_lines.append(line)
        if on_output is not None:
            # Schedule the async callback from synchronous exec context
            pending_callbacks.append(
                loop.create_task(on_output(line))
            )

    # Restricted sandbox — only safe builtins
    safe_builtins = {
        "abs": abs, "all": all, "any": any, "bool": bool,
        "dict": dict, "enumerate": enumerate, "filter": filter,
        "float": float, "int": int, "isinstance": isinstance,
        "len": len, "list": list, "map": map, "max": max,
        "min": min, "print": _streaming_print, "range": range, "round": round,
        "set": set, "sorted": sorted, "str": str, "sum": sum,
        "tuple": tuple, "type": type, "zip": zip,
        "True": True, "False": False, "None": None,
    }

    # Modules allowed for import in the sandbox
    allowed_modules = {
        "datetime": datetime,
        "math": math,
        "json": json,
        "re": re,
    }

    def _safe_import(name, *args, **kwargs):
        if name in allowed_modules:
            return allowed_modules[name]
        raise ImportError(f"Import of '{name}' is not allowed")

    safe_builtins["__import__"] = _safe_import

    sandbox_globals = {"__builtins__": safe_builtins, "input": input_data, **allowed_modules}
    sandbox_locals: dict = {}

    try:
        # Validate syntax first
        ast.parse(code)

        exec(code, sandbox_globals, sandbox_locals)

        # Flush any pending streaming callbacks
        if pending_callbacks:
            await asyncio.gather(*pending_callbacks)

        # Look for a 'result' variable or return value
        result = sandbox_locals.get("result", sandbox_locals.get("output", input_data))
        return {
            "output": result,
            "language": language,
            "stdout": "".join(output_lines) if output_lines else None,
        }
    except SyntaxError as e:
        return {"error": f"Syntax error: {e}", "output": None}
    except Exception as e:
        if pending_callbacks:
            await asyncio.gather(*pending_callbacks, return_exceptions=True)
        return {"error": f"Runtime error: {e}", "output": None}
