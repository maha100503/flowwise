"""
AI Copilot - Generate workflows from natural language descriptions.
Uses Gemini or OpenAI to create workflow JSON from user prompts.
"""

import os
import json
import uuid
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

router = APIRouter(tags=["copilot"])


class CopilotRequest(BaseModel):
    prompt: str
    provider: str = "Gemini"  # "Gemini" or "OpenAI"
    image: Optional[str] = None  # Base64-encoded image data


class CopilotResponse(BaseModel):
    success: bool
    workflow: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None


WORKFLOW_GENERATION_PROMPT = """You are an expert AI workflow designer. Generate a workflow based on the user's description.
If the user provides an image, analyze it to understand the desired workflow structure, node types, and connections.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "node_1",
      "type": "default",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Node Label",
        "type": "<MUST be one of the node types listed below, e.g. data_cleaner, ml, data_prep, merge, etc.>",
        "subType": "Optional subtype if the node type has one",
        "config": { /* node-specific config */ }
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": null,
      "targetHandle": null
    }
  ]
}

CRITICAL: data.type MUST match one of the exact node type strings below. Do NOT use generic "data" type for specialized nodes.
For example: use "data_cleaner" (NOT "data") for cleaning operations, "data_prep" (NOT "data") for ML prep, "ml" (NOT "ai") for ML training, "merge" (NOT "data") for joins.

AVAILABLE NODE TYPES AND CONFIGS:

=== INPUT / OUTPUT ===
1. io - Input/Output
   subType: "Chat Input" → config: { "defaultValue": "" }
   subType: "Output" → config: { "outputFormat": "Plain Text|JSON|Markdown|Raw" }

=== AI & CODE ===
2. ai - AI Models (LLM)
   subType: "OpenAI"|"Gemini"|"Claude"|"Meta"|"Mistral"|"Groq"
   config: { "model": "gpt-4o|gemini-2.5-flash-lite|claude-4-opus|...", "systemPrompt": "", "temperature": 0.7, "maxTokens": "4096" }

3. code - Custom Code
   config: { "language": "Python|JavaScript|TypeScript", "code": "result = input_data" }

=== FLOW CONTROL ===
4. conditional - If/Else Branch (has "true"/"false" sourceHandles)
   config: { "condition": "data.score >= 0.8" }

5. logic - Flow Control
   subType: "Wait" → config: { "duration": "1000" }
   subType: "Loop" → config: { "maxIterations": "10" }
   subType: "Try/Catch" → config: { "errorCriteria": "" }

6. validator - Data Validator (has "valid"/"invalid" sourceHandles)
   config: { "validationType": "json_schema|type_check|required_fields|range_check|pattern_match|email|url|custom", "schema": "", "requiredFields": "", "pattern": "" }

=== DATA FILES ===
7. file_upload - File Upload (CSV, Excel, JSON, PDF, TXT)
   config: { "filename": "", "format": "csv|excel|json|text|pdf" }

8. file_export - File Export / Save
   config: { "filename": "output", "format": "csv|excel|json|joblib" }

=== DATA CLEANING ===
9. data_cleaner - Data Cleaning Operations
   config: { "operation": "DropNulls|ParseDates|CoerceTypes|NormalizeText|DropDuplicates|RenameColumns|FilterRows" }
   DropNulls: { "operation": "DropNulls", "columns": "col1,col2" }
   ParseDates: { "operation": "ParseDates", "columns": "date_col", "date_format": "%Y-%m-%d" }
   NormalizeText: { "operation": "NormalizeText", "columns": "text_col", "mode": "lowercase|uppercase|title|strip" }
   FilterRows: { "operation": "FilterRows", "filter_column": "col", "filter_op": "equals|not_equals|contains|greater_than|less_than|not_null", "filter_value": "" }

=== DATA PROCESSING ===
10. data - Data Map/Filter
    subType: "Filter" → config: { "filterCondition": "" }
    subType: "Map" → config: { "fields": [{"key":"","value":""}] }

11. merge - Merge/Join Two DataFrames
    config: { "how": "left|right|inner|outer", "left_on": "key_col", "right_on": "key_col" }

12. template - Text Template
    config: { "template": "Hello {{name}}" }

13. json_transform - JSON Transform
    config: { "operation": "query|flatten|unflatten|merge|diff|pick|omit|sort_keys|to_csv|from_csv", "expression": "", "keys": "" }

14. aggregator - Aggregate Collections
    config: { "operation": "count|sum|average|min|max|group_by|unique|sort|first_n|last_n|stats", "field": "" }

15. regex - Regex Operations
    config: { "operation": "match|match_all|replace|split|extract|test", "pattern": "", "flags": "gi", "replacement": "" }

=== ML DATA PREP ===
16. data_prep - ML Data Preparation
    subType: "TrainTestSplit" → config: { "operation": "TrainTestSplit", "test_size": 0.2 }
    subType: "Normalize" → config: { "operation": "Normalize" }
    subType: "Standardize" → config: { "operation": "Standardize" }
    subType: "Encode" → config: { "operation": "Encode" }
    subType: "FillMissing" → config: { "operation": "FillMissing", "strategy": "mean|median|zero|ffill" }
    subType: "FeatureSelect" → config: { "operation": "FeatureSelect", "k": 5 }

17. feature_engineer - Feature Engineering
    config: { "operation": "DateDiff|Ratio|Aggregate|BinNumeric|Interaction|Formula|AutoFeatures", "new_column": "" }
    Formula: { "operation": "Formula", "formula": "col_a * col_b", "new_column": "result" }

=== MACHINE LEARNING ===
18. ml - Train ML Models
    config: { "algorithm": "<algo>", "task": "classification|regression" }
    Algorithms: LinearRegression, LogisticRegression, DecisionTree, RandomForest, SVM, KNN, GradientBoosting, AdaBoost, XGBoost, LightGBM, Ridge, Lasso, ElasticNet, GaussianNB, SVR, PolynomialRegression
    Extra: { "n_estimators": 100, "learning_rate": 0.1, "n_neighbors": 5, "kernel": "rbf", "alpha": 1.0 }

19. neural_network - Neural Network (MLP)
    config: { "task": "classification|regression", "hidden_layers": "100,50,25", "activation": "relu|tanh|logistic", "solver": "adam|sgd|lbfgs", "learning_rate_init": 0.001, "max_iter": 500 }

20. evaluate - Model Evaluation
    config: { "metric": "Auto|Classification|Regression", "average": "weighted|macro|micro" }

21. predict - Run Predictions
    config: { "output_column": "prediction", "include_proba": true }

22. model_selector - Compare & Select Best Model
    config: { "metric": "accuracy|f1|r2|mse", "mode": "max|min" }

23. ensemble - Ensemble Methods
    config: { "algorithm": "Bagging|AdaBoost|GradientBoosting|Stacking|Voting", "task": "classification|regression", "n_estimators": 10 }

=== ADVANCED ML ===
24. clustering - Unsupervised Clustering
    config: { "algorithm": "KMeans|DBSCAN|HDBSCAN|Hierarchical|GMM|SpectralClustering|MeanShift|Birch", "n_clusters": 3 }

25. dimensionality - Dimensionality Reduction
    config: { "algorithm": "PCA|KernelPCA|LDA|tSNE|ICA|FactorAnalysis", "n_components": 2 }

26. anomaly - Anomaly Detection
    config: { "algorithm": "IsolationForest|OneClassSVM|LOF|EllipticEnvelope", "contamination": 0.1 }

27. timeseries - Time Series Analysis
    config: { "algorithm": "ARIMA|SARIMA|ExponentialSmoothing|MovingAverage|Decomposition", "forecast_steps": 5, "p": 1, "d": 1, "q": 1 }

=== TRIGGERS ===
28. timer - Timer/Trigger
    subType: "Manual" → config: { "triggerName": "Run" }
    subType: "Schedule" → config: { "schedule": "0 9 * * *", "timezone": "UTC" }

29. webhook - Webhook Trigger
    config: { "method": "GET|POST|PUT", "endpoint": "/api/webhook/incoming" }

=== HTTP & INTEGRATIONS ===
30. http - HTTP Request
    subType: "GET"|"POST"|"PUT"|"DELETE"|"PATCH"
    config: { "url": "https://api.example.com", "headers": {}, "body": {}, "timeout": 30 }

31. database - Database Query
    subType: "PostgreSQL"|"MySQL"|"SQLite"
    config: { "connectionString": "", "query": "SELECT * FROM users" }

=== MESSAGING ===
32. email - Send Email
    subType: "SMTP"|"SendGrid"|"Mailgun"
    config: { "to": "", "subject": "", "body": "", "from": "" }

33. slack - Slack
    config: { "channel": "", "message": "", "webhookUrl": "" }

34. teams - Microsoft Teams
    config: { "action": "send_channel|send_chat|read_channel", "teamId": "", "channelId": "", "message": "" }

35. outlook - Outlook Email
    config: { "action": "send|read_inbox|search|reply", "to": "", "subject": "", "body": "" }

36. whatsapp - WhatsApp
    config: { "action": "send_text|send_template|send_media", "toNumber": "", "message": "" }

37. telegram - Telegram
    config: { "action": "send_message|send_photo|send_document", "chatId": "", "message": "" }

38. instagram - Instagram
    config: { "action": "send_dm|post_comment|get_media|publish_post", "message": "" }

=== UTILITIES ===
39. cache - Key-Value Cache
    config: { "operation": "get|set|delete|clear|has|keys", "key": "", "value": "", "ttl": 0 }

40. crypto - Crypto/Encoding
    config: { "operation": "hash|hmac|base64_encode|base64_decode|url_encode|url_decode|jwt_decode|uuid", "algorithm": "sha256", "input": "" }

41. markdown - Markdown Processing
    config: { "operation": "to_html|to_plain|extract_headings|extract_links|extract_code|word_count", "content": "" }

42. rss - RSS Feed
    config: { "url": "", "maxItems": 10, "format": "full|titles|links|summary" }

43. qrcode - QR Code Generator
    config: { "qrType": "text|url|email|phone|wifi|vcard", "content": "", "size": 256 }

44. websocket - WebSocket
    config: { "action": "send|listen|broadcast", "url": "wss://...", "message": "" }

45. notification - Notification
    config: { "channel": "Email|Slack|Discord", "recipient": "", "message": "" }

LAYOUT RULES:
- Start triggers/inputs at x=100
- Space nodes 250px apart horizontally
- For parallel paths (e.g. two file uploads merging), offset y by 200px
- Center the workflow vertically around y=200
- For ML pipelines: File Upload → Data Cleaning → Data Prep → ML → Evaluate → Predict → Export

EDGE RULES:
- For conditional/validator nodes, use sourceHandle: "true"/"false" or "valid"/"invalid"
- Always connect nodes in logical execution order
- For merge nodes, connect two source nodes to the single merge node

USER REQUEST: """


@router.post("/api/copilot/generate", response_model=CopilotResponse)
async def generate_workflow(request: CopilotRequest):
    """Generate a workflow from natural language using AI."""
    
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    full_prompt = WORKFLOW_GENERATION_PROMPT + request.prompt

    try:
        if request.provider == "OpenAI":
            workflow_json = await _generate_with_openai(full_prompt, image_base64=request.image)
        else:
            workflow_json = await _generate_with_gemini(full_prompt, image_base64=request.image)

        # Parse and validate the JSON
        workflow = json.loads(workflow_json)

        # Add unique IDs if not present
        for i, node in enumerate(workflow.get("nodes", [])):
            if not node.get("id"):
                node["id"] = f"copilot_{uuid.uuid4().hex[:8]}"

        for i, edge in enumerate(workflow.get("edges", [])):
            if not edge.get("id"):
                edge["id"] = f"edge_{uuid.uuid4().hex[:8]}"

        return CopilotResponse(
            success=True,
            workflow=workflow,
            message=f"Generated workflow with {len(workflow.get('nodes', []))} nodes"
        )

    except json.JSONDecodeError as e:
        return CopilotResponse(
            success=False,
            error=f"Failed to parse generated workflow: {str(e)}"
        )
    except Exception as e:
        return CopilotResponse(
            success=False,
            error=str(e)
        )


async def _generate_with_gemini(prompt: str, image_base64: Optional[str] = None) -> str:
    """Generate workflow using Gemini API."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY not set in .env file")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite",
        system_instruction="You are a workflow generator. Return ONLY valid JSON, no markdown, no explanation."
    )

    content_parts = [prompt]
    if image_base64:
        # Strip data URI prefix if present
        img_data = image_base64
        mime_type = "image/png"
        if "," in img_data:
            header, img_data = img_data.split(",", 1)
            if "image/jpeg" in header:
                mime_type = "image/jpeg"
            elif "image/webp" in header:
                mime_type = "image/webp"
            elif "image/gif" in header:
                mime_type = "image/gif"
        content_parts.append({
            "mime_type": mime_type,
            "data": base64.b64decode(img_data),
        })

    response = model.generate_content(
        content_parts,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,
            max_output_tokens=4096,
        ),
    )

    # Extract JSON from response (handle potential markdown wrapping)
    text = response.text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])  # Remove first and last lines (```)
    
    return text


async def _generate_with_openai(prompt: str, image_base64: Optional[str] = None) -> str:
    """Generate workflow using OpenAI API."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        raise Exception("OPENAI_API_KEY not set in .env file")

    client = OpenAI(api_key=api_key)

    user_content = []
    user_content.append({"type": "text", "text": prompt})
    if image_base64:
        # Ensure proper data URI format
        image_url = image_base64 if image_base64.startswith("data:") else f"data:image/png;base64,{image_base64}"
        user_content.append({
            "type": "image_url",
            "image_url": {"url": image_url}
        })

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a workflow generator. Return ONLY valid JSON, no markdown, no explanation."},
            {"role": "user", "content": user_content}
        ],
        temperature=0.3,
        max_tokens=4096,
        response_format={"type": "json_object"}
    )

    return response.choices[0].message.content


@router.post("/api/copilot/suggest")
async def suggest_next_node(current_nodes: list[dict], provider: str = "Gemini"):
    """Suggest the next node based on current workflow context."""
    
    prompt = f"""Based on the current workflow nodes, suggest what node should come next.
    
Current nodes: {json.dumps(current_nodes, indent=2)}

Return a single node suggestion as JSON with structure:
{{
  "type": "node_type",
  "subType": "optional_subtype",
  "label": "Suggested Label",
  "reason": "Why this node makes sense"
}}"""

    try:
        if provider == "OpenAI":
            result = await _generate_with_openai(prompt)
        else:
            result = await _generate_with_gemini(prompt)
        
        return {"success": True, "suggestion": json.loads(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/api/copilot/fix")
async def fix_workflow(workflow: dict, error_message: str, provider: str = "Gemini"):
    """Fix a workflow based on an error message."""
    
    prompt = f"""The following workflow encountered an error. Fix it.

WORKFLOW:
{json.dumps(workflow, indent=2)}

ERROR:
{error_message}

Return the FIXED workflow as valid JSON with the same structure."""

    try:
        if provider == "OpenAI":
            result = await _generate_with_openai(prompt)
        else:
            result = await _generate_with_gemini(prompt)

        return {"success": True, "workflow": json.loads(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}
