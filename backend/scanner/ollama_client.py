import httpx
from typing import Optional, List, Tuple
from .models import Issue

OLLAMA_BASE_URL = "http://localhost:11434"

async def check_ollama_status() -> Tuple[bool, Optional[str], List[str]]:
    """Checks if Ollama is running and returns (is_online, default_model, list_of_models)"""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                # Pick preferred coding model if available
                preferred = None
                for candidate in ["qwen2.5-coder:7b", "codellama", "deepseek-coder", "qwen2.5-coder"]:
                    for m in models:
                        if candidate in m:
                            preferred = m
                            break
                    if preferred:
                        break
                if not preferred and models:
                    preferred = models[0]
                return True, preferred, models
    except Exception:
        pass
    return False, None, []

async def enhance_issue_with_ai(issue: Issue, full_context: str, model_name: str) -> Issue:
    """Uses local Ollama to generate an improved explanation and suggested fix."""
    prompt = f"""You are CODEGUARD AI, an expert code security and quality assistant.
Analyze this code issue:
File: {issue.filePath}
Line: {issue.lineNumber}
Problem: {issue.title} ({issue.category}, Severity: {issue.severity})
Code snippet:
{issue.snippet}

Context around snippet:
{full_context[:400]}

Provide your output in exactly this format:
EXPLANATION: <1-2 sentences plain-English explanation of why this is dangerous or buggy>
FIX:
<only the corrected code snippet>
"""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "num_predict": 180
                    }
                }
            )
            if resp.status_code == 200:
                result_text = resp.json().get("response", "")
                if "EXPLANATION:" in result_text and "FIX:" in result_text:
                    parts = result_text.split("FIX:")
                    exp_part = parts[0].replace("EXPLANATION:", "").strip()
                    fix_part = parts[1].strip()
                    # Strip any markdown code fences in fix
                    fix_clean = fix_part.replace("```python", "").replace("```javascript", "").replace("```typescript", "").replace("```", "").strip()
                    if exp_part:
                        issue.explanation = exp_part
                    if fix_clean:
                        issue.suggestedFix = fix_clean
                    issue.aiEnhanced = True
    except Exception:
        # Gracefully keep the rule-based explanation and fix
        pass
    return issue

