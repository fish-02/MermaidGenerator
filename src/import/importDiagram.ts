import type { GraphModel } from '../types/graph'
import { resolveMermaidSource } from './resolveMermaidSource'

export interface ImportResult {
  model: GraphModel
  documentName: string
  /** Set when the source isn't a flowchart — the original text is preserved verbatim (spec §11). */
  rawSource: string | null
  warnings: string[]
}

function isGraphModel(value: unknown): value is GraphModel {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GraphModel>
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges) && Array.isArray(candidate.subgraphs)
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

export async function importDiagramFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  const documentName = stripExtension(file.name)

  if (file.name.toLowerCase().endsWith('.json')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('JSON 檔案格式錯誤，無法解析')
    }
    if (!isGraphModel(parsed)) {
      throw new Error('JSON 檔案缺少 nodes / edges / subgraphs 欄位，不是有效的專案檔')
    }
    return { model: parsed, documentName, rawSource: null, warnings: [] }
  }

  const { model, rawSource, warnings } = resolveMermaidSource(text)
  return { model, documentName, rawSource, warnings }
}
