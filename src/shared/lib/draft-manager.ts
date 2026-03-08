const STORAGE_KEY = 'hchat-drafts'
const MAX_DRAFTS = 50

export interface Draft {
  sessionId: string
  content: string
  updatedAt: string
}

function loadDrafts(): Map<string, Draft> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const arr: Draft[] = JSON.parse(raw)
    return new Map(arr.map((d) => [d.sessionId, d]))
  } catch {
    return new Map()
  }
}

function saveDrafts(drafts: Map<string, Draft>): void {
  try {
    const arr = Array.from(drafts.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_DRAFTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    /* storage full or unavailable */
  }
}

export function saveDraft(sessionId: string, content: string): void {
  if (!content.trim()) {
    deleteDraft(sessionId)
    return
  }
  const drafts = loadDrafts()
  drafts.set(sessionId, {
    sessionId,
    content,
    updatedAt: new Date().toISOString(),
  })
  saveDrafts(drafts)
}

export function getDraft(sessionId: string): Draft | null {
  const drafts = loadDrafts()
  return drafts.get(sessionId) ?? null
}

export function deleteDraft(sessionId: string): void {
  const drafts = loadDrafts()
  drafts.delete(sessionId)
  saveDrafts(drafts)
}

export function getAllDrafts(): Draft[] {
  const drafts = loadDrafts()
  return Array.from(drafts.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* unavailable */
  }
}
