"""
Clustering Executor — KMeans, DBSCAN, Hierarchical, GMM, Spectral,
Mean Shift, Affinity Propagation, BIRCH.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


def _get_clusterer(algorithm: str, config: dict):
    if algorithm == "KMeans":
        from sklearn.cluster import KMeans
        k = int(config.get("n_clusters", 3))
        return KMeans(n_clusters=k, random_state=42, n_init=10), f"K-Means (k={k})"

    if algorithm == "MiniBatchKMeans":
        from sklearn.cluster import MiniBatchKMeans
        k = int(config.get("n_clusters", 3))
        return MiniBatchKMeans(n_clusters=k, random_state=42, n_init=10), f"Mini-Batch K-Means (k={k})"

    if algorithm == "DBSCAN":
        from sklearn.cluster import DBSCAN
        eps = float(config.get("eps", 0.5))
        min_samples = int(config.get("min_samples", 5))
        return DBSCAN(eps=eps, min_samples=min_samples), f"DBSCAN (eps={eps}, min_samples={min_samples})"

    if algorithm == "HDBSCAN":
        try:
            from sklearn.cluster import HDBSCAN
            min_cluster = int(config.get("min_cluster_size", 5))
            return HDBSCAN(min_cluster_size=min_cluster), f"HDBSCAN (min_cluster={min_cluster})"
        except ImportError:
            raise ImportError("HDBSCAN requires sklearn >= 1.3")

    if algorithm == "Hierarchical":
        from sklearn.cluster import AgglomerativeClustering
        k = int(config.get("n_clusters", 3))
        linkage = config.get("linkage", "ward")
        return AgglomerativeClustering(n_clusters=k, linkage=linkage), f"Hierarchical (k={k}, linkage={linkage})"

    if algorithm == "GMM":
        from sklearn.mixture import GaussianMixture
        k = int(config.get("n_components", 3))
        return GaussianMixture(n_components=k, random_state=42), f"GMM (k={k})"

    if algorithm == "SpectralClustering":
        from sklearn.cluster import SpectralClustering
        k = int(config.get("n_clusters", 3))
        return SpectralClustering(n_clusters=k, random_state=42, affinity="nearest_neighbors"), f"Spectral Clustering (k={k})"

    if algorithm == "MeanShift":
        from sklearn.cluster import MeanShift
        return MeanShift(), "Mean Shift"

    if algorithm == "AffinityPropagation":
        from sklearn.cluster import AffinityPropagation
        damping = float(config.get("damping", 0.5))
        return AffinityPropagation(damping=damping, random_state=42), f"Affinity Propagation (damping={damping})"

    if algorithm == "Birch":
        from sklearn.cluster import Birch
        k = int(config.get("n_clusters", 3))
        threshold = float(config.get("threshold", 0.5))
        return Birch(n_clusters=k, threshold=threshold), f"BIRCH (k={k})"

    raise ValueError(f"Unknown clustering algorithm: {algorithm}")


async def execute_clustering(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "KMeans")

    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    if X_raw is None:
        return {"error": "Missing input: provide 'X' or 'data'.", "output": None}

    try:
        X = np.array(X_raw, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data: {e}", "output": None}

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        model, display_name = _get_clusterer(algorithm, config)
        await _log(f"Running {display_name} on {X.shape[0]} samples, {X.shape[1]} features...")

        labels = model.fit_predict(X).tolist()
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        await _log(f"Found {n_clusters} clusters")

        result: dict = {
            "labels": labels,
            "n_clusters": n_clusters,
            "algorithm": algorithm,
            "samples": X.shape[0],
        }

        if hasattr(model, "cluster_centers_"):
            result["cluster_centers"] = model.cluster_centers_.tolist()
        if hasattr(model, "inertia_"):
            result["inertia"] = round(float(model.inertia_), 4)
            await _log(f"Inertia: {result['inertia']}")

        # Silhouette score for quality
        if n_clusters >= 2 and n_clusters < X.shape[0]:
            from sklearn.metrics import silhouette_score
            sil = round(float(silhouette_score(X, labels)), 4)
            result["silhouette_score"] = sil
            await _log(f"Silhouette score: {sil}")

        await _log(f"Done — {display_name}")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
