import asyncio
import json
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.gemini import gemini_generate_text_bundle
from backend.app.services.nanobanana import (
    build_moodboard_prompt,
    build_storyboard_prompt,
    generate_and_store_image,
    static_image_url_to_veo_reference,
)
from backend.app.services.veo import (
    veo_get_operation,
    veo_start_generation,
    download_and_store_veo_video,
)

router = APIRouter()


class PromptIn(BaseModel):
    prompt: str
    wait: bool = False
    poll_interval_sec: int = 10
    max_wait_sec: int = 180


def _collect_candidate_urls(node: Any, out: list[str]) -> None:
    if isinstance(node, dict):
        for k, v in node.items():
            key = str(k).lower()
            if isinstance(v, str) and key in {"uri", "videouri", "downloaduri"} and v.startswith("http"):
                out.append(v)
            _collect_candidate_urls(v, out)
    elif isinstance(node, list):
        for item in node:
            _collect_candidate_urls(item, out)


def _extract_video_url(operation: dict) -> str | None:
    candidates: list[str] = []
    _collect_candidate_urls(operation, candidates)
    if not candidates:
        return None
    for url in candidates:
        lower = url.lower()
        if ".mp4" in lower or ":download" in lower or "/download/" in lower:
            return url
    return candidates[0]


def _build_veo_prompt(
    user_prompt: str,
    negatives: str,
    hexcodes: dict,
    summary: dict,
    moodboard: dict,
    storyboard: dict,
) -> str:
    palette_json = json.dumps(hexcodes, indent=2)
    summary_json = json.dumps(summary, indent=2)
    return (
        "Create a high-quality cinematic video based on the following production package.\n\n"
        f"USER PROMPT:\n{user_prompt}\n\n"
        f"NEGATIVE CONSTRAINTS:\n{negatives}\n\n"
        f"COLOR PALETTE (HEX JSON):\n{palette_json}\n\n"
        f"CREATIVE SUMMARY (JSON):\n{summary_json}\n\n"
        f"MOODBOARD REFERENCE IMAGE URL:\n{moodboard['image_url']}\n\n"
        f"STORYBOARD REFERENCE IMAGE URL:\n{storyboard['image_url']}\n\n"
        "Respect the style, pacing, camera language, and tone implied by the references. "
        "Output a cinematic, coherent, physically plausible shot sequence with stable identity and lighting."
    )


@router.post("/v1/veo")
async def veo_input(payload: PromptIn):
    try:
        bundle = await gemini_generate_text_bundle(payload.prompt)
        negatives_list = bundle.get("negatives")
        hexcodes = bundle.get("palette")
        summary = bundle.get("summary")

        if not isinstance(negatives_list, list) or not negatives_list:
            raise ValueError("Gemini bundle missing negatives")
        if not isinstance(hexcodes, dict):
            raise ValueError("Gemini bundle missing palette")
        if not isinstance(summary, dict):
            raise ValueError("Gemini bundle missing summary")

        negatives = ", ".join(negatives_list)

        moodboard_task = generate_and_store_image(
            build_moodboard_prompt(payload.prompt),
            prefix="moodboard",
            description="Moodboard image",
        )
        storyboard_task = generate_and_store_image(
            build_storyboard_prompt(payload.prompt),
            prefix="storyboard",
            description="Storyboard image",
        )
        moodboard, storyboard = await asyncio.gather(moodboard_task, storyboard_task)

        veo_prompt = _build_veo_prompt(
            user_prompt=payload.prompt,
            negatives=negatives,
            hexcodes=hexcodes,
            summary=summary,
            moodboard=moodboard,
            storyboard=storyboard,
        )

        reference_images = [
            static_image_url_to_veo_reference(moodboard["image_url"], reference_type="asset"),
            static_image_url_to_veo_reference(storyboard["image_url"], reference_type="style"),
        ]

        operation = await veo_start_generation(
            veo_prompt,
            reference_images=reference_images,
        )
        operation_name = operation.get("name")
        if not operation_name:
            raise ValueError("Veo did not return operation name")

        latest_operation = operation
        if payload.wait:
            waited = 0
            while waited < payload.max_wait_sec:
                latest_operation = await veo_get_operation(operation_name)
                if latest_operation.get("done"):
                    break
                await asyncio.sleep(payload.poll_interval_sec)
                waited += payload.poll_interval_sec

        remote_video_url = _extract_video_url(latest_operation)
        local_video_url = None
        local_video_error = None
        if remote_video_url and payload.wait and latest_operation.get("done"):
            try:
                local_video_url = await download_and_store_veo_video(remote_video_url, prefix="veo")
            except Exception as download_error:
                # Keep the remote URL as fallback even if local proxy download fails.
                local_video_url = None
                local_video_error = str(download_error)

        if payload.wait and latest_operation.get("done") and remote_video_url and not local_video_url:
            raise ValueError(
                f"Veo generated a video URL but backend failed to stage it locally: {local_video_error or 'unknown error'}"
            )

        return {
            "veo": {
                "prompt": veo_prompt,
                "operation": latest_operation,
                "video_url": remote_video_url,
                "local_video_url": local_video_url,
                "local_video_error": local_video_error,
                "inputs": {
                    "negatives": negatives,
                    "hexcodes": hexcodes,
                    "summary": summary,
                    "moodboard": moodboard,
                    "storyboard": storyboard,
                },
            }
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
