import type { GraphModel } from '../types/graph'
import { parseMermaidToModel } from '../parse/mermaidToModel'
import { createEmptyGraphModel } from '../types/graph'

export interface ImportResult {
  model: GraphModel
  warnings: string[]
}

function isGraphModel(value: unknown): value is GraphModel {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GraphModel>
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges) && Array.isArray(candidate.subgraphs)
}

export async function importDiagramFile(file: File): Promise<ImportResult> {
  const text = await file.text()

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
    return { model: parsed, warnings: [] }
  }

  const { model, warnings } = parseMermaidToModel(text, createEmptyGraphModel())
  return { model, warnings: warnings.map((warning) => `第 ${warning.line} 行：${warning.text}`) }
}
