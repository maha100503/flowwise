"""
Neural Network Executor — ANN/DNN via sklearn MLPClassifier/MLPRegressor.
"""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_neural_network(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "ANN")
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

    # Parse hidden layer sizes
    layers_str = config.get("hidden_layers", "100")
    try:
        hidden_layers = tuple(int(x.strip()) for x in str(layers_str).split(",") if x.strip())
    except ValueError:
        hidden_layers = (100,)

    activation = config.get("activation", "relu")
    solver = config.get("solver", "adam")
    lr = float(config.get("learning_rate_init", 0.001))
    max_iter = int(config.get("max_iter", 500))
    batch_size = config.get("batch_size", "auto")
    if batch_size != "auto":
        batch_size = int(batch_size)

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        arch_str = " -> ".join(str(h) for h in hidden_layers)
        await _log(f"Building neural network: {X.shape[1]} -> [{arch_str}] -> output")
        await _log(f"Activation: {activation} | Solver: {solver} | LR: {lr} | Max iter: {max_iter}")

        if task == "regression":
            from sklearn.neural_network import MLPRegressor
            model = MLPRegressor(
                hidden_layer_sizes=hidden_layers,
                activation=activation,
                solver=solver,
                learning_rate_init=lr,
                max_iter=max_iter,
                batch_size=batch_size,
                random_state=42,
            )
        else:
            from sklearn.neural_network import MLPClassifier
            model = MLPClassifier(
                hidden_layer_sizes=hidden_layers,
                activation=activation,
                solver=solver,
                learning_rate_init=lr,
                max_iter=max_iter,
                batch_size=batch_size,
                random_state=42,
            )

        await _log("Training...")
        model.fit(X, y)

        predictions = model.predict(X).tolist()
        score = round(model.score(X, y), 4)
        n_iters = model.n_iter_
        loss = round(float(model.loss_), 6)

        await _log(f"Converged in {n_iters} iterations | Loss: {loss} | Score: {score}")

        # Loss curve
        loss_curve = [round(float(l), 6) for l in model.loss_curve_] if hasattr(model, "loss_curve_") else []

        result = {
            "predictions": predictions,
            "score": score,
            "algorithm": algorithm,
            "task": task,
            "iterations": n_iters,
            "final_loss": loss,
            "loss_curve": loss_curve[-20:],  # last 20 points
            "architecture": list(hidden_layers),
            "activation": activation,
            "n_layers": model.n_layers_,
            "samples": X.shape[0],
            "features": X.shape[1],
        }

        await _log(f"Done — Neural Network ({arch_str})")
        return {"output": result, "algorithm": algorithm}

    except Exception as e:
        return {"error": str(e), "output": None}
