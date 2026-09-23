"""
ML Algorithm Executor — comprehensive regression & classification.

Supports: Linear, Polynomial, Ridge, Lasso, ElasticNet, Bayesian Ridge,
SVR/SVM, Decision Tree, Random Forest, Gradient Boosting, AdaBoost,
XGBoost, LightGBM, KNN, Logistic Regression, Naive Bayes (Gaussian,
Multinomial, Bernoulli), SGD, Perceptron, Passive Aggressive.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


def _get_model(algorithm: str, config: dict, task: str):
    """Return (model_instance, display_name) for the given algorithm."""

    # ── Regression ──────────────────────────────────────────────────────
    if algorithm == "LinearRegression":
        from sklearn.linear_model import LinearRegression
        return LinearRegression(), "Linear Regression"

    if algorithm == "PolynomialRegression":
        from sklearn.linear_model import LinearRegression
        from sklearn.preprocessing import PolynomialFeatures
        from sklearn.pipeline import Pipeline
        degree = int(config.get("degree", 2))
        return Pipeline([
            ("poly", PolynomialFeatures(degree=degree, include_bias=False)),
            ("lr", LinearRegression()),
        ]), f"Polynomial Regression (degree={degree})"

    if algorithm == "Ridge":
        from sklearn.linear_model import Ridge
        alpha = float(config.get("alpha", 1.0))
        return Ridge(alpha=alpha), f"Ridge (alpha={alpha})"

    if algorithm == "Lasso":
        from sklearn.linear_model import Lasso
        alpha = float(config.get("alpha", 1.0))
        return Lasso(alpha=alpha, max_iter=5000), f"Lasso (alpha={alpha})"

    if algorithm == "ElasticNet":
        from sklearn.linear_model import ElasticNet
        alpha = float(config.get("alpha", 1.0))
        l1_ratio = float(config.get("l1_ratio", 0.5))
        return ElasticNet(alpha=alpha, l1_ratio=l1_ratio, max_iter=5000), f"ElasticNet (alpha={alpha}, l1={l1_ratio})"

    if algorithm == "BayesianRidge":
        from sklearn.linear_model import BayesianRidge
        return BayesianRidge(), "Bayesian Ridge"

    if algorithm == "QuantileRegression":
        from sklearn.linear_model import QuantileRegressor
        quantile = float(config.get("quantile", 0.5))
        return QuantileRegressor(quantile=quantile, solver="highs"), f"Quantile Regression (q={quantile})"

    # ── Support Vector ──────────────────────────────────────────────────
    if algorithm == "SVR":
        from sklearn.svm import SVR
        kernel = config.get("kernel", "rbf")
        C = float(config.get("C", 1.0))
        return SVR(kernel=kernel, C=C), f"SVR (kernel={kernel}, C={C})"

    if algorithm == "SVM":
        from sklearn.svm import SVC, SVR
        kernel = config.get("kernel", "rbf")
        C = float(config.get("C", 1.0))
        if task == "regression":
            return SVR(kernel=kernel, C=C), f"SVR (kernel={kernel}, C={C})"
        return SVC(kernel=kernel, C=C), f"SVM (kernel={kernel}, C={C})"

    # ── Tree-Based ──────────────────────────────────────────────────────
    if algorithm == "DecisionTree":
        from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
        max_depth = config.get("max_depth")
        max_depth = int(max_depth) if max_depth else None
        if task == "regression":
            return DecisionTreeRegressor(max_depth=max_depth, random_state=42), "Decision Tree Regressor"
        return DecisionTreeClassifier(max_depth=max_depth, random_state=42), "Decision Tree Classifier"

    if algorithm == "RandomForest":
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
        n = int(config.get("n_estimators", 100))
        md = config.get("max_depth")
        md = int(md) if md else None
        if task == "regression":
            return RandomForestRegressor(n_estimators=n, max_depth=md, random_state=42), f"Random Forest Regressor ({n} trees)"
        return RandomForestClassifier(n_estimators=n, max_depth=md, random_state=42), f"Random Forest Classifier ({n} trees)"

    if algorithm == "GradientBoosting":
        from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
        n = int(config.get("n_estimators", 100))
        lr = float(config.get("learning_rate", 0.1))
        md = int(config.get("max_depth", 3))
        if task == "regression":
            return GradientBoostingRegressor(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42), f"Gradient Boosting Regressor ({n} trees)"
        return GradientBoostingClassifier(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42), f"Gradient Boosting Classifier ({n} trees)"

    if algorithm == "AdaBoost":
        from sklearn.ensemble import AdaBoostClassifier, AdaBoostRegressor
        n = int(config.get("n_estimators", 50))
        lr = float(config.get("learning_rate", 1.0))
        if task == "regression":
            return AdaBoostRegressor(n_estimators=n, learning_rate=lr, random_state=42), f"AdaBoost Regressor ({n} estimators)"
        return AdaBoostClassifier(n_estimators=n, learning_rate=lr, random_state=42), f"AdaBoost Classifier ({n} estimators)"

    # ── XGBoost / LightGBM ──────────────────────────────────────────────
    if algorithm == "XGBoost":
        try:
            from xgboost import XGBClassifier, XGBRegressor
        except ImportError:
            raise ImportError("xgboost not installed. Run: pip install xgboost")
        n = int(config.get("n_estimators", 100))
        lr = float(config.get("learning_rate", 0.1))
        md = int(config.get("max_depth", 6))
        if task == "regression":
            return XGBRegressor(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42, verbosity=0), f"XGBoost Regressor ({n} trees)"
        return XGBClassifier(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42, verbosity=0, eval_metric="logloss"), f"XGBoost Classifier ({n} trees)"

    if algorithm == "LightGBM":
        try:
            from lightgbm import LGBMClassifier, LGBMRegressor
        except ImportError:
            raise ImportError("lightgbm not installed. Run: pip install lightgbm")
        n = int(config.get("n_estimators", 100))
        lr = float(config.get("learning_rate", 0.1))
        md = int(config.get("max_depth", -1))
        if task == "regression":
            return LGBMRegressor(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42, verbose=-1), f"LightGBM Regressor ({n} trees)"
        return LGBMClassifier(n_estimators=n, learning_rate=lr, max_depth=md, random_state=42, verbose=-1), f"LightGBM Classifier ({n} trees)"

    # ── KNN ─────────────────────────────────────────────────────────────
    if algorithm == "KNN":
        from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
        k = int(config.get("n_neighbors", 5))
        if task == "regression":
            return KNeighborsRegressor(n_neighbors=k), f"KNN Regressor (k={k})"
        return KNeighborsClassifier(n_neighbors=k), f"KNN Classifier (k={k})"

    # ── Logistic / Linear Classification ────────────────────────────────
    if algorithm == "LogisticRegression":
        from sklearn.linear_model import LogisticRegression
        C = float(config.get("C", 1.0))
        return LogisticRegression(C=C, max_iter=1000, random_state=42), f"Logistic Regression (C={C})"

    if algorithm == "SGDClassifier":
        from sklearn.linear_model import SGDClassifier
        return SGDClassifier(max_iter=1000, random_state=42), "SGD Classifier"

    if algorithm == "Perceptron":
        from sklearn.linear_model import Perceptron
        return Perceptron(max_iter=1000, random_state=42), "Perceptron"

    if algorithm == "PassiveAggressive":
        from sklearn.linear_model import PassiveAggressiveClassifier
        C = float(config.get("C", 1.0))
        return PassiveAggressiveClassifier(C=C, max_iter=1000, random_state=42), f"Passive Aggressive (C={C})"

    # ── Naive Bayes ─────────────────────────────────────────────────────
    if algorithm == "GaussianNB":
        from sklearn.naive_bayes import GaussianNB
        return GaussianNB(), "Gaussian Naive Bayes"

    if algorithm == "MultinomialNB":
        from sklearn.naive_bayes import MultinomialNB
        alpha = float(config.get("alpha", 1.0))
        return MultinomialNB(alpha=alpha), f"Multinomial NB (alpha={alpha})"

    if algorithm == "BernoulliNB":
        from sklearn.naive_bayes import BernoulliNB
        alpha = float(config.get("alpha", 1.0))
        return BernoulliNB(alpha=alpha), f"Bernoulli NB (alpha={alpha})"

    raise ValueError(f"Unknown algorithm: {algorithm}")


# ---------------------------------------------------------------------------
# Main executor
# ---------------------------------------------------------------------------

REGRESSION_ONLY = {
    "LinearRegression", "PolynomialRegression", "Ridge", "Lasso",
    "ElasticNet", "BayesianRidge", "QuantileRegression", "SVR",
}
CLASSIFICATION_ONLY = {
    "LogisticRegression", "SGDClassifier", "Perceptron",
    "PassiveAggressive", "GaussianNB", "MultinomialNB", "BernoulliNB",
}


async def execute_ml(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "LinearRegression")
    task = config.get("task", "classification")

    if algorithm in REGRESSION_ONLY:
        task = "regression"
    elif algorithm in CLASSIFICATION_ONLY:
        task = "classification"

    X_raw = input_data.get("X") or input_data.get("features") or input_data.get("data")
    y_raw = input_data.get("y") or input_data.get("target") or input_data.get("labels")

    if X_raw is None:
        return {"error": "Missing input: provide 'X' (features).", "output": None}

    try:
        X = np.array(X_raw, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid X data: {e}", "output": None}

    if y_raw is None:
        return {"error": f"{algorithm} requires target 'y'.", "output": None}

    try:
        y = np.array(y_raw)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid y data: {e}", "output": None}

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        model, display_name = _get_model(algorithm, config, task)
        await _log(f"Training {display_name} on {X.shape[0]} samples, {X.shape[1]} features...")

        model.fit(X, y)

        # Use test set for evaluation if available, otherwise fall back to training data
        X_test_raw = input_data.get("X_test")
        y_test_raw = input_data.get("y_test")
        if X_test_raw is not None and y_test_raw is not None:
            X_eval = np.array(X_test_raw, dtype=float)
            y_eval = np.array(y_test_raw)
            if X_eval.ndim == 1:
                X_eval = X_eval.reshape(-1, 1)
            await _log(f"Evaluating on test set: {X_eval.shape[0]} samples")
        else:
            X_eval = X
            y_eval = y
            await _log("No test set found — evaluating on training data (may overfit)")

        predictions = model.predict(X_eval).tolist()
        score = round(model.score(X_eval, y_eval), 4)
        await _log(f"Score: {score}")

        result: dict = {
            "predictions": predictions,
            "y_true": y_eval.tolist(),
            "y": y_eval.tolist(),
            "score": score,
            "algorithm": algorithm,
            "task": task,
            "samples": X_eval.shape[0],
            "features": X.shape[1],
        }

        if hasattr(model, "coef_"):
            coef = model.coef_
            result["coefficients"] = coef.tolist() if hasattr(coef, "tolist") else coef
        if hasattr(model, "intercept_"):
            intercept = model.intercept_
            result["intercept"] = float(intercept) if np.isscalar(intercept) or (hasattr(intercept, "ndim") and intercept.ndim == 0) else intercept.tolist() if hasattr(intercept, "tolist") else float(intercept)
        if hasattr(model, "feature_importances_"):
            result["feature_importances"] = model.feature_importances_.tolist()
            top_idx = int(np.argmax(model.feature_importances_))
            await _log(f"Top feature: index {top_idx} (importance={model.feature_importances_[top_idx]:.4f})")

        await _log(f"Done — {display_name}")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
