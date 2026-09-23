"""Time Series executor — ARIMA, SARIMA, SARIMAX, Exponential Smoothing, Moving Average, Decomposition."""

import numpy as np
from typing import Optional, Callable, Awaitable


async def execute_timeseries(
    node_data: dict,
    input_data: dict,
    on_output: Optional[Callable[[str], Awaitable[None]]] = None,
) -> dict:
    config = node_data.get("config", {})
    algorithm = node_data.get("subType") or config.get("algorithm", "ARIMA")

    data_raw = input_data.get("data") or input_data.get("series") or input_data.get("y") or input_data.get("output")

    if data_raw is None:
        return {"error": "Missing input: provide 'data' or 'series' (1-D array).", "output": None}

    try:
        data = np.array(data_raw, dtype=float).flatten()
    except (ValueError, TypeError) as e:
        return {"error": f"Invalid data format: {e}", "output": None}

    if len(data) < 5:
        return {"error": "Time series too short — need at least 5 data points.", "output": None}

    async def _log(msg: str):
        if on_output:
            await on_output(msg + "\n")

    try:
        if algorithm == "ARIMA":
            return await _arima(data, config, _log)
        elif algorithm == "SARIMA":
            return await _sarima(data, config, _log)
        elif algorithm == "SARIMAX":
            return await _sarimax(data, config, _log, input_data)
        elif algorithm == "ExponentialSmoothing":
            return await _exponential_smoothing(data, config, _log)
        elif algorithm == "MovingAverage":
            return await _moving_average(data, config, _log)
        elif algorithm == "Decomposition":
            return await _decomposition(data, config, _log)
        else:
            return {"error": f"Unknown algorithm: {algorithm}", "output": None}
    except Exception as e:
        return {"error": str(e), "output": None}


async def _arima(data, config, log):
    from statsmodels.tsa.arima.model import ARIMA

    p = int(config.get("p", 1))
    d = int(config.get("d", 1))
    q = int(config.get("q", 0))
    steps = int(config.get("forecast_steps", 5))

    await log(f"Fitting ARIMA({p},{d},{q}) on {len(data)} observations...")
    model = ARIMA(data, order=(p, d, q))
    fitted = model.fit()
    forecast = fitted.forecast(steps=steps).tolist()
    fitted_values = fitted.fittedvalues.tolist()
    aic = round(float(fitted.aic), 2)
    await log(f"AIC: {aic} | Forecasted {steps} steps ahead")
    return {
        "output": {
            "forecast": forecast,
            "fitted_values": fitted_values,
            "aic": aic,
            "order": [p, d, q],
        },
        "algorithm": "ARIMA",
    }


async def _sarima(data, config, log):
    from statsmodels.tsa.statespace.sarimax import SARIMAX

    p = int(config.get("p", 1))
    d = int(config.get("d", 1))
    q = int(config.get("q", 0))
    P = int(config.get("P", 1))
    D = int(config.get("D", 1))
    Q = int(config.get("Q", 0))
    s = int(config.get("seasonal_period", 12))
    steps = int(config.get("forecast_steps", 5))

    await log(f"Fitting SARIMA({p},{d},{q})({P},{D},{Q})[{s}] on {len(data)} observations...")
    model = SARIMAX(data, order=(p, d, q), seasonal_order=(P, D, Q, s))
    fitted = model.fit(disp=False)
    forecast = fitted.forecast(steps=steps).tolist()
    fitted_values = fitted.fittedvalues.tolist()
    aic = round(float(fitted.aic), 2)
    await log(f"AIC: {aic} | Forecasted {steps} steps")
    return {
        "output": {
            "forecast": forecast, "fitted_values": fitted_values, "aic": aic,
            "order": [p, d, q], "seasonal_order": [P, D, Q, s],
        },
        "algorithm": "SARIMA",
    }


async def _sarimax(data, config, log, input_data):
    from statsmodels.tsa.statespace.sarimax import SARIMAX

    p = int(config.get("p", 1))
    d = int(config.get("d", 1))
    q = int(config.get("q", 0))
    P = int(config.get("P", 0))
    D = int(config.get("D", 0))
    Q = int(config.get("Q", 0))
    s = int(config.get("seasonal_period", 12))
    steps = int(config.get("forecast_steps", 5))

    exog = input_data.get("exog") or input_data.get("X")
    exog_arr = np.array(exog, dtype=float) if exog is not None else None

    await log(f"Fitting SARIMAX({p},{d},{q})({P},{D},{Q})[{s}] with exog={'yes' if exog_arr is not None else 'no'}...")
    seasonal_order = (P, D, Q, s) if (P or D or Q) else (0, 0, 0, 0)
    model = SARIMAX(data, exog=exog_arr, order=(p, d, q), seasonal_order=seasonal_order)
    fitted = model.fit(disp=False)
    forecast = fitted.forecast(steps=steps).tolist()
    fitted_values = fitted.fittedvalues.tolist()
    aic = round(float(fitted.aic), 2)
    await log(f"AIC: {aic} | Forecasted {steps} steps")
    return {
        "output": {"forecast": forecast, "fitted_values": fitted_values, "aic": aic},
        "algorithm": "SARIMAX",
    }


async def _exponential_smoothing(data, config, log):
    from statsmodels.tsa.holtwinters import ExponentialSmoothing

    trend = config.get("trend", "add")
    seasonal = config.get("seasonal")
    seasonal_periods = int(config.get("seasonal_periods", 12)) if seasonal else None
    steps = int(config.get("forecast_steps", 5))

    await log(f"Fitting Exponential Smoothing (trend={trend})...")
    model = ExponentialSmoothing(
        data,
        trend=trend if trend != "none" else None,
        seasonal=seasonal if seasonal and seasonal != "none" else None,
        seasonal_periods=seasonal_periods,
    )
    fitted = model.fit(optimized=True)
    forecast = fitted.forecast(steps).tolist()
    fitted_values = fitted.fittedvalues.tolist()
    aic = round(float(fitted.aic), 2)
    await log(f"AIC: {aic} | Forecasted {steps} steps")
    return {
        "output": {"forecast": forecast, "fitted_values": fitted_values, "aic": aic},
        "algorithm": "ExponentialSmoothing",
    }


async def _moving_average(data, config, log):
    import pandas as pd

    window = int(config.get("window", 3))
    await log(f"Computing Moving Average with window={window}...")
    series = pd.Series(data)
    ma = series.rolling(window=window).mean()
    result = ma.dropna().tolist()
    await log(f"Produced {len(result)} smoothed values")
    return {
        "output": {"moving_average": result, "window": window, "original_length": len(data)},
        "algorithm": "MovingAverage",
    }


async def _decomposition(data, config, log):
    from statsmodels.tsa.seasonal import seasonal_decompose
    import pandas as pd

    period = int(config.get("period", max(2, len(data) // 4)))
    model_type = config.get("model", "additive")

    if period > len(data) // 2:
        period = max(2, len(data) // 4)

    await log(f"Decomposing time series (model={model_type}, period={period})...")
    result = seasonal_decompose(data, model=model_type, period=period)

    def _safe_list(arr):
        return [None if np.isnan(v) else round(float(v), 6) for v in arr]

    await log("Extracted trend, seasonal, and residual components")
    return {
        "output": {
            "trend": _safe_list(result.trend),
            "seasonal": _safe_list(result.seasonal),
            "residual": _safe_list(result.resid),
            "observed": data.tolist(),
        },
        "algorithm": "Decomposition",
    }
