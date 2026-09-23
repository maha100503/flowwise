"""
Feature Engineer executor — create derived features from tabular data.
Operations: DateDiff, Ratio, Aggregate, BinNumeric, Interaction, Formula, AutoFeatures
"""

import re
import math
from typing import Optional, Callable, Awaitable


async def execute_feature_engineer(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    operation = config.get("operation", "AutoFeatures")

    rows = input_data.get("rows") or input_data.get("data")
    if not rows or not isinstance(rows, list):
        return {"error": "No tabular data received. Expected 'rows' as list of dicts."}

    if on_output:
        await on_output(f"Feature Engineering: {operation} on {len(rows)} rows...\n")

    try:
        if operation == "DateDiff":
            col_a = config.get("col_a", "").strip()
            col_b = config.get("col_b", "").strip()
            new_col = config.get("new_column", f"{col_a}_minus_{col_b}").strip()
            unit = config.get("unit", "days")  # days, hours, seconds
            if not col_a or not col_b:
                return {"error": "Specify col_a and col_b for date difference"}
            from datetime import datetime
            formats = ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"]
            count = 0
            for row in rows:
                a_val, b_val = row.get(col_a), row.get(col_b)
                if a_val and b_val:
                    try:
                        a_dt = b_dt = None
                        for fmt in formats:
                            try:
                                a_dt = datetime.strptime(str(a_val).strip(), fmt)
                                break
                            except ValueError:
                                continue
                        for fmt in formats:
                            try:
                                b_dt = datetime.strptime(str(b_val).strip(), fmt)
                                break
                            except ValueError:
                                continue
                        if a_dt and b_dt:
                            delta = a_dt - b_dt
                            if unit == "days":
                                row[new_col] = delta.days
                            elif unit == "hours":
                                row[new_col] = delta.total_seconds() / 3600
                            else:
                                row[new_col] = delta.total_seconds()
                            count += 1
                        else:
                            row[new_col] = None
                    except Exception:
                        row[new_col] = None
                else:
                    row[new_col] = None
            if on_output:
                await on_output(f"Created '{new_col}' ({unit}): {count} values computed.\n")

        elif operation == "Ratio":
            numerator = config.get("numerator", "").strip()
            denominator = config.get("denominator", "").strip()
            new_col = config.get("new_column", f"{numerator}_per_{denominator}").strip()
            if not numerator or not denominator:
                return {"error": "Specify numerator and denominator columns"}
            count = 0
            for row in rows:
                try:
                    n = float(row.get(numerator, 0) or 0)
                    d = float(row.get(denominator, 0) or 0)
                    row[new_col] = round(n / d, 6) if d != 0 else 0
                    count += 1
                except (ValueError, TypeError):
                    row[new_col] = 0
            if on_output:
                await on_output(f"Created ratio '{new_col}': {count} values.\n")

        elif operation == "Aggregate":
            group_by = config.get("group_by", "").strip()
            agg_col = config.get("agg_column", "").strip()
            agg_func = config.get("agg_func", "mean")  # mean, sum, count, min, max
            new_col = config.get("new_column", f"{agg_col}_{agg_func}_by_{group_by}").strip()
            if not group_by or not agg_col:
                return {"error": "Specify group_by and agg_column"}
            # Build aggregation
            groups = {}
            for row in rows:
                key = row.get(group_by)
                if key not in groups:
                    groups[key] = []
                try:
                    groups[key].append(float(row.get(agg_col, 0) or 0))
                except (ValueError, TypeError):
                    pass
            agg_results = {}
            for key, vals in groups.items():
                if not vals:
                    agg_results[key] = 0
                elif agg_func == "mean":
                    agg_results[key] = round(sum(vals) / len(vals), 6)
                elif agg_func == "sum":
                    agg_results[key] = round(sum(vals), 6)
                elif agg_func == "count":
                    agg_results[key] = len(vals)
                elif agg_func == "min":
                    agg_results[key] = min(vals)
                elif agg_func == "max":
                    agg_results[key] = max(vals)
            for row in rows:
                row[new_col] = agg_results.get(row.get(group_by), 0)
            if on_output:
                await on_output(f"Aggregated '{agg_col}' by '{group_by}' ({agg_func}) → '{new_col}' ({len(groups)} groups).\n")

        elif operation == "BinNumeric":
            column = config.get("column", "").strip()
            bins = int(config.get("bins", 5))
            new_col = config.get("new_column", f"{column}_bin").strip()
            labels = config.get("labels", "").strip()
            if not column:
                return {"error": "Specify column to bin"}
            vals = []
            for row in rows:
                try:
                    vals.append(float(row.get(column, 0) or 0))
                except (ValueError, TypeError):
                    vals.append(0)
            if vals:
                min_val, max_val = min(vals), max(vals)
                bin_width = (max_val - min_val) / bins if max_val != min_val else 1
                label_list = [l.strip() for l in labels.split(",")] if labels else None
                for i, row in enumerate(rows):
                    bin_idx = min(int((vals[i] - min_val) / bin_width), bins - 1)
                    if label_list and bin_idx < len(label_list):
                        row[new_col] = label_list[bin_idx]
                    else:
                        row[new_col] = bin_idx
            if on_output:
                await on_output(f"Binned '{column}' into {bins} bins → '{new_col}'.\n")

        elif operation == "Interaction":
            col_a = config.get("col_a", "").strip()
            col_b = config.get("col_b", "").strip()
            mode = config.get("mode", "multiply")  # multiply, add, concat
            new_col = config.get("new_column", f"{col_a}_{mode}_{col_b}").strip()
            if not col_a or not col_b:
                return {"error": "Specify col_a and col_b"}
            for row in rows:
                a, b = row.get(col_a), row.get(col_b)
                try:
                    if mode == "multiply":
                        row[new_col] = round(float(a or 0) * float(b or 0), 6)
                    elif mode == "add":
                        row[new_col] = round(float(a or 0) + float(b or 0), 6)
                    elif mode == "concat":
                        row[new_col] = f"{a}_{b}"
                except (ValueError, TypeError):
                    row[new_col] = 0 if mode != "concat" else f"{a}_{b}"
            if on_output:
                await on_output(f"Created interaction '{new_col}' = {col_a} {mode} {col_b}.\n")

        elif operation == "Formula":
            formula = config.get("formula", "").strip()
            new_col = config.get("new_column", "computed").strip()
            if not formula:
                return {"error": "Specify a formula (e.g., 'col_a * col_b + col_c')"}
            # Parse column references from formula
            col_refs = set(re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\b', formula))
            builtin_names = {'abs', 'round', 'min', 'max', 'pow', 'sqrt', 'log', 'math', 'int', 'float'}
            col_refs -= builtin_names
            count = 0
            for row in rows:
                try:
                    local_vars = {"math": math, "abs": abs, "round": round, "min": min, "max": max, "pow": pow, "sqrt": math.sqrt, "log": math.log}
                    for col in col_refs:
                        val = row.get(col)
                        try:
                            local_vars[col] = float(val) if val is not None else 0
                        except (ValueError, TypeError):
                            local_vars[col] = 0
                    row[new_col] = round(eval(formula, {"__builtins__": {}}, local_vars), 6)
                    count += 1
                except Exception:
                    row[new_col] = None
            if on_output:
                await on_output(f"Computed formula '{formula}' → '{new_col}': {count} values.\n")

        elif operation == "AutoFeatures":
            # Auto-detect and create useful features
            if not rows:
                return {"error": "No data to process"}
            new_features = 0
            sample = rows[0]
            numeric_cols = []
            for k, v in sample.items():
                try:
                    float(v)
                    numeric_cols.append(k)
                except (ValueError, TypeError):
                    pass

            # Create pairwise ratios for first few numeric cols
            for i, col_a in enumerate(numeric_cols[:5]):
                for col_b in numeric_cols[i+1:5]:
                    ratio_col = f"{col_a}_per_{col_b}"
                    for row in rows:
                        try:
                            a = float(row.get(col_a, 0) or 0)
                            b = float(row.get(col_b, 0) or 0)
                            row[ratio_col] = round(a / b, 6) if b != 0 else 0
                        except (ValueError, TypeError):
                            row[ratio_col] = 0
                    new_features += 1

            if on_output:
                await on_output(f"Auto-generated {new_features} features from {len(numeric_cols)} numeric columns.\n")

        else:
            return {"error": f"Unknown operation: {operation}"}

    except Exception as e:
        return {"error": f"Feature engineering failed: {str(e)}"}

    columns = list(rows[0].keys()) if rows else []
    result = {
        "rows": rows,
        "columns": columns,
        "row_count": len(rows),
        "operation": operation,
        "new_features": len(columns) - len(input_data.get("columns", [])) if "columns" in input_data else 0,
    }

    if on_output:
        await on_output(f"✓ Done: {len(rows)} rows, {len(columns)} columns\n")

    return result
