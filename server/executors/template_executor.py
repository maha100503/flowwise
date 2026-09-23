import re


async def execute_template(node_data: dict, input_data: dict) -> dict:
    """Replace {{variable}} placeholders in the template text."""
    config = node_data.get("config", {})
    template = config.get("template", "")

    if not template:
        return {"output": str(input_data), "template": template}

    def replace_var(match):
        var_name = match.group(1).strip()
        # Support nested access like 'data.name'
        parts = var_name.split(".")
        value = input_data
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part, f"{{{{{var_name}}}}}")
            else:
                return f"{{{{{var_name}}}}}"
        return str(value)

    output = re.sub(r"\{\{(.+?)\}\}", replace_var, template)

    # Find detected variables
    variables = re.findall(r"\{\{(.+?)\}\}", template)

    return {
        "output": output,
        "template": template,
        "variables": [v.strip() for v in variables],
    }
