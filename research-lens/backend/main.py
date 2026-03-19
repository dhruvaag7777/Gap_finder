"""
ResearchLens - AI Research Gap Discovery System
FastAPI backend with SSE streaming.
"""
import json
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from database import get_connection, init_db, dict_factory
from services import search_research, map_landscape, find_gaps, generate_proposal


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="ResearchLens API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---


class CreateUserRequest(BaseModel):
    name: str


class AnalyzeRequest(BaseModel):
    user_id: str
    topic: str


class GenerateProposalRequest(BaseModel):
    analysis_id: str
    gap_id: int


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# --- Routes ---


@app.post("/user/create")
def create_user(req: CreateUserRequest):
    user_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO users (user_id, name) VALUES (?, ?)",
        (user_id, req.name.strip()),
    )
    conn.commit()
    conn.close()
    return {"user_id": user_id, "name": req.name.strip()}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    analysis_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO analyses (analysis_id, user_id, topic, status) VALUES (?, ?, ?, 'processing')",
        (analysis_id, req.user_id, req.topic.strip()),
    )
    conn.commit()
    conn.close()

    def generate():
        try:
            # Step 1: Landscape mapping
            yield sse_event({"step": 1, "label": "Mapping research landscape...", "data": None})
            search_results = search_research(req.topic.strip())
            sources = [{"title": r.get("title", ""), "url": r.get("url", "")} for r in search_results]

            # Step 2: Saturation detection
            yield sse_event({"step": 2, "label": "Detecting saturated areas...", "data": None})
            landscape = map_landscape(req.topic.strip(), search_results)
            saturated = landscape.get("saturated_areas", [])
            yield sse_event({
                "step": 2,
                "label": "Saturation detected.",
                "data": {"landscape": landscape, "sources": sources},
            })

            # Step 3: Gap identification
            yield sse_event({"step": 3, "label": "Identifying research gaps...", "data": {"saturated": saturated}})
            gaps = find_gaps(req.topic.strip(), landscape, saturated)
            yield sse_event({"step": 3, "label": "Gaps identified.", "data": {"gaps": gaps}})

            # Step 4: Gap ranking (already done in find_gaps)
            yield sse_event({"step": 4, "label": "Ranking gaps by impact...", "data": {"ranked_gaps": gaps}})

            # Step 5: Proposal generation for top gap
            top_gap = gaps[0] if gaps else {}
            proposal_data = None
            if top_gap:
                yield sse_event({"step": 5, "label": "Generating research proposal...", "data": None})
                proposal = generate_proposal(req.topic.strip(), top_gap)
                proposal_data = {"proposal": proposal, "gap": top_gap}
                yield sse_event({
                    "step": 5,
                    "label": "Proposal generated.",
                    "data": {"ranked_gaps": gaps, "proposal": proposal},
                })

            # Persist to DB
            conn = get_connection()
            conn.execute(
                "UPDATE analyses SET status = ? WHERE analysis_id = ?",
                ("complete", analysis_id),
            )
            conn.execute(
                "INSERT INTO landscape (analysis_id, summary, saturated_areas, sources) VALUES (?, ?, ?, ?)",
                (
                    analysis_id,
                    landscape.get("summary", ""),
                    json.dumps(saturated),
                    json.dumps(sources),
                ),
            )
            for g in gaps:
                conn.execute(
                    """INSERT INTO gaps (analysis_id, title, description, reasoning,
                       novelty_score, feasibility_score, impact_score, overall_score)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        analysis_id,
                        g.get("title", ""),
                        g.get("description", ""),
                        g.get("reasoning", ""),
                        g.get("novelty_score"),
                        g.get("feasibility_score"),
                        g.get("impact_score"),
                        g.get("overall_score"),
                    ),
                )
            cursor = conn.execute("SELECT last_insert_rowid()")
            first_gap_id = cursor.fetchone()[0] - len(gaps) + 1
            if proposal_data:
                conn.execute(
                    """INSERT INTO proposals (analysis_id, gap_id, title, abstract, objectives,
                       methodology, expected_outcomes, limitations)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        analysis_id,
                        first_gap_id,
                        proposal_data["proposal"].get("title", ""),
                        proposal_data["proposal"].get("abstract", ""),
                        json.dumps(proposal_data["proposal"].get("objectives", [])),
                        proposal_data["proposal"].get("methodology", ""),
                        proposal_data["proposal"].get("expected_outcomes", ""),
                        proposal_data["proposal"].get("limitations", ""),
                    ),
                )
            conn.commit()
            conn.close()

            yield sse_event({"step": "complete", "label": "Analysis complete", "data": {"analysis_id": analysis_id}})
        except Exception as e:
            conn = get_connection()
            conn.execute("UPDATE analyses SET status = ? WHERE analysis_id = ?", ("failed", analysis_id))
            conn.commit()
            conn.close()
            yield sse_event({
                "step": "error",
                "label": str(e),
                "data": {"analysis_id": analysis_id, "error": str(e)},
            })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@app.post("/proposal/generate")
def proposal_generate(req: GenerateProposalRequest):
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.execute(
        "SELECT * FROM gaps WHERE analysis_id = ? AND id = ?",
        (req.analysis_id, req.gap_id),
    )
    gap_row = cursor.fetchone()
    if not gap_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Gap not found")

    gap = {
        "id": gap_row["id"],
        "title": gap_row["title"],
        "description": gap_row["description"],
    }

    cursor = conn.execute(
        "SELECT topic FROM analyses WHERE analysis_id = ?",
        (req.analysis_id,),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
    topic = row["topic"]

    proposal = generate_proposal(topic, gap)

    conn.execute(
        """INSERT INTO proposals (analysis_id, gap_id, title, abstract, objectives,
           methodology, expected_outcomes, limitations)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            req.analysis_id,
            req.gap_id,
            proposal.get("title", ""),
            proposal.get("abstract", ""),
            json.dumps(proposal.get("objectives", [])),
            proposal.get("methodology", ""),
            proposal.get("expected_outcomes", ""),
            proposal.get("limitations", ""),
        ),
    )
    conn.commit()
    cursor = conn.execute("SELECT last_insert_rowid() as id")
    new_id = cursor.fetchone()["id"]
    conn.close()

    return {
        "id": new_id,
        "analysis_id": req.analysis_id,
        "gap_id": req.gap_id,
        **proposal,
    }


@app.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: str):
    conn = get_connection()
    conn.row_factory = dict_factory

    cursor = conn.execute(
        "SELECT * FROM analyses WHERE analysis_id = ?",
        (analysis_id,),
    )
    analysis = cursor.fetchone()
    if not analysis:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")

    cursor = conn.execute(
        "SELECT * FROM landscape WHERE analysis_id = ? ORDER BY id DESC LIMIT 1",
        (analysis_id,),
    )
    landscape_row = cursor.fetchone()
    landscape = None
    if landscape_row:
        landscape = {
            "summary": landscape_row["summary"],
            "saturated_areas": json.loads(landscape_row["saturated_areas"] or "[]"),
            "sources": json.loads(landscape_row["sources"] or "[]"),
        }

    cursor = conn.execute(
        "SELECT * FROM gaps WHERE analysis_id = ? ORDER BY overall_score DESC",
        (analysis_id,),
    )
    gaps = [dict(r) for r in cursor.fetchall()]

    cursor = conn.execute(
        "SELECT * FROM proposals WHERE analysis_id = ? ORDER BY id DESC",
        (analysis_id,),
    )
    proposal_rows = cursor.fetchall()
    proposals = []
    for r in proposal_rows:
        p = dict(r)
        p["objectives"] = json.loads(p.get("objectives") or "[]")
        proposals.append(p)

    conn.close()

    return {
        "analysis_id": analysis_id,
        "topic": analysis["topic"],
        "status": analysis["status"],
        "created_at": analysis["created_at"],
        "landscape": landscape,
        "gaps": gaps,
        "proposals": proposals,
    }


@app.get("/history/{user_id}")
def get_history(user_id: str):
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.execute(
        "SELECT analysis_id, topic, status, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/analysis/{analysis_id}/gaps")
def get_gaps(analysis_id: str):
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.execute(
        "SELECT * FROM gaps WHERE analysis_id = ? ORDER BY overall_score DESC",
        (analysis_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/")
def root():
    return {"name": "ResearchLens", "status": "ok"}
