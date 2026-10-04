from pathlib import Path
from io import BytesIO
import pandas as pd
from pypdf import PdfReader

ALLOWED = {".txt", ".log", ".csv", ".pdf"}
MAX_FILE_SIZE = 20 * 1024 * 1024

def _extract(name: str, raw: bytes) -> dict:
    suffix = Path(name).suffix.lower()
    if suffix not in ALLOWED: raise ValueError(f"Unsupported file type: {name}. Use TXT, LOG, CSV, or PDF.")
    if len(raw) > MAX_FILE_SIZE: raise ValueError(f"{name} exceeds the 20 MB per-file limit.")
    if not raw: raise ValueError(f"{name} is empty.")
    try:
        if suffix in {".txt", ".log"}: content = raw.decode("utf-8-sig", errors="replace")
        elif suffix == ".csv":
            try: content = pd.read_csv(BytesIO(raw)).to_string(index=False)
            except Exception as exc: raise ValueError(f"Could not read CSV {name}: {exc}") from exc
        else:
            try: content = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(raw)).pages)
            except Exception as exc: raise ValueError(f"Could not read PDF {name}: {exc}") from exc
    except UnicodeError: content = raw.decode("latin-1", errors="replace")
    if not content.strip(): raise ValueError(f"No readable text found in {name}.")
    return {"source": name, "type": suffix[1:], "content": content[:30000]}

async def process_uploads(files):
    evidence = []
    for file in files:
        evidence.append(_extract(file.filename or "upload", await file.read(MAX_FILE_SIZE + 1)))
    return evidence

def process_paths(paths):
    return [_extract(p.name, p.read_bytes()) for p in paths]
