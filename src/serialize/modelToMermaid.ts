import type { GraphEdge, GraphModel, GraphNode, NodeShape } from '../types/graph'

const SHAPE_DELIMITERS: Record<NodeShape, [string, string]> = {
  rectangle: ['[', ']'],
  rounded: ['(', ')'],
  circle: ['((', '))'],
  diamond: ['{', '}'],
  stadium: ['([', '])'],
  cylinder: ['[(', ')]'],
}

function escapeLabel(text: string): string {
  return text.replace(/"/g, '#quot;')
}

function renderNode(node: GraphNode): string {
  const [open, close] = SHAPE_DELIMITERS[node.shape]
  return `${node.id}${open}"${escapeLabel(node.label)}"${close}`
}

function renderEdge(edge: GraphEdge): string {
  if (edge.label) {
    const arrow = edge.style === 'dashed' ? `-. ${escapeLabel(edge.label)} .->` : `-- ${escapeLabel(edge.label)} -->`
    return `    ${edge.source} ${arrow} ${edge.target}`
  }
  const arrow = edge.style === 'dashed' ? '-.->' : '-->'
  return `    ${edge.source} ${arrow} ${edge.target}`
}

export function graphModelToMermaid(model: GraphModel): string {
  const lines: string[] = [`flowchart ${model.direction}`]

  const nodesBySubgraph = new Map<string | undefined, GraphNode[]>()
  for (const node of model.nodes) {
    const key = node.subgraphId
    const bucket = nodesBySubgraph.get(key)
    if (bucket) {
      bucket.push(node)
    } else {
      nodesBySubgraph.set(key, [node])
    }
  }

  for (const node of nodesBySubgraph.get(undefined) ?? []) {
    lines.push(`    ${renderNode(node)}`)
  }

  for (const subgraph of model.subgraphs) {
    lines.push(`    subgraph ${subgraph.id}["${escapeLabel(subgraph.label)}"]`)
    for (const node of nodesBySubgraph.get(subgraph.id) ?? []) {
      lines.push(`        ${renderNode(node)}`)
    }
    lines.push('    end')
  }

  for (const edge of model.edges) {
    lines.push(renderEdge(edge))
  }

  for (const node of model.nodes) {
    if (node.color) {
      lines.push(`    style ${node.id} fill:${node.color}`)
    }
  }

  return lines.join('\n')
}
