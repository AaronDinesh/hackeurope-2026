import json
import httpx

from backend.app.config import GEMINI_API_KEY, GEMINI_MODEL


def _extract_text(resp_json: dict) -> str:
    # Typical shape: candidates[0].content.parts[*].text
    candidates = resp_json.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini response has no candidates")

    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    if not parts:
        raise ValueError("Gemini response has no content parts")

    text = "".join([p.get("text", "") for p in parts if p.get("text")])
    if not text:
        raise ValueError("Gemini response text is empty")

    return text

def _extract_json_object(raw_text: str) -> dict:
    # Handle plain JSON and markdown code fences.
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    return json.loads(text)


async def gemini_generate_text_bundle(prompt: str) -> dict:
    """
    Returns a dict with:
      - negatives: list[str]
      - palette: {primary, secondary, accent, background} each list[str] of hex codes
      - summary: {logline, style, keywords}
    """
    instruction = """
Return JSON only (no markdown). Schema:
{
  "negatives": [string, ...],
  "palette": {
    "primary": [hex, ...],
    "secondary": [hex, ...],
    "accent": [hex, ...],
    "background": [hex, ...]
  },
  "summary": {
    "logline": string,
    "style": string,
    "keywords": [string, ...]
  }
}

Rules:
- Hex codes must look like "#RRGGBB".
- negatives must be ONLY negative constraints for image generation (no positives).
- Keep negatives between 8 and 20 items.
- keywords between 5 and 12 items.
""".strip()

    base_payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{instruction}\n\nPROMPT:\n{prompt}"}],
            }
        ]
    }
    # Some models/endpoints differ on this field name support.
    payload_variants = [
        {**base_payload, "generationConfig": {"responseMimeType": "application/json"}},
        {**base_payload, "generationConfig": {"response_mime_type": "application/json"}},
        base_payload,
    ]

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,  # :contentReference[oaicite:2]{index=2}
    }

    errors: list[str] = []
    resp_json = None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=30.0) as client:
        for payload in payload_variants:
            r = await client.post(url, headers=headers, json=payload)
            if r.is_error:
                errors.append(f"model={GEMINI_MODEL} status={r.status_code}: {r.text[:400]}")
                continue
            resp_json = r.json()
            break

    if resp_json is None:
        raise ValueError(
            f"Gemini text API failed for model='{GEMINI_MODEL}' after 3 payload variants. "
            f"Last errors: {' | '.join(errors[-3:])}"
        )

    raw_text = _extract_text(resp_json)

    # raw_text should be JSON because of response mime config, but keep a robust parser.
    try:
        data = _extract_json_object(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini did not return valid JSON. Got: {raw_text[:200]}") from e

    return data
