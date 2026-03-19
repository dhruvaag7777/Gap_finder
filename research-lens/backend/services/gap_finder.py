"""
Research gap identification and ranking service.
"""
import json
import re
from groq import Groq

GROQ_MODEL = "llama-3.3-70b-versatile"

# Weights for overall_score: novelty 40%, feasibility 30%, impact 30%
WEIGHTS = {"novelty": 0.4, "feasibility": 0.3, "impact": 0.3}


def find_gaps(
    topic: str,
    landscape: dict,
    saturated_areas: list[dict],
) -> list[dict]:
    """
    Identify 5 genuine research gaps and score them.
    Returns list of gaps with novelty_score, feasibility_score, impact_score, overall_score.
    """
    saturated_str = json.dumps(saturated_areas, indent=2)
    summary = landscape.get("summary", "")

    groq_client = Groq()
    prompt = f"""You are a research gap analyst. The topic is "{topic}".

Current research summary: {summary}

The following areas are already heavily studied:
{saturated_str}

Identify exactly 5 genuine research gaps — areas that are underexplored, contradictory findings that need resolution, or emerging angles nobody has addressed yet.

For each gap provide:
- title: short descriptive title
- description: 2-3 sentences explaining the gap
- reasoning: why this is a genuine gap
- novelty_score: 0-100 (how unexplored)
- feasibility_score: 0-100 (how realistic to study)
- impact_score: 0-100 (how important if solved)

Return ONLY a valid JSON array, no markdown, no extra text:
[{{"title": "...", "description": "...", "reasoning": "...", "novelty_score": 85, "feasibility_score": 72, "impact_score": 90}}, ...]"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
    )
    text = response.choices[0].message.content.strip()
    text = _extract_json_array(text)
    gaps = json.loads(text)

    for g in gaps:
        n = float(g.get("novelty_score", 50))
        f = float(g.get("feasibility_score", 50))
        i = float(g.get("impact_score", 50))
        g["overall_score"] = round(
            n * WEIGHTS["novelty"] + f * WEIGHTS["feasibility"] + i * WEIGHTS["impact"],
            1,
        )

    # Sort by overall_score descending
    gaps.sort(key=lambda x: x["overall_score"], reverse=True)
    return gaps


def _extract_json_array(text: str) -> str:
    """Extract JSON array from markdown or raw text."""
    text = text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            return match.group(1).strip()
    start = text.find("[")
    if start >= 0:
        depth = 0
        for i, c in enumerate(text[start:], start):
            if c in "[{":
                depth += 1
            elif c in "]}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return text
