import base64
import binascii
import mimetypes
from pathlib import Path
import uuid
import httpx

from backend.app.config import GEMINI_API_KEY, GEMINI_IMAGE_MODEL

GENERATED_DIR = Path(__file__).resolve().parents[2] / "static" / "generated"
STATIC_DIR = Path(__file__).resolve().parents[2] / "static"


def build_moodboard_prompt(user_prompt: str) -> str:
    return f"Create a moodboard from user prompt. Prompt : {user_prompt}"


def build_storyboard_prompt(user_prompt: str) -> str:
    return (
        "Create a board with different frames like they are cut scenes of a short video "
        f"from user prompt. Prompt : {user_prompt}"
    )


def _extract_image_data_url(resp_json: dict) -> str:
    """
    Extracts the first image returned by Gemini as a data URL:
    data:<mime>;base64,<data>
    """
    candidates = resp_json.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini image response has no candidates")

    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise ValueError("Gemini image response has no content parts")

    for p in parts:
        # Gemini REST responses use camelCase keys (inlineData/mimeType).
        # Keep snake_case fallback for compatibility with SDK-style payloads.
        inline = p.get("inlineData") or p.get("inline_data")
        mime = None
        b64 = None
        if inline:
            b64 = inline.get("data")
            mime = inline.get("mimeType") or inline.get("mime_type")
        if b64 and mime:
            return f"data:{mime};base64,{b64}"

    raise ValueError("Gemini image response contained no inlineData image")

def _ext_for_mime(mime: str) -> str:
    mapping = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
    }
    return mapping.get(mime.lower(), "bin")

def decode_and_store_data_url(data_url: str, out_dir: Path, prefix: str = "img") -> str:
    """
    Decodes a data URL (data:<mime>;base64,<data>) to a file and returns its name.
    """
    if not data_url.startswith("data:") or ";base64," not in data_url:
        raise ValueError("Expected base64 data URL (data:<mime>;base64,<data>)")

    header, b64_data = data_url.split(",", 1)
    mime = header[5:].split(";", 1)[0]
    ext = _ext_for_mime(mime)

    try:
        raw = base64.b64decode(b64_data, validate=True)
    except (binascii.Error, ValueError) as e:
        raise ValueError("Invalid base64 image data from Gemini") from e

    out_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}-{uuid.uuid4().hex}.{ext}"
    (out_dir / filename).write_bytes(raw)
    return filename


async def generate_image(prompt: str) -> str:
    """
    Calls Gemini image model and returns a data URL for the generated image.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        # Force image output so we reliably get image parts.
        "generationConfig": {
            "responseModalities": ["Image"]
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.is_error:
            # Bubble up provider details (including 4xx payload) for easier debugging.
            body = r.text[:1000]
            raise ValueError(
                f"Gemini image API error {r.status_code} for model '{GEMINI_IMAGE_MODEL}': {body}"
            )
        resp_json = r.json()

    return _extract_image_data_url(resp_json)


async def generate_and_store_image(prompt: str, prefix: str, description: str) -> dict:
    data_url = await generate_image(prompt)
    filename = decode_and_store_data_url(
        data_url=data_url,
        out_dir=GENERATED_DIR,
        prefix=prefix,
    )
    return {
        "image_url": f"/static/generated/{filename}",
        "description": description,
    }


def static_image_url_to_reference(image_url: str, reference_type: str = "asset") -> dict:
    """
    Converts a local static URL (e.g. /static/generated/x.png) to a Veo
    referenceImages item using inlineData.
    """
    if not image_url.startswith("/static/"):
        raise ValueError(f"Unsupported static image URL: {image_url}")

    rel = image_url[len("/static/") :]
    image_path = (STATIC_DIR / rel).resolve()
    static_root = STATIC_DIR.resolve()
    if static_root not in image_path.parents and image_path != static_root:
        raise ValueError(f"Image path escapes static dir: {image_url}")
    if not image_path.exists():
        raise ValueError(f"Image file not found for URL: {image_url}")

    mime, _ = mimetypes.guess_type(str(image_path))
    if not mime:
        mime = "image/png"
    data = base64.b64encode(image_path.read_bytes()).decode("ascii")

    return {
        "image": {
            "inlineData": {
                "mimeType": mime,
                "data": data,
            }
        },
        "referenceType": reference_type,
    }


def static_image_url_to_veo_reference(image_url: str, reference_type: str = "asset") -> dict:
    """
    Converts a local static URL to Veo predictLongRunning instances[].referenceImages shape:
    {
      image: { bytesBase64Encoded: <base64>, mimeType: <mime> },
      referenceType: "ASSET" | "STYLE"
    }
    """
    if not image_url.startswith("/static/"):
        raise ValueError(f"Unsupported static image URL: {image_url}")

    rel = image_url[len("/static/") :]
    image_path = (STATIC_DIR / rel).resolve()
    static_root = STATIC_DIR.resolve()
    if static_root not in image_path.parents and image_path != static_root:
        raise ValueError(f"Image path escapes static dir: {image_url}")
    if not image_path.exists():
        raise ValueError(f"Image file not found for URL: {image_url}")

    mime, _ = mimetypes.guess_type(str(image_path))
    if not mime:
        mime = "image/png"
    data = base64.b64encode(image_path.read_bytes()).decode("ascii")

    ref_type = reference_type.upper()
    if ref_type not in {"ASSET", "STYLE"}:
        ref_type = "ASSET"

    return {
        "image": {
            "bytesBase64Encoded": data,
            "mimeType": mime,
        },
        "referenceType": ref_type,
    }
