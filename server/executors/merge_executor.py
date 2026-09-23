"""
Merge executor — join two datasets on a column.
Supports: inner, left, right, outer joins.
Expects two inputs: the primary input_data and a secondary input via 'secondary' key or second connected node.
"""

from typing import Optional, Callable, Awaitable


async def execute_merge(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    how = config.get("how", "left")  # inner, left, right, outer
    left_on = config.get("left_on", "").strip()
    right_on = config.get("right_on", "").strip()
    if not right_on:
        right_on = left_on  # same column name in both

    if on_output:
        await on_output(f"Merge: {how} join on '{left_on}' = '{right_on}'...\n")

    # Detect left and right datasets from input
    left_rows = None
    right_rows = None

    # If input_data has "left" and "right" keys (from multi-input)
    if "left" in input_data and "right" in input_data:
        left_data = input_data["left"]
        right_data = input_data["right"]
        left_rows = left_data.get("rows") if isinstance(left_data, dict) else None
        right_rows = right_data.get("rows") if isinstance(right_data, dict) else None
    # If input is aggregated from multiple nodes
    elif isinstance(input_data, dict):
        # Try to find two datasets - check for rows directly or nested
        datasets = []
        if "rows" in input_data:
            datasets.append(input_data["rows"])
        # Check numbered keys or named keys
        for key in sorted(input_data.keys()):
            val = input_data.get(key)
            if isinstance(val, dict) and "rows" in val:
                datasets.append(val["rows"])
            elif isinstance(val, list) and val and isinstance(val[0], dict):
                datasets.append(val)

        if len(datasets) >= 2:
            left_rows = datasets[0]
            right_rows = datasets[1]
        elif len(datasets) == 1:
            left_rows = datasets[0]

    if not left_rows:
        return {"error": "No left dataset found. Connect two data sources to this node."}
    if not right_rows:
        return {"error": "No right dataset found. Connect a second data source to this node."}

    if not left_on:
        return {"error": "Specify the join column(s) in 'left_on'."}

    try:
        # Build index on right table
        right_index = {}
        for row in right_rows:
            key = row.get(right_on)
            if key not in right_index:
                right_index[key] = []
            right_index[key].append(row)

        # Get all columns
        left_cols = set()
        for r in left_rows[:1]:
            left_cols = set(r.keys())
        right_cols = set()
        for r in right_rows[:1]:
            right_cols = set(r.keys())

        # Suffix overlapping columns (except join key)
        overlap = (left_cols & right_cols) - {left_on, right_on}
        suffix_left = config.get("suffix_left", "_left")
        suffix_right = config.get("suffix_right", "_right")

        merged = []

        if how in ("left", "inner", "outer"):
            for lrow in left_rows:
                lkey = lrow.get(left_on)
                matches = right_index.get(lkey, [])
                if matches:
                    for rrow in matches:
                        new_row = {}
                        for k, v in lrow.items():
                            new_row[k + suffix_left if k in overlap else k] = v
                        for k, v in rrow.items():
                            if k == right_on and right_on == left_on:
                                continue
                            new_row[k + suffix_right if k in overlap else k] = v
                        merged.append(new_row)
                elif how in ("left", "outer"):
                    new_row = {}
                    for k, v in lrow.items():
                        new_row[k + suffix_left if k in overlap else k] = v
                    merged.append(new_row)

        if how in ("right", "outer"):
            left_keys = {r.get(left_on) for r in left_rows}
            for rrow in right_rows:
                rkey = rrow.get(right_on)
                if rkey not in left_keys:
                    new_row = {}
                    for k, v in rrow.items():
                        new_row[k + suffix_right if k in overlap else k] = v
                    merged.append(new_row)

        if how == "right":
            # Right join: all right rows + matching left
            left_index = {}
            for row in left_rows:
                key = row.get(left_on)
                if key not in left_index:
                    left_index[key] = []
                left_index[key].append(row)

            merged = []
            for rrow in right_rows:
                rkey = rrow.get(right_on)
                matches = left_index.get(rkey, [])
                if matches:
                    for lrow in matches:
                        new_row = {}
                        for k, v in lrow.items():
                            new_row[k + suffix_left if k in overlap else k] = v
                        for k, v in rrow.items():
                            if k == right_on and right_on == left_on:
                                continue
                            new_row[k + suffix_right if k in overlap else k] = v
                        merged.append(new_row)
                else:
                    new_row = {}
                    for k, v in rrow.items():
                        new_row[k + suffix_right if k in overlap else k] = v
                    merged.append(new_row)

    except Exception as e:
        return {"error": f"Merge failed: {str(e)}"}

    columns = list(merged[0].keys()) if merged else []
    result = {
        "rows": merged,
        "columns": columns,
        "row_count": len(merged),
        "how": how,
        "left_count": len(left_rows),
        "right_count": len(right_rows),
    }

    if on_output:
        await on_output(f"✓ Merged: {len(left_rows)} left × {len(right_rows)} right → {len(merged)} rows ({how} join)\n")

    return result
