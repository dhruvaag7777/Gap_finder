"""
Research proposal generation service.
"""
import json
import re
from groq import Groq

GROQ_MODEL = "llama-3.3-70b-versatile"


def generate_proposal(topic: str, gap: dict) -> dict:
    """
    Generate a full research proposal for the given gap.
    Returns: {title, abstract, objectives, methodology, expected_outcomes, limitations}
    """
    gap_title = gap.get("title", "")
    gap_desc = gap.get("description", "")

    groq_client = Groq()
    prompt = f"""You are an academic research proposal writer. Write a full research proposal for this gap in "{topic}":

Gap: {gap_title}
Description: {gap_desc}

Return ONLY valid JSON with these exact keys (no markdown, no extra text):
{{
  "title": "string - full proposal title",
  "abstract": "string - ~150 words",
  "objectives": ["string", "string", "string", "string"],
  "methodology": "string - detailed paragraph",
  "expected_outcomes": "string",
  "limitations": "string"
}}"""

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
