import type { FlowDirection, GraphEdge, GraphModel, GraphNode, GraphSubgraph, NodeShape } from '../types/graph'

export interface ParseWarning {
  line: number
  text: string
}

export interface ParseResult {
  model: GraphModel
  warnings: ParseWarning[]
}

const ID = '[A-Za-z0-9_]+'

const SHAPE_PATTERNS: { shape: NodeShape; regex: RegExp }[] = [
  { shape: 'cylinder', regex: new RegExp(`^(${ID})\\[\\((?:"([^"]*)"|([^)]*))\\)\\]$`) },
  { shape: 'stadium', regex: new RegExp(`^(${ID})\\(\\[(?:"([^"]*)"|([^\\]]*))\\]\\)$`) },
  { shape: 'circle', regex: new RegExp(`^(${ID})\\(\\((?:"([^"]*)"|([^)]*))\\)\\)$`) },
  { shape: 'diamond', regex: new RegExp(`^(${ID})\\{(?:"([^"]*)"|([^}]*))\\}$`) },
  { shape: 'rectangle', regex: new RegExp(`^(${ID})\\[(?:"([^"]*)"|([^\\]]*))\\]$`) },
  { shape: 'rounded', regex: new RegExp(`^(${ID})\\((?:"([^"]*)"|([^)]*))\\)$`) },
]

const FLOWCHART_HEADER = /^(?:flowchart|graph)\s+(LR|TD|TB|RL|BT)$/i
const SUBGRAPH_START = new RegExp(`^subgraph\\s+(${ID})(?:\\[(?:"([^"]*)"|([^\\]]*))\\])?$`)
const SUBGRAPH_END = /^end$/
const STYLE_LINE = new RegExp(`^style\\s+(${ID})\\s+fill:\\s*(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)`)
const EDGE_PIPE_LABEL = new RegExp(`^(${ID})\\s*(-->|-\\.->)\\s*\\|(.+?)\\|\\s*(${ID})$`)
const EDGE_DASH_LABEL = new RegExp(`^(${ID})\\s*(--|-\\.)\\s+(.+?)\\s+(-->|\\.->)\\s*(${ID})$`)
const EDGE_PLAIN = new RegExp(`^(${ID})\\s*(-->|-\\.->)\\s*(${ID})$`)

function normalizeDirection(raw: string): FlowDirection | null {
  const upper = raw.toUpperCase()
  if (upper === 'TD' || upper === 'TB') return 'TD'
  if (upper === 'LR') return 'LR'
  return null
}

export function parseMermaidToModel(source: string, previousModel: GraphModel): ParseResult {
  const lines = source.split('\n')
  const warnings: ParseWarning[] = []

  const previousNodesById = new Map(previousModel.nodes.map((node) => [node.id, node]))
  const previousEdgesByPair = new Map<string, string[]>()
  for (const edge of previousModel.edges) {
    const key = `${edge.source}->${edge.target}`
    const list = previousEdgesByPair.get(key)
    if (list) list.push(edge.id)
    else previousEdgesByPair.set(key, [edge.id])
  }

  let direction: FlowDirection = previousModel.direction
  const nodes: GraphNode[] = []
  const nodesById = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const subgraphs: GraphSubgraph[] = []

  let subgraphDepth = 0
  let currentSubgraphId: string | undefined

  let cascadeIndex = 0
  const takeCascadePosition = () => {
    const index = cascadeIndex++
    return { x: 60 + (index % 4) * 170, y: 60 + Math.floor(index / 4) * 110 }
  }

  let edgeCounter = 0
  const takeEdgeId = (source: string, target: string) => {
    edgeCounter += 1
    const key = `${source}->${target}`
    const available = previousEdgesByPair.get(key)
    const reused = available?.shift()
    return reused ?? `edge_${source}_${target}_${edgeCounter}`
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    if (line === '' || line.startsWith('%%')) continue

    const headerMatch = line.match(FLOWCHART_HEADER)
    if (headerMatch) {
      const normalized = normalizeDirection(headerMatch[1])
      if (normalized) direction = normalized
      else warnings.push({ line: lineNumber, text: `不支援的排版方向「${headerMatch[1]}」，僅支援 LR / TD` })
      continue
    }

    if (SUBGRAPH_END.test(line)) {
      if (subgraphDepth > 0) {
        subgraphDepth -= 1
        if (subgraphDepth === 0) currentSubgraphId = undefined
      }
      continue
    }

    const subgraphMatch = line.match(SUBGRAPH_START)
    if (subgraphMatch) {
      subgraphDepth += 1
      if (subgraphDepth === 1) {
        const [, id, quotedLabel, bareLabel] = subgraphMatch
        currentSubgraphId = id
        subgraphs.push({ id, label: quotedLabel ?? bareLabel ?? id })
      } else {
        warnings.push({ line: lineNumber, text: '不支援巢狀 Subgraph，內容已併入外層群組' })
      }
      continue
    }

    const styleMatch = line.match(STYLE_LINE)
    if (styleMatch) {
      const [, nodeId, color] = styleMatch
      const node = nodesById.get(nodeId)
      if (node) node.color = color
      else warnings.push({ line: lineNumber, text: `style 指到不存在的節點「${nodeId}」` })
      continue
    }

    const pipeEdge = line.match(EDGE_PIPE_LABEL)
    if (pipeEdge) {
      const [, source, arrow, label, target] = pipeEdge
      edges.push({
        id: takeEdgeId(source, target),
        source,
        target,
        label: label.trim(),
        style: arrow.startsWith('-.') ? 'dashed' : 'solid',
      })
      continue
    }

    const dashLabelEdge = line.match(EDGE_DASH_LABEL)
    if (dashLabelEdge) {
      const [, source, openDash, label, , target] = dashLabelEdge
      edges.push({
        id: takeEdgeId(source, target),
        source,
        target,
        label: label.trim(),
        style: openDash === '-.' ? 'dashed' : 'solid',
      })
      continue
    }

    const plainEdge = line.match(EDGE_PLAIN)
    if (plainEdge) {
      const [, source, arrow, target] = plainEdge
      edges.push({
        id: takeEdgeId(source, target),
        source,
        target,
        style: arrow === '-.->' ? 'dashed' : 'solid',
      })
      continue
    }

    let matchedShape = false
    for (const { shape, regex } of SHAPE_PATTERNS) {
      const match = line.match(regex)
      if (!match) continue
      const [, id, quoted, bare] = match
      const label = quoted ?? bare ?? id
      const previous = previousNodesById.get(id)
      const node: GraphNode = {
        id,
        label,
        shape,
        position: previous?.position ?? takeCascadePosition(),
        subgraphId: currentSubgraphId,
        color: previous?.color,
      }
      nodes.push(node)
      nodesById.set(id, node)
      matchedShape = true
      break
    }
    if (matchedShape) continue

    warnings.push({ line: lineNumber, text: `不是目前支援的節點／連線寫法，已略過：${line}` })
  }

  return {
    model: { direction, nodes, edges, subgraphs },
    warnings,
  }
}
