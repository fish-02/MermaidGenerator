import type { GraphModel } from '../types/graph'

const STORAGE_KEY = 'mermaidgenerator:model'
const SAVE_DEBOUNCE_MS = 500

function isGraphModel(value: unknown): value is GraphModel {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GraphModel>
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges) && Array.isArray(candidate.subgraphs)
}

export function loadPersistedModel(): GraphModel | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isGraphModel(parsed) ? parsed : null
  } catch {
    return null
  }
}

let saveTimer: number | undefined

export function schedulePersist(model: GraphModel): void {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded); silently skip.
    }
  }, SAVE_DEBOUNCE_MS)
}

export function clearPersistedModel(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
