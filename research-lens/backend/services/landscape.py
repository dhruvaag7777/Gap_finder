"""
Landscape mapping service - summarizes research state and identifies saturated areas.
"""
import json
import re
from groq import Groq

GROQ_MODEL = "llama-3.3-70b-versatile"


def map_landscape(topic: str, search_results: list[dict]) -> dict:
    """
    Analyze search results and produce landscape summary + saturated areas.
    Returns: {summary, saturated_areas: [{name, saturation_level, description}]}
    """
    snippets = "\n\n".join(
        f"- [{r.get('title', '')}] {r.get('content', '')} ({r.get('published_date', '')})"
        for r in search_results
    )

    groq_client = Groq()
    prompt = f"""You are a research analyst. Based on these search results about "{topic}":

{snippets}

Provide:
1) A 3-4 sentence summary of the current state of research in this field
2) A JSON array of the 5-7 most heavily researched subtopics or angles — each with: name, saturation_level (0-100), description (one sentence)

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{"summary": "Your summary here.", "saturated_areas": [{{"name": "...", "saturation_level": 85, "description": "..."}}, ...]}}"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )
    text = response.choices[0].message.content.strip()
    text = _extract_json(text)
    return json.loads(text)


def _extract_json(text: str) -> str:
    """Extract JSON from markdown or raw text."""
    text = text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            return match.group(1).strip()
    # Try to find {...}
    start = text.find("{")
    if start >= 0:
        depth = 0
        for i, c in enumerate(text[start:], start):
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return text
