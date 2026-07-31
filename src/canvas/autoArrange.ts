import dagre from '@dagrejs/dagre'
import type { FlowDirection } from '../types/graph'

export interface ArrangeNodeInput {
  id: string
  width: number
  height: number
  subgraphId?: string
}

export interface ArrangeEdgeInput {
  source: string
  target: string
}

const NODE_SEP = 60
const RANK_SEP = 90
const MARGIN = 40

/** Hierarchical auto-layout (via dagre): lays nodes out in layers following edge direction, clustering each subgraph's members together. */
export function computeHierarchicalLayout(
  nodes: ArrangeNodeInput[],
  edges: ArrangeEdgeInput[],
  subgraphIds: string[],
  direction: FlowDirection,
): Map<string, { x: number; y: number }> {
  const graph = new dagre.graphlib.Graph({ compound: true, multigraph: true })
  graph.setGraph({
    rankdir: direction === 'LR' ? 'LR' : 'TB',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: MARGIN,
    marginy: MARGIN,
  })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const subgraphId of subgraphIds) {
    graph.setNode(subgraphId, { width: 0, height: 0 })
  }

  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width, height: node.height })
    if (node.subgraphId) graph.setParent(node.id, node.subgraphId)
  }

  edges.forEach((edge, index) => {
    graph.setEdge(edge.source, edge.target, {}, `e${index}`)
  })

  dagre.layout(graph)

  const positions = new Map<string, { x: number; y: number }>()
  for (const node of nodes) {
    const laidOut = graph.node(node.id)
    positions.set(node.id, { x: laidOut.x - node.width / 2, y: laidOut.y - node.height / 2 })
  }
  return positions
}
