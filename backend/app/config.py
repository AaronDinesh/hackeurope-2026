import os
from dotenv import load_dotenv

# Load backend/.env
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"),
    override=True,
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3-pro-image-preview")
VEO_API_KEY = os.getenv("VEO_API_KEY", GEMINI_API_KEY)
VEO_MODEL = os.getenv("VEO_MODEL", "veo-3.1-generate-preview")
VEO_BASE_URL = os.getenv("VEO_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY. Put it in backend/.env")
