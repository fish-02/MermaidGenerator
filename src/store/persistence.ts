import type { GraphModel } from '../types/graph'

const STORAGE_KEY = 'mermaidgenerator:model'
const SAVE_DEBOUNCE_MS = 500

export const DEFAULT_DOCUMENT_NAME = '未命名流程圖'

export interface PersistedDocument {
  model: GraphModel
  documentName: string
  /** Raw Mermaid source for documents whose diagram type has no canvas representation (e.g. sequence diagrams). */
  rawSource: string | null
}

function isGraphModel(value: unknown): value is GraphModel {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GraphModel>
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges) && Array.isArray(candidate.subgraphs)
}

/** Loads the persisted document, transparently migrating older formats (bare GraphModel; pre-P4 {model, documentName}). */
export function loadPersistedDocument(): PersistedDocument | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isGraphModel(parsed)) return { model: parsed, documentName: DEFAULT_DOCUMENT_NAME, rawSource: null }
    if (parsed && typeof parsed === 'object' && 'model' in parsed) {
      const candidate = parsed as { model: unknown; documentName?: unknown; rawSource?: unknown }
      if (isGraphModel(candidate.model)) {
        return {
          model: candidate.model,
          documentName: typeof candidate.documentName === 'string' ? candidate.documentName : DEFAULT_DOCUMENT_NAME,
          rawSource: typeof candidate.rawSource === 'string' ? candidate.rawSource : null,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

let saveTimer: number | undefined

export function schedulePersist(
  document: PersistedDocument,
  onSettled?: (result: 'saved' | 'error') => void,
): void {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
      onSettled?.('saved')
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded).
      onSettled?.('error')
    }
  }, SAVE_DEBOUNCE_MS)
}

export function clearPersistedModel(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
