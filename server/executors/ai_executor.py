import os
from google import genai
from google.genai import types
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Default models per provider
DEFAULT_MODELS = {
    "OpenAI": "gpt-4o",
    "Gemini": "gemini-2.5-flash-lite",
    "Claude": "claude-3-sonnet",
    "Meta": "llama-3-70b",
    "Mistral": "mistral-large",
    "Groq": "llama-3.3-70b-versatile",
}


async def execute_ai(node_data: dict, input_data: dict) -> dict:
    """Execute an AI node using the appropriate provider (Gemini, OpenAI, etc.)."""
    
    config = node_data.get("config", {})
    provider = node_data.get("subType", "Gemini")
    system_prompt = config.get("systemPrompt", "You are a helpful assistant.")
    
    # Get model from config, or use provider-specific default
    model_name = config.get("model") or DEFAULT_MODELS.get(provider, "gpt-4o")
    
    temperature = float(config.get("temperature", 0.7))
    max_tokens = int(config.get("maxTokens", 4096))

    # Build the user message from input data
    # Check multiple possible input formats
    if isinstance(input_data, dict):
        user_message = input_data.get("text") or input_data.get("defaultValue") or input_data.get("output") or str(input_data)
    else:
        user_message = str(input_data)
    
    # If user_message is still a dict-like string, try to extract meaningful content
    if user_message.startswith("{") and "output" in user_message:
        user_message = "Hello"  # Fallback for empty input

    # Route to correct provider
    if provider == "OpenAI":
        return await _execute_openai(system_prompt, user_message, model_name, temperature, max_tokens, provider)
    elif provider == "Gemini":
        return await _execute_gemini(system_prompt, user_message, model_name, temperature, max_tokens, provider)
    else:
        # Default to Gemini for other providers (Claude, Meta, etc. - would need their APIs)
        return {"error": f"Provider '{provider}' not yet implemented. Please use OpenAI or Gemini.", "output": None}


async def _execute_gemini(system_prompt: str, user_message: str, model_name: str, temperature: float, max_tokens: int, provider: str) -> dict:
    """Execute using Google Gemini API."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not set in .env file", "output": None}

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model=model_name,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return {
            "output": response.text,
            "model": model_name,
            "provider": provider,
        }
    except Exception as e:
        return {"error": str(e), "output": None}


async def _execute_openai(system_prompt: str, user_message: str, model_name: str, temperature: float, max_tokens: int, provider: str) -> dict:
    """Execute using OpenAI API."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return {"error": "OPENAI_API_KEY not set in .env file", "output": None}

    try:
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        return {
            "output": response.choices[0].message.content,
            "model": model_name,
            "provider": provider,
        }
    except Exception as e:
        return {"error": str(e), "output": None}
