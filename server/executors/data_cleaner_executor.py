"""
Data Cleaner executor — advanced data cleaning operations.
Operations: DropNulls, ParseDates, CoerceTypes, NormalizeText, DropDuplicates, RenameColumns, FilterRows
"""

import re
from typing import Optional, Callable, Awaitable


async def execute_data_cleaner(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    operation = config.get("operation", "DropNulls")

    # Get rows from input
    rows = input_data.get("rows") or input_data.get("data")
    if not rows or not isinstance(rows, list):
        return {"error": "No tabular data received. Expected 'rows' as list of dicts."}

    if on_output:
        await on_output(f"Data Cleaner: {operation} on {len(rows)} rows...\n")

    original_count = len(rows)

    try:
        if operation == "DropNulls":
            subset = config.get("columns", "").strip()
            if subset:
                cols = [c.strip() for c in subset.split(",")]
                rows = [r for r in rows if all(r.get(c) not in (None, "", "null", "NULL", "nan", "NaN", "None") for c in cols)]
            else:
                rows = [r for r in rows if all(v not in (None, "", "null", "NULL", "nan", "NaN", "None") for v in r.values())]
            dropped = original_count - len(rows)
            if on_output:
                await on_output(f"Dropped {dropped} rows with nulls. {len(rows)} remaining.\n")

        elif operation == "ParseDates":
            date_cols = [c.strip() for c in config.get("columns", "").split(",") if c.strip()]
            if not date_cols:
                return {"error": "Specify date columns (comma-separated)"}
            from datetime import datetime
            date_format = config.get("date_format", "").strip() or None
            parsed = 0
            for row in rows:
                for col in date_cols:
                    val = row.get(col)
                    if val and isinstance(val, str):
                        try:
                            if date_format:
                                dt = datetime.strptime(val.strip(), date_format)
                            else:
                                # Auto-detect common formats
                                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %H:%M:%S", "%d-%m-%Y", "%Y/%m/%d"):
                                    try:
                                        dt = datetime.strptime(val.strip(), fmt)
                                        break
                                    except ValueError:
                                        continue
                                else:
                                    continue
                            row[col] = dt.isoformat()
                            parsed += 1
                        except (ValueError, TypeError):
                            pass
            if on_output:
                await on_output(f"Parsed {parsed} date values in columns: {', '.join(date_cols)}\n")

        elif operation == "CoerceTypes":
            type_map_str = config.get("type_map", "").strip()
            if not type_map_str:
                # Auto-detect: try to convert all numeric-looking strings
                conversions = 0
                for row in rows:
                    for k, v in row.items():
                        if isinstance(v, str):
                            v_stripped = v.strip()
                            try:
                                if "." in v_stripped:
                                    row[k] = float(v_stripped)
                                else:
                                    row[k] = int(v_stripped)
                                conversions += 1
                            except (ValueError, TypeError):
                                pass
                if on_output:
                    await on_output(f"Auto-coerced {conversions} values to numeric.\n")
            else:
                # Format: "col1:float,col2:int,col3:str"
                pairs = [p.strip().split(":") for p in type_map_str.split(",") if ":" in p]
                casters = {"float": float, "int": int, "str": str}
                for row in rows:
                    for col, dtype in pairs:
                        col, dtype = col.strip(), dtype.strip()
                        if col in row and dtype in casters:
                            try:
                                val = row[col]
                                if val not in (None, "", "null", "None"):
                                    row[col] = casters[dtype](val)
                            except (ValueError, TypeError):
                                row[col] = 0 if dtype in ("float", "int") else ""
                if on_output:
                    await on_output(f"Coerced types for {len(pairs)} columns.\n")

        elif operation == "NormalizeText":
            text_cols = [c.strip() for c in config.get("columns", "").split(",") if c.strip()]
            mode = config.get("mode", "lowercase")  # lowercase, uppercase, strip, trim_whitespace
            if not text_cols:
                # Apply to all string columns
                text_cols = list(rows[0].keys()) if rows else []
            for row in rows:
                for col in text_cols:
                    val = row.get(col)
                    if isinstance(val, str):
                        val = val.strip()
                        val = re.sub(r'\s+', ' ', val)  # collapse whitespace
                        if mode == "lowercase":
                            val = val.lower()
                        elif mode == "uppercase":
                            val = val.upper()
                        elif mode == "title":
                            val = val.title()
                        row[col] = val
            if on_output:
                await on_output(f"Normalized text ({mode}) in {len(text_cols)} columns.\n")

        elif operation == "DropDuplicates":
            subset = config.get("columns", "").strip()
            if subset:
                cols = [c.strip() for c in subset.split(",")]
                seen = set()
                unique_rows = []
                for r in rows:
                    key = tuple(r.get(c) for c in cols)
                    if key not in seen:
                        seen.add(key)
                        unique_rows.append(r)
                rows = unique_rows
            else:
                seen = set()
                unique_rows = []
                for r in rows:
                    key = tuple(sorted(r.items()))
                    if key not in seen:
                        seen.add(key)
                        unique_rows.append(r)
                rows = unique_rows
            dropped = original_count - len(rows)
            if on_output:
                await on_output(f"Dropped {dropped} duplicate rows. {len(rows)} remaining.\n")

        elif operation == "RenameColumns":
            rename_map_str = config.get("rename_map", "").strip()
            if not rename_map_str:
                return {"error": "Specify column renames as 'old_name:new_name' comma-separated"}
            pairs = [p.strip().split(":") for p in rename_map_str.split(",") if ":" in p]
            rename_map = {old.strip(): new.strip() for old, new in pairs}
            rows = [{rename_map.get(k, k): v for k, v in row.items()} for row in rows]
            if on_output:
                await on_output(f"Renamed {len(rename_map)} columns: {rename_map}\n")

        elif operation == "FilterRows":
            column = config.get("filter_column", "").strip()
            op = config.get("filter_op", "equals")
            value = config.get("filter_value", "").strip()
            if not column:
                return {"error": "Specify filter_column"}
            filtered = []
            for r in rows:
                cell = r.get(column)
                cell_str = str(cell) if cell is not None else ""
                try:
                    if op == "equals":
                        if cell_str == value:
                            filtered.append(r)
                    elif op == "not_equals":
                        if cell_str != value:
                            filtered.append(r)
                    elif op == "contains":
                        if value.lower() in cell_str.lower():
                            filtered.append(r)
                    elif op == "greater_than":
                        if float(cell_str) > float(value):
                            filtered.append(r)
                    elif op == "less_than":
                        if float(cell_str) < float(value):
                            filtered.append(r)
                    elif op == "not_null":
                        if cell not in (None, "", "null", "None", "nan"):
                            filtered.append(r)
                except (ValueError, TypeError):
                    pass
            rows = filtered
            if on_output:
                await on_output(f"Filtered: {len(rows)} rows match {column} {op} {value}\n")

        else:
            return {"error": f"Unknown operation: {operation}"}

    except Exception as e:
        return {"error": f"Data cleaning failed: {str(e)}"}

    columns = list(rows[0].keys()) if rows else []
    result = {
        "rows": rows,
        "columns": columns,
        "row_count": len(rows),
        "operation": operation,
        "original_count": original_count,
    }

    if on_output:
        await on_output(f"✓ Done: {original_count} → {len(rows)} rows, {len(columns)} columns\n")

    return {"output": result}
