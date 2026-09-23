"""
Dimensionality Reduction Executor — PCA, Kernel PCA, LDA, t-SNE, ICA, Factor Analysis.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_dimensionality(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "PCA")

    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    if X_raw is None:
        return {"error": "Missing input: provide 'X' or 'data'.", "output": None}

    try:
        X = np.array(X_raw, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data: {e}", "output": None}

    n_components = config.get("n_components")
    if n_components:
        n_components = int(n_components)
    else:
        n_components = min(2, X.shape[1])

    y_raw = input_data.get("y") or input_data.get("target") or input_data.get("labels")
    y = np.array(y_raw) if y_raw is not None else None

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if algorithm == "PCA":
            from sklearn.decomposition import PCA
            await _log(f"Running PCA: {X.shape[1]} -> {n_components} components...")
            model = PCA(n_components=n_components)
            X_new = model.fit_transform(X)
            explained = model.explained_variance_ratio_.tolist()
            total_var = round(sum(explained), 4)
            await _log(f"Explained variance: {total_var} ({[round(v, 4) for v in explained]})")
            result = {
                "X": X_new.tolist(), "data": X_new.tolist(),
                "explained_variance_ratio": explained,
                "total_variance_explained": total_var,
                "components": model.components_.tolist(),
            }

        elif algorithm == "KernelPCA":
            from sklearn.decomposition import KernelPCA
            kernel = config.get("kernel", "rbf")
            await _log(f"Running Kernel PCA (kernel={kernel}): -> {n_components} components...")
            model = KernelPCA(n_components=n_components, kernel=kernel)
            X_new = model.fit_transform(X)
            result = {"X": X_new.tolist(), "data": X_new.tolist()}

        elif algorithm == "LDA":
            from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
            if y is None:
                return {"error": "LDA requires target 'y'.", "output": None}
            n_classes = len(np.unique(y))
            n_comp = min(n_components, n_classes - 1, X.shape[1])
            await _log(f"Running LDA: {X.shape[1]} -> {n_comp} components ({n_classes} classes)...")
            model = LinearDiscriminantAnalysis(n_components=n_comp)
            X_new = model.fit_transform(X, y)
            explained = model.explained_variance_ratio_.tolist()
            await _log(f"Explained variance: {[round(v, 4) for v in explained]}")
            result = {
                "X": X_new.tolist(), "data": X_new.tolist(),
                "explained_variance_ratio": explained,
            }

        elif algorithm == "tSNE":
            from sklearn.manifold import TSNE
            perplexity = float(config.get("perplexity", 30.0))
            n_comp = min(n_components, 3)
            await _log(f"Running t-SNE: -> {n_comp}D (perplexity={perplexity})...")
            model = TSNE(n_components=n_comp, perplexity=perplexity, random_state=42)
            X_new = model.fit_transform(X)
            kl_div = round(float(model.kl_divergence_), 4)
            await _log(f"KL divergence: {kl_div}")
            result = {
                "X": X_new.tolist(), "data": X_new.tolist(),
                "kl_divergence": kl_div,
            }

        elif algorithm == "ICA":
            from sklearn.decomposition import FastICA
            await _log(f"Running ICA: {X.shape[1]} -> {n_components} components...")
            model = FastICA(n_components=n_components, random_state=42)
            X_new = model.fit_transform(X)
            result = {
                "X": X_new.tolist(), "data": X_new.tolist(),
                "mixing_matrix": model.mixing_.tolist(),
            }

        elif algorithm == "FactorAnalysis":
            from sklearn.decomposition import FactorAnalysis
            await _log(f"Running Factor Analysis: {X.shape[1]} -> {n_components} factors...")
            model = FactorAnalysis(n_components=n_components, random_state=42)
            X_new = model.fit_transform(X)
            result = {
                "X": X_new.tolist(), "data": X_new.tolist(),
                "noise_variance": model.noise_variance_.tolist(),
            }

        else:
            return {"error": f"Unknown algorithm: {algorithm}", "output": None}

        if y is not None:
            result["y"] = y.tolist()

        await _log(f"Reduced: {X.shape} -> ({len(X_new)}, {n_components})")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
