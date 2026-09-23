"""
Ensemble Learning Executor — Bagging, Stacking, Voting, Blending.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_ensemble(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "Bagging")
    task = config.get("task", "classification")

    X_raw = input_data.get("X") or input_data.get("data") or input_data.get("features")
    y_raw = input_data.get("y") or input_data.get("target") or input_data.get("labels")

    if X_raw is None:
        return {"error": "Missing 'X' (features).", "output": None}
    if y_raw is None:
        return {"error": "Missing 'y' (target).", "output": None}

    try:
        X = np.array(X_raw, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        y = np.array(y_raw)
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data: {e}", "output": None}

    n_estimators = int(config.get("n_estimators", 10))

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if algorithm == "Bagging":
            from sklearn.ensemble import BaggingClassifier, BaggingRegressor
            await _log(f"Training Bagging ({task}, {n_estimators} estimators)...")
            if task == "regression":
                model = BaggingRegressor(n_estimators=n_estimators, random_state=42)
            else:
                model = BaggingClassifier(n_estimators=n_estimators, random_state=42)

        elif algorithm == "Voting":
            if task == "regression":
                from sklearn.ensemble import VotingRegressor
                from sklearn.linear_model import LinearRegression, Ridge
                from sklearn.tree import DecisionTreeRegressor
                await _log("Training Voting Regressor (LinearReg + Ridge + DecisionTree)...")
                model = VotingRegressor(estimators=[
                    ("lr", LinearRegression()),
                    ("ridge", Ridge()),
                    ("dt", DecisionTreeRegressor(max_depth=5, random_state=42)),
                ])
            else:
                from sklearn.ensemble import VotingClassifier
                from sklearn.linear_model import LogisticRegression
                from sklearn.tree import DecisionTreeClassifier
                from sklearn.neighbors import KNeighborsClassifier
                voting = config.get("voting", "soft")
                await _log(f"Training Voting Classifier ({voting} voting: LogReg + DT + KNN)...")
                model = VotingClassifier(estimators=[
                    ("lr", LogisticRegression(max_iter=1000)),
                    ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
                    ("knn", KNeighborsClassifier()),
                ], voting=voting)

        elif algorithm == "Stacking":
            if task == "regression":
                from sklearn.ensemble import StackingRegressor
                from sklearn.linear_model import LinearRegression, Ridge
                from sklearn.tree import DecisionTreeRegressor
                await _log("Training Stacking Regressor (Ridge + DT -> LinearReg)...")
                model = StackingRegressor(estimators=[
                    ("ridge", Ridge()),
                    ("dt", DecisionTreeRegressor(max_depth=5, random_state=42)),
                ], final_estimator=LinearRegression())
            else:
                from sklearn.ensemble import StackingClassifier
                from sklearn.linear_model import LogisticRegression
                from sklearn.tree import DecisionTreeClassifier
                from sklearn.neighbors import KNeighborsClassifier
                await _log("Training Stacking Classifier (DT + KNN -> LogReg)...")
                model = StackingClassifier(estimators=[
                    ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
                    ("knn", KNeighborsClassifier()),
                ], final_estimator=LogisticRegression(max_iter=1000))

        elif algorithm == "AdaBoost":
            from sklearn.ensemble import AdaBoostClassifier, AdaBoostRegressor
            lr = float(config.get("learning_rate", 1.0))
            await _log(f"Training AdaBoost ({task}, {n_estimators} estimators, lr={lr})...")
            if task == "regression":
                model = AdaBoostRegressor(n_estimators=n_estimators, learning_rate=lr, random_state=42)
            else:
                model = AdaBoostClassifier(n_estimators=n_estimators, learning_rate=lr, random_state=42)

        elif algorithm == "GradientBoosting":
            from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
            lr = float(config.get("learning_rate", 0.1))
            md = int(config.get("max_depth", 3))
            await _log(f"Training Gradient Boosting ({task}, {n_estimators} trees, lr={lr})...")
            if task == "regression":
                model = GradientBoostingRegressor(n_estimators=n_estimators, learning_rate=lr, max_depth=md, random_state=42)
            else:
                model = GradientBoostingClassifier(n_estimators=n_estimators, learning_rate=lr, max_depth=md, random_state=42)

        else:
            return {"error": f"Unknown ensemble method: {algorithm}", "output": None}

        model.fit(X, y)
        predictions = model.predict(X).tolist()
        score = round(model.score(X, y), 4)
        await _log(f"Score: {score}")

        result = {
            "predictions": predictions,
            "score": score,
            "algorithm": algorithm,
            "task": task,
            "samples": X.shape[0],
        }

        await _log(f"Done — {algorithm}")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
