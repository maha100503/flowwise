"""
Model Selector executor — compare multiple model evaluation results and pick the best.
Accepts evaluation metrics from multiple upstream Evaluate nodes.
"""

from typing import Optional, Callable, Awaitable


async def execute_model_selector(node_data: dict, input_data: dict, on_output: Optional[Callable[[str], Awaitable[None]]] = None) -> dict:
    config = node_data.get("config", {})
    metric = config.get("metric", "accuracy")  # accuracy, f1, precision, recall, auc, mse, rmse, r2, mae
    mode = config.get("mode", "max")  # max (higher is better) or min (lower is better)

    if on_output:
        await on_output(f"Model Selector: comparing by '{metric}' ({mode})...\n")

    # Collect all evaluation results from inputs
    candidates = []

    def extract_candidate(key, data):
        if not isinstance(data, dict):
            return
        metrics = data.get("metrics", data)
        if isinstance(metrics, dict) and any(k in metrics for k in ("accuracy", "f1", "mse", "r2", "rmse", "mae", "precision", "recall")):
            name = data.get("model_name") or data.get("algorithm") or key
            score = metrics.get(metric)
            if score is not None:
                candidates.append({
                    "name": str(name),
                    "score": float(score),
                    "metrics": metrics,
                    "model": data.get("model"),
                    "predictions": data.get("predictions"),
                    "source_data": data,
                })

    # Check if input is a single eval result or multiple
    if "metrics" in input_data:
        extract_candidate("model_0", input_data)
    else:
        for key, val in input_data.items():
            if isinstance(val, dict):
                extract_candidate(key, val)

    if not candidates:
        return {"error": f"No evaluation results found with metric '{metric}'. Connect Evaluate nodes to this node."}

    if on_output:
        await on_output(f"Found {len(candidates)} models to compare.\n")
        for c in candidates:
            await on_output(f"  {c['name']}: {metric}={c['score']:.4f}\n")

    # Sort and pick best
    candidates.sort(key=lambda x: x["score"], reverse=(mode == "max"))
    best = candidates[0]

    if on_output:
        await on_output(f"\n🏆 Best model: {best['name']} ({metric}={best['score']:.4f})\n")

    # Build comparison table
    comparison = []
    for i, c in enumerate(candidates):
        comparison.append({
            "rank": i + 1,
            "model": c["name"],
            metric: round(c["score"], 6),
            **{k: round(v, 6) if isinstance(v, float) else v for k, v in c["metrics"].items()},
        })

    result = {
        "best_model_name": best["name"],
        "best_score": best["score"],
        "best_metric": metric,
        "best_metrics": best["metrics"],
        "model": best.get("model"),
        "predictions": best.get("predictions"),
        "comparison": comparison,
        "all_candidates": len(candidates),
    }

    return result
