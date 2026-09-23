"""
File Export executor — save data to CSV, Excel, JSON, or joblib files.
"""

import os
import json
from typing import Optional, Callable, Awaitable

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports")


async def execute_file_export(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    filename = config.get("filename", "output").strip()
    fmt = config.get("format", "csv")  # csv, excel, json, joblib

    os.makedirs(EXPORT_DIR, exist_ok=True)

    # Clean filename
    filename = "".join(c for c in filename if c.isalnum() or c in ("_", "-", "."))
    if not filename:
        filename = "output"

    if on_output:
        await on_output(f"Exporting as {fmt}: {filename}...\n")

    try:
        if fmt == "csv":
            filepath = os.path.join(EXPORT_DIR, f"{filename}.csv")
            rows = input_data.get("rows") or input_data.get("data")
            if not rows or not isinstance(rows, list):
                return {"error": "No tabular data to export. Expected 'rows'."}
            import csv as csv_mod
            columns = list(rows[0].keys()) if rows else []
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv_mod.DictWriter(f, fieldnames=columns)
                writer.writeheader()
                writer.writerows(rows)
            if on_output:
                await on_output(f"✓ Saved {len(rows)} rows to {filepath}\n")
            return {
                "filepath": filepath,
                "filename": f"{filename}.csv",
                "format": "csv",
                "row_count": len(rows),
                "columns": columns,
                "rows": rows,  # pass through
            }

        elif fmt == "excel":
            filepath = os.path.join(EXPORT_DIR, f"{filename}.xlsx")
            rows = input_data.get("rows") or input_data.get("data")
            if not rows or not isinstance(rows, list):
                return {"error": "No tabular data to export. Expected 'rows'."}
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            columns = list(rows[0].keys()) if rows else []
            ws.append(columns)
            for row in rows:
                ws.append([row.get(c) for c in columns])
            wb.save(filepath)
            wb.close()
            if on_output:
                await on_output(f"✓ Saved {len(rows)} rows to {filepath}\n")
            return {
                "filepath": filepath,
                "filename": f"{filename}.xlsx",
                "format": "excel",
                "row_count": len(rows),
                "columns": columns,
                "rows": rows,
            }

        elif fmt == "json":
            filepath = os.path.join(EXPORT_DIR, f"{filename}.json")
            # Export whatever data we have
            export_data = input_data.get("rows") or input_data.get("comparison") or input_data
            # Filter out non-serializable objects
            def make_serializable(obj):
                if isinstance(obj, dict):
                    return {k: make_serializable(v) for k, v in obj.items()
                            if not callable(v) and not hasattr(v, 'predict')}
                elif isinstance(obj, list):
                    return [make_serializable(i) for i in obj]
                elif isinstance(obj, (int, float, str, bool, type(None))):
                    return obj
                else:
                    return str(obj)

            clean_data = make_serializable(export_data)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(clean_data, f, indent=2, default=str)
            if on_output:
                await on_output(f"✓ Saved JSON to {filepath}\n")
            return {
                "filepath": filepath,
                "filename": f"{filename}.json",
                "format": "json",
                **input_data,  # pass through
            }

        elif fmt == "joblib":
            filepath = os.path.join(EXPORT_DIR, f"{filename}.joblib")
            import joblib
            # Look for model object
            model = input_data.get("model")
            scaler = input_data.get("scaler")
            if model is None and scaler is None:
                return {"error": "No model or scaler found to export as joblib."}

            export_obj = {}
            if model is not None:
                export_obj["model"] = model
            if scaler is not None:
                export_obj["scaler"] = scaler
            if "feature_columns" in input_data:
                export_obj["feature_columns"] = input_data["feature_columns"]
            if "best_model_name" in input_data:
                export_obj["model_name"] = input_data["best_model_name"]

            joblib.dump(export_obj, filepath)
            if on_output:
                await on_output(f"✓ Saved model to {filepath}\n")
                if "best_model_name" in input_data:
                    await on_output(f"  Model: {input_data['best_model_name']}\n")

            # Pass through but remove non-serializable for downstream
            result = {k: v for k, v in input_data.items() if not callable(v) and not hasattr(v, 'predict')}
            result["filepath"] = filepath
            result["filename"] = f"{filename}.joblib"
            result["format"] = "joblib"
            return result

        else:
            return {"error": f"Unknown format: {fmt}. Use csv, excel, json, or joblib."}

    except Exception as e:
        return {"error": f"Export failed: {str(e)}"}
