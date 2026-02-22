import httpx
from pathlib import Path
import uuid
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

from backend.app.config import VEO_API_KEY, VEO_BASE_URL, VEO_MODEL

GENERATED_DIR = Path(__file__).resolve().parents[2] / "static" / "generated"


def _normalize_download_url(video_url: str) -> str:
    """
    Convert Veo file URI into a direct media download URL when needed.
    """
    parsed = urlparse(video_url)
    path = parsed.path

    # If we got a files URI without :download suffix, convert it.
    if "/files/" in path and not path.endswith(":download"):
        path = f"{path}:download"

    query_items = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query_items.setdefault("alt", "media")
    query = urlencode(query_items)

    return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, query, parsed.fragment))


async def veo_start_generation(prompt: str, reference_images: list[dict] | None = None) -> dict:
    """
    Starts a long-running Veo generation operation.
    """
    predict_long_running_url = f"{VEO_BASE_URL}/models/{VEO_MODEL}:predictLongRunning"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": VEO_API_KEY,
    }
    if not reference_images:
        raise ValueError("Veo requires reference images for this endpoint, none provided")

    async with httpx.AsyncClient(timeout=60.0) as client:
        payload = {
            "instances": [
                {
                    "prompt": prompt,
                    "referenceImages": reference_images,
                }
            ]
        }
        r = await client.post(predict_long_running_url, headers=headers, json=payload)
        if r.is_error:
            raise ValueError(
                f"Veo image-conditioned start error {r.status_code} for model '{VEO_MODEL}': "
                f"{r.text[:1200]}"
            )
        return r.json()


async def veo_get_operation(operation_name: str) -> dict:
    """
    Reads a Veo long-running operation state.
    """
    url = f"{VEO_BASE_URL}/{operation_name}"
    headers = {
        "x-goog-api-key": VEO_API_KEY,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(url, headers=headers)
        if r.is_error:
            raise ValueError(
                f"Veo operation read error {r.status_code} for '{operation_name}': {r.text[:1000]}"
            )
        return r.json()


async def download_and_store_veo_video(video_url: str, prefix: str = "veo") -> str:
    """
    Downloads a Veo media URL with API key auth and stores it under /static/generated.
    Returns local static URL.
    """
    download_url = _normalize_download_url(video_url)

    async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
        # Some Veo URLs are pre-signed and should be downloaded without API key.
        r = await client.get(download_url, headers={"Accept": "video/*"})
        if r.is_error:
            # Fallback to API key authenticated download for endpoints that require it.
            r = await client.get(
                download_url,
                headers={
                    "x-goog-api-key": VEO_API_KEY,
                    "Accept": "video/*",
                },
            )
        if r.is_error:
            raise ValueError(f"Veo media download failed {r.status_code}: {r.text[:1000]}")

    content_type = (r.headers.get("content-type") or "").lower()
    if "video" not in content_type and "octet-stream" not in content_type:
        preview = r.text[:500] if isinstance(r.text, str) else "non-text response"
        raise ValueError(
            f"Veo media response is not video. content-type={content_type or 'unknown'} body={preview}"
        )

    if len(r.content) < 1024:
        raise ValueError("Veo media response is unexpectedly small and likely invalid")

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}-{uuid.uuid4().hex}.mp4"
    (GENERATED_DIR / filename).write_bytes(r.content)
    return f"/static/generated/{filename}"
