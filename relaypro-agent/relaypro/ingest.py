import logging
import uuid
from concurrent.futures import ThreadPoolExecutor

import httpx

logger = logging.getLogger("relaypro.ingest")

INGEST_URL = "http://localhost:3000/api/ingest"

# Single worker on purpose: interim transcripts supersede each other, so a
# reordered pair would leave a stale caption on screen. One worker makes posts
# go out in submission order.
_executor = ThreadPoolExecutor(max_workers=1)


def _with_utterance_defaults(payload: dict) -> dict:
    """Guarantee every utterance event carries utterance_id and is_final."""
    if payload.get("type") != "utterance":
        return payload
    payload.setdefault("utterance_id", f"utt-{uuid.uuid4().hex[:12]}")
    payload.setdefault("is_final", True)
    return payload


def _post_event_sync(payload: dict) -> None:
    try:
        httpx.post(INGEST_URL, json=payload, timeout=0.5)
    except Exception as e:
        logger.warning("ingest post failed: %s", e)


def post_event(payload: dict) -> None:
    _executor.submit(_post_event_sync, _with_utterance_defaults(payload))
