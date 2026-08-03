import { parseMermaidToModel } from '../parse/mermaidToModel'
import { isFlowchartSource } from '../parse/detectDiagramType'
import { createEmptyGraphModel, type GraphModel } from '../types/graph'

export interface ResolvedSource {
  model: GraphModel
  /** Set when the text isn't a flowchart — original text is preserved verbatim (spec §11). */
  rawSource: string | null
  warnings: string[]
}

/** Parses arbitrary Mermaid text for the create/import/paste flows: flowchart syntax becomes a
 *  canvas model, anything else is kept as code-only raw source. */
export function resolveMermaidSource(text: string): ResolvedSource {
  if (!isFlowchartSource(text)) {
    return { model: createEmptyGraphModel(), rawSource: text, warnings: [] }
  }
  const { model, warnings } = parseMermaidToModel(text, createEmptyGraphModel())
  return {
    model,
    rawSource: null,
    warnings: warnings.map((warning) => `第 ${warning.line} 行：${warning.text}`),
  }
}
