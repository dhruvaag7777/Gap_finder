const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function createUser(name) {
  const res = await fetch(`${BASE}/user/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

export function startAnalysis(userId, topic) {
  return fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, topic: topic.trim() }),
  })
}

export async function generateProposal(analysisId, gapId) {
  const res = await fetch(`${BASE}/proposal/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId, gap_id: gapId }),
  })
  if (!res.ok) throw new Error('Failed to generate proposal')
  return res.json()
}

export async function getAnalysis(analysisId) {
  const res = await fetch(`${BASE}/analysis/${analysisId}`)
  if (!res.ok) throw new Error('Analysis not found')
  return res.json()
}

export async function getHistory(userId) {
  const res = await fetch(`${BASE}/history/${userId}`)
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export async function getGaps(analysisId) {
  const res = await fetch(`${BASE}/analysis/${analysisId}/gaps`)
  if (!res.ok) throw new Error('Failed to load gaps')
  return res.json()
}
