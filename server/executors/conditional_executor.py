import ast
import operator

# Safe operators for expression evaluation
SAFE_OPS = {
    ast.Gt: operator.gt,
    ast.Lt: operator.lt,
    ast.GtE: operator.ge,
    ast.LtE: operator.le,
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
}


def safe_eval_condition(condition: str, data: dict) -> bool:
    """Safely evaluate a simple condition like 'data.score >= 0.8'."""
    try:
        # Replace 'data.xxx' with actual values
        expr = condition
        for key, value in data.items():
            expr = expr.replace(f"data.{key}", repr(value))

        # Parse and evaluate safely
        tree = ast.parse(expr, mode="eval")

        # Only allow simple compare expressions
        if isinstance(tree.body, ast.Compare):
            return bool(eval(compile(tree, "<condition>", "eval")))
        elif isinstance(tree.body, ast.Constant):
            return bool(tree.body.value)
        else:
            return bool(eval(compile(tree, "<condition>", "eval")))
    except Exception:
        return False


async def execute_conditional(node_data: dict, input_data: dict) -> dict:
    """Evaluate a condition and route to true/false branch."""
    config = node_data.get("config", {})
    condition = config.get("condition", "true")

    result = safe_eval_condition(condition, input_data)

    return {
        "output": input_data,
        "condition": condition,
        "result": result,
        "branch": "true" if result else "false",
    }
