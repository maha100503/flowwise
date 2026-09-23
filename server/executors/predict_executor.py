"""
Predict executor — apply a trained model to new/unseen data.
Expects a trained model from an ML/Ensemble/NeuralNetwork upstream node
and data rows from another input.
"""

import warnings
from typing import Optional, Callable, Awaitable

warnings.filterwarnings("ignore")


async def execute_predict(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    output_column = config.get("output_column", "prediction")
    include_proba = config.get("include_proba", True)

    if on_output:
        await on_output("Predict: loading model and data...\n")

    # Extract model and data from inputs
    model = None
    data_rows = None
    feature_columns = None
    scaler = None

    # Look through input data for model and rows
    sources = {}
    if "model" in input_data:
        sources["root"] = input_data
    for key, val in input_data.items():
        if isinstance(val, dict):
            sources[key] = val

    for key, src in sources.items():
        if isinstance(src, dict):
            if "model" in src and model is None:
                model = src["model"]
                feature_columns = src.get("feature_columns") or src.get("columns")
                scaler = src.get("scaler")
            if "rows" in src and data_rows is None:
                data_rows = src["rows"]

    # Also check if rows are at top level
    if data_rows is None and "rows" in input_data:
        data_rows = input_data["rows"]

    if model is None:
        return {"error": "No trained model found. Connect an ML model node upstream."}
    if data_rows is None or not isinstance(data_rows, list):
        return {"error": "No data rows found. Connect a data source upstream."}

    if on_output:
        await on_output(f"Model loaded. Predicting on {len(data_rows)} rows...\n")

    try:
        import numpy as np

        # Build feature matrix
        if feature_columns:
            cols = feature_columns
        else:
            # Try to infer: use all numeric columns
            cols = []
            sample = data_rows[0]
            for k, v in sample.items():
                try:
                    float(v)
                    cols.append(k)
                except (ValueError, TypeError):
                    pass

        X = []
        for row in data_rows:
            x_row = []
            for col in cols:
                try:
                    x_row.append(float(row.get(col, 0) or 0))
                except (ValueError, TypeError):
                    x_row.append(0)
            X.append(x_row)

        X = np.array(X)

        # Apply scaler if available
        if scaler is not None:
            try:
                X = scaler.transform(X)
            except Exception:
                pass

        # Predict
        predictions = model.predict(X)

        # Try probabilities
        probabilities = None
        if include_proba and hasattr(model, "predict_proba"):
            try:
                probabilities = model.predict_proba(X)
            except Exception:
                pass

        # Attach predictions to rows
        result_rows = []
        for i, row in enumerate(data_rows):
            new_row = dict(row)
            pred = predictions[i]
            new_row[output_column] = pred.item() if hasattr(pred, 'item') else pred
            if probabilities is not None:
                proba = probabilities[i]
                new_row[f"{output_column}_confidence"] = round(float(max(proba)), 4)
                # Add per-class probabilities
                if hasattr(model, "classes_"):
                    for cls_idx, cls in enumerate(model.classes_):
                        if cls_idx < len(proba):
                            new_row[f"{output_column}_prob_{cls}"] = round(float(proba[cls_idx]), 4)
            result_rows.append(new_row)

        if on_output:
            unique_preds = set(str(p) for p in predictions[:100])
            await on_output(f"✓ Predicted {len(result_rows)} rows. Unique values: {len(unique_preds)}\n")
            # Show distribution for classification
            if len(unique_preds) <= 20:
                from collections import Counter
                dist = Counter(str(p.item() if hasattr(p, 'item') else p) for p in predictions)
                for label, count in dist.most_common():
                    await on_output(f"  {label}: {count} ({count/len(predictions)*100:.1f}%)\n")

        columns = list(result_rows[0].keys()) if result_rows else []
        return {
            "rows": result_rows,
            "columns": columns,
            "row_count": len(result_rows),
            "prediction_column": output_column,
            "feature_columns": cols,
        }

    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}
