"""Data preparation executor — train/test split, normalization, encoding, feature selection."""

import numpy as np
import pandas as pd
from typing import Optional, Callable, Awaitable


def _rows_to_dataframe(input_data: dict) -> tuple[pd.DataFrame | None, list[str] | None]:
    """Convert rows (list of dicts) to a DataFrame. Returns (df, columns) or (None, None)."""
    rows = input_data.get("rows")
    if rows and isinstance(rows, list) and isinstance(rows[0], dict):
        columns = input_data.get("columns") or list(rows[0].keys())
        return pd.DataFrame(rows, columns=columns), columns
    return None, None


async def execute_data_prep(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    operation = node_data.get("subType") or config.get("operation", "TrainTestSplit")

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if operation == "TrainTestSplit":
            return await _train_test_split(input_data, config, _log)
        elif operation == "Normalize":
            return await _normalize(input_data, config, _log)
        elif operation == "Standardize":
            return await _standardize(input_data, config, _log)
        elif operation == "Encode":
            return await _encode(input_data, config, _log)
        elif operation == "FillMissing":
            return await _fill_missing(input_data, config, _log)
        elif operation == "FeatureSelect":
            return await _feature_select(input_data, config, _log)
        else:
            return {"error": f"Unknown operation: {operation}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _train_test_split(input_data, config, log):
    from sklearn.model_selection import train_test_split

    X_raw = input_data.get("X") or input_data.get("features") or input_data.get("data")
    y_raw = input_data.get("y") or input_data.get("target") or input_data.get("labels")

    if X_raw is None:
        return {"error": "Missing 'X' or 'data' in input.", "output": None}

    X = np.array(X_raw, dtype=float)
    test_size = float(config.get("test_size", 0.2))
    random_state = int(config.get("random_state", 42))

    await log(f"Splitting data: {X.shape[0]} samples, test_size={test_size}")

    if y_raw is not None:
        y = np.array(y_raw)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
        await log(f"Train: {len(X_train)} | Test: {len(X_test)}")
        return {
            "output": {
                "X_train": X_train.tolist(), "X_test": X_test.tolist(),
                "y_train": y_train.tolist(), "y_test": y_test.tolist(),
                "X": X_train.tolist(), "y": y_train.tolist(),
            },
        }
    else:
        X_train, X_test = train_test_split(X, test_size=test_size, random_state=random_state)
        await log(f"Train: {len(X_train)} | Test: {len(X_test)}")
        return {
            "output": {"X_train": X_train.tolist(), "X_test": X_test.tolist(), "X": X_train.tolist()},
        }


async def _normalize(input_data, config, log):
    from sklearn.preprocessing import MinMaxScaler

    df_from_rows, columns = _rows_to_dataframe(input_data)
    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    if df_from_rows is not None and X_raw is None:
        X_raw = df_from_rows.values.tolist()
    if X_raw is None:
        return {"error": "Missing 'X' or 'data' in input.", "output": None}

    X = np.array(X_raw, dtype=float)
    await log(f"Normalizing {X.shape[0]} x {X.shape[1] if X.ndim > 1 else 1} to [0, 1]...")
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X if X.ndim > 1 else X.reshape(-1, 1))
    await log("Normalization complete")

    result = {"X": X_scaled.tolist(), "data": X_scaled.tolist()}
    if "y" in input_data:
        result["y"] = input_data["y"]
    if "columns" in input_data:
        result["columns"] = input_data["columns"]
    return {"output": result}


async def _standardize(input_data, config, log):
    from sklearn.preprocessing import StandardScaler

    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    if X_raw is None:
        return {"error": "Missing 'X' or 'data' in input.", "output": None}

    X = np.array(X_raw, dtype=float)
    await log(f"Standardizing {X.shape[0]} samples (mean=0, std=1)...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X if X.ndim > 1 else X.reshape(-1, 1))
    await log(f"Mean: {scaler.mean_.tolist()} | Std: {scaler.scale_.tolist()}")

    result = {"X": X_scaled.tolist(), "data": X_scaled.tolist()}
    if "y" in input_data:
        result["y"] = input_data["y"]
    return {"output": result}


async def _encode(input_data, config, log):
    from sklearn.preprocessing import LabelEncoder

    # Accept rows (list of dicts) — auto-encode all categorical columns
    df_from_rows, columns = _rows_to_dataframe(input_data)
    if df_from_rows is not None:
        df = df_from_rows
        le_map = {}
        cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        await log(f"Label encoding {len(cat_cols)} categorical columns: {cat_cols}")
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            le_map[col] = le.classes_.tolist()
        await log(f"Encoded {df.shape[0]} rows x {df.shape[1]} columns")

        # Output numeric data for downstream ML nodes
        target_col = config.get("target_column", "").strip()
        if target_col and target_col in df.columns:
            pass  # user specified a valid target column
        else:
            # Auto-detect: pick the categorical column with the fewest unique values (>1)
            # that is likely a label/class column, skipping empty or single-value columns
            best_col = None
            best_nunique = float("inf")
            for col in df.columns:
                nunique = df[col].nunique()
                if 2 <= nunique <= 50 and nunique < best_nunique:
                    best_col = col
                    best_nunique = nunique
            if best_col:
                target_col = best_col
            else:
                # Fallback: use the first column with more than 1 unique value
                for col in df.columns:
                    if df[col].nunique() > 1:
                        target_col = col
                        break
                else:
                    target_col = df.columns[-1]
            await log(f"Auto-detected target column: '{target_col}' ({df[target_col].nunique()} unique values)")

        y = df[target_col].tolist()
        X_df = df.drop(columns=[target_col])

        result = {
            "X": X_df.values.tolist(),
            "data": X_df.values.tolist(),
            "y": y,
            "columns": list(X_df.columns),
            "target_column": target_col,
            "classes": le_map,
        }
        return {"output": result}

    # Fallback: single array encoding
    data = input_data.get("data") or input_data.get("labels") or input_data.get("y")
    if data is None:
        return {"error": "Missing 'data', 'labels', or 'rows' to encode.", "output": None}

    await log(f"Label encoding {len(data)} values...")
    le = LabelEncoder()
    encoded = le.fit_transform(data).tolist()
    classes = le.classes_.tolist()
    await log(f"Classes: {classes}")
    return {
        "output": {"encoded": encoded, "classes": classes, "y": encoded},
    }


async def _fill_missing(input_data, config, log):

    # Accept rows (list of dicts) from file upload or X/data arrays
    df_from_rows, columns = _rows_to_dataframe(input_data)
    X_raw = input_data.get("X") or input_data.get("data")

    if df_from_rows is not None:
        df = df_from_rows
    elif X_raw is not None:
        df = pd.DataFrame(X_raw)
        columns = None
    else:
        return {"error": "Missing 'X', 'data', or 'rows' in input.", "output": None}

    strategy = config.get("strategy", "mean")
    await log(f"Filling missing values with strategy='{strategy}'...")

    # Separate numeric and non-numeric columns for strategy application
    numeric_cols = df.select_dtypes(include="number").columns
    non_numeric_cols = df.select_dtypes(exclude="number").columns

    if strategy == "mean":
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        df[non_numeric_cols] = df[non_numeric_cols].fillna("")
    elif strategy == "median":
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        df[non_numeric_cols] = df[non_numeric_cols].fillna("")
    elif strategy == "zero":
        df[numeric_cols] = df[numeric_cols].fillna(0)
        df[non_numeric_cols] = df[non_numeric_cols].fillna("")
    elif strategy == "ffill":
        df = df.ffill()
    else:
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        df[non_numeric_cols] = df[non_numeric_cols].fillna("")

    await log(f"Filled {df.shape[0]} x {df.shape[1]} values")

    # Preserve rows/columns format so downstream nodes (Encode, etc.) can use it
    result = {"X": df.values.tolist(), "data": df.values.tolist()}
    if columns is not None:
        result["rows"] = df.to_dict(orient="records")
        result["columns"] = columns
    if "y" in input_data:
        result["y"] = input_data["y"]
    return {"output": result}


async def _feature_select(input_data, config, log):
    from sklearn.feature_selection import SelectKBest, f_classif

    X_raw = input_data.get("X") or input_data.get("data")
    y_raw = input_data.get("y") or input_data.get("target")
    if X_raw is None or y_raw is None:
        return {"error": "Feature selection requires both 'X' and 'y'.", "output": None}

    X = np.array(X_raw, dtype=float)
    y = np.array(y_raw)
    k = int(config.get("k", min(5, X.shape[1])))
    k = min(k, X.shape[1])

    await log(f"Selecting top {k} features from {X.shape[1]}...")
    selector = SelectKBest(f_classif, k=k)
    X_new = selector.fit_transform(X, y)
    scores = selector.scores_.tolist()
    selected = selector.get_support(indices=True).tolist()
    await log(f"Selected features: {selected} | Scores: {[round(s, 2) for s in scores]}")
    return {
        "output": {"X": X_new.tolist(), "y": y.tolist(), "selected_features": selected, "scores": scores},
    }
