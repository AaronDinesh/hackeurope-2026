import httpx

from backend.app.config import VEO_API_KEY, VEO_BASE_URL, VEO_MODEL


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
