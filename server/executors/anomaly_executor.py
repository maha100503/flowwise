"""
Anomaly Detection Executor — Isolation Forest, One-Class SVM, LOF, Elliptic Envelope.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_anomaly(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "IsolationForest")

    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    if X_raw is None:
        return {"error": "Missing input: provide 'X' or 'data'.", "output": None}

    try:
        X = np.array(X_raw, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data: {e}", "output": None}

    contamination = float(config.get("contamination", 0.1))

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if algorithm == "IsolationForest":
            from sklearn.ensemble import IsolationForest
            n = int(config.get("n_estimators", 100))
            await _log(f"Running Isolation Forest ({n} trees, contamination={contamination})...")
            model = IsolationForest(n_estimators=n, contamination=contamination, random_state=42)

        elif algorithm == "OneClassSVM":
            from sklearn.svm import OneClassSVM
            kernel = config.get("kernel", "rbf")
            nu = float(config.get("nu", 0.1))
            await _log(f"Running One-Class SVM (kernel={kernel}, nu={nu})...")
            model = OneClassSVM(kernel=kernel, nu=nu)

        elif algorithm == "LOF":
            from sklearn.neighbors import LocalOutlierFactor
            k = int(config.get("n_neighbors", 20))
            await _log(f"Running LOF (k={k}, contamination={contamination})...")
            model = LocalOutlierFactor(n_neighbors=k, contamination=contamination, novelty=False)

        elif algorithm == "EllipticEnvelope":
            from sklearn.covariance import EllipticEnvelope
            await _log(f"Running Elliptic Envelope (contamination={contamination})...")
            model = EllipticEnvelope(contamination=contamination, random_state=42)

        else:
            return {"error": f"Unknown algorithm: {algorithm}", "output": None}

        # LOF uses fit_predict directly
        if algorithm == "LOF":
            labels = model.fit_predict(X)
            scores = model.negative_outlier_factor_.tolist()
        else:
            model.fit(X)
            labels = model.predict(X)
            scores = model.decision_function(X).tolist()

        # labels: 1 = inlier, -1 = outlier
        labels_list = labels.tolist()
        n_outliers = labels_list.count(-1)
        n_inliers = labels_list.count(1)
        outlier_pct = round(n_outliers / len(labels_list) * 100, 2)

        await _log(f"Inliers: {n_inliers} | Outliers: {n_outliers} ({outlier_pct}%)")

        # Indices of outliers
        outlier_indices = [i for i, l in enumerate(labels_list) if l == -1]

        result = {
            "labels": labels_list,
            "anomaly_scores": scores,
            "n_outliers": n_outliers,
            "n_inliers": n_inliers,
            "outlier_percentage": outlier_pct,
            "outlier_indices": outlier_indices,
            "algorithm": algorithm,
        }

        await _log(f"Done — {algorithm}")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
