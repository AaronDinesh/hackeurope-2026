import os
from dotenv import load_dotenv

# Load backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3-pro-image-preview")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY. Put it in backend/.env")

NANO_API_KEY = os.getenv("NANO_API_KEY")
NANO_BASE_URL = os.getenv("NANO_BASE_URL", "https://api.nanobananas.ai")

if not NANO_API_KEY:
    raise RuntimeError("Missing NANO_API_KEY. Put it in backend/.env")
