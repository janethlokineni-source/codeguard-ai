import httpx
import asyncio
from typing import Optional, List, Tuple
from .models import Issue

OLLAMA_BASE_URL = "http://localhost:11434"
ollama_semaphore = asyncio.Semaphore(2)

async def check_ollama_status() -> Tuple[bool, Optional[str], List[str]]:
    """Checks if Ollama is running and returns (is_online, default_model, list_of_models)"""
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
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

def extract_code_chunk(content: str, line_num: int, window: int = 4) -> str:
    lines = content.splitlines()
    start = max(0, line_num - 1 - window)
    end = min(len(lines), line_num + window)
    return "\n".join(lines[start:end])

async def enhance_issue_with_ai(issue: Issue, full_content: str, model_name: str) -> Issue:
    """Uses local Ollama with concurrency limit (2), short context chunk, and keep_alive."""
    chunk = extract_code_chunk(full_content, issue.lineNumber)
    
    prompt = f"""You are CODEGUARD AI. Fix this code issue concisely:
File: {issue.filePath}:{issue.lineNumber}
Issue: {issue.title}
Code:
{issue.snippet}

Context:
{chunk}

Format:
EXPLANATION: <1 sentence why this is buggy or unsafe>
FIX:
<only the replacement line, no markdown>
"""
    try:
        async with ollama_semaphore:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "stream": False,
                        "keep_alive": "10m",
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 100
                        }
                    }
                )
                if resp.status_code == 200:
                    result_text = resp.json().get("response", "")
                    if "EXPLANATION:" in result_text and "FIX:" in result_text:
                        parts = result_text.split("FIX:")
                        exp_part = parts[0].replace("EXPLANATION:", "").strip()
                        fix_part = parts[1].strip()
                        # Clean markdown code blocks if any
                        fix_clean = fix_part.replace("```python", "").replace("```javascript", "").replace("```typescript", "").replace("```", "").strip()
                        if exp_part:
                            issue.explanation = exp_part
                        if fix_clean and len(fix_clean) < 300:
                            issue.suggestedFix = fix_clean
                        issue.aiEnhanced = True
    except Exception:
        pass
    return issue
