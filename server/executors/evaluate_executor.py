"""Evaluation executor — classification/regression metrics and analysis."""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_evaluate(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    metric_type = node_data.get("subType") or config.get("metric", "Auto")

    y_true = input_data.get("y_true") or input_data.get("y") or input_data.get("target") or input_data.get("labels")
    y_pred = input_data.get("y_pred") or input_data.get("predictions")

    if y_true is None or y_pred is None:
        return {"error": "Requires 'y_true'/'y' and 'y_pred'/'predictions' in input.", "output": None}

    try:
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data format: {e}", "output": None}

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if metric_type == "Auto":
            # Detect: if y_true has few unique vals → classification, else regression
            unique_vals = len(np.unique(y_true))
            if unique_vals <= 20 and unique_vals < len(y_true) * 0.1:
                await _log("Auto-detected: classification task")
                return await _classification_metrics(y_true, y_pred, config, _log)
            else:
                await _log("Auto-detected: regression task")
                return await _regression_metrics(y_true, y_pred, config, _log)
        elif metric_type == "Classification":
            return await _classification_metrics(y_true, y_pred, config, _log)
        elif metric_type == "Regression":
            return await _regression_metrics(y_true, y_pred, config, _log)
        else:
            return {"error": f"Unknown metric type: {metric_type}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _classification_metrics(y_true, y_pred, config, log):
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

    await log(f"Evaluating classification on {len(y_true)} samples...")

    average = config.get("average", "weighted")
    acc = round(float(accuracy_score(y_true, y_pred)), 4)
    prec = round(float(precision_score(y_true, y_pred, average=average, zero_division=0)), 4)
    rec = round(float(recall_score(y_true, y_pred, average=average, zero_division=0)), 4)
    f1 = round(float(f1_score(y_true, y_pred, average=average, zero_division=0)), 4)
    cm = confusion_matrix(y_true, y_pred).tolist()

    await log(f"Accuracy: {acc} | Precision: {prec} | Recall: {rec} | F1: {f1}")
    return {
        "output": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "confusion_matrix": cm,
            "task": "classification",
        },
    }


async def _regression_metrics(y_true, y_pred, config, log):
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

    await log(f"Evaluating regression on {len(y_true)} samples...")

    mse = round(float(mean_squared_error(y_true, y_pred)), 4)
    rmse = round(float(np.sqrt(mse)), 4)
    mae = round(float(mean_absolute_error(y_true, y_pred)), 4)
    r2 = round(float(r2_score(y_true, y_pred)), 4)

    await log(f"MSE: {mse} | RMSE: {rmse} | MAE: {mae} | R²: {r2}")
    return {
        "output": {
            "mse": mse,
            "rmse": rmse,
            "mae": mae,
            "r2_score": r2,
            "task": "regression",
        },
    }
