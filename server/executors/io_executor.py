async def execute_io(node_data: dict, input_data: dict) -> dict:
    """Execute an IO node - handle input/output differently."""
    config = node_data.get("config", {})
    sub_type = node_data.get("subType", "")
    
    # Check if this is an input node
    is_input = "Input" in sub_type
    
    if is_input:
        # For input nodes, output the configured text/defaultValue
        text = config.get("text") or config.get("defaultValue") or ""
        return {
            "output": text,
            "text": text,
            "type": "input"
        }
    else:
        # For output nodes, format and pass through the input
        output_format = config.get("outputFormat", "Plain Text")
        
        # Extract the actual content from input_data
        if isinstance(input_data, dict):
            content = input_data.get("output") or input_data.get("text") or input_data
        else:
            content = input_data
        
        return {
            "output": content,
            "format": output_format,
            "type": "output"
        }
