from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from services.file_processor import process_uploads
from services.incident_analyzer import analyze_incident

ROOT = Path(__file__).parent
app = FastAPI(title="IncidentIQ API", description="Evidence-driven incident reconstruction")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"message": "IncidentIQ API is running"}

@app.get("/health")
def health(): return {"status": "healthy"}

@app.post("/api/analyze")
async def analyze(files: list[UploadFile] = File(...)):
    if not files: raise HTTPException(400, "Upload at least one evidence file.")
    try:
        evidence = await process_uploads(files)
        return await analyze_incident(evidence)
    except ValueError as exc: raise HTTPException(400, str(exc)) from exc
    except Exception as exc: raise HTTPException(502, f"Analysis failed: {exc}") from exc

@app.post("/api/demo")
async def demo():
    from services.file_processor import process_paths
    evidence = process_paths(list((ROOT / "sample_data").glob("*")))
    return await analyze_incident(evidence)

@app.get("/api/sample")
async def sample():
    """Return the bundled sample reconstruction (same reliable path as demo mode)."""
    from services.file_processor import process_paths
    evidence = process_paths(list((ROOT / "sample_data").glob("*")))
    return await analyze_incident(evidence)
