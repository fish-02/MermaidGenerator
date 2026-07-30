export type NodeShape = 'rectangle' | 'rounded' | 'circle' | 'diamond' | 'stadium' | 'cylinder'
export type EdgeStyle = 'solid' | 'dashed'
export type FlowDirection = 'LR' | 'TD'

export interface GraphNode {
  id: string
  label: string
  shape: NodeShape
  position: { x: number; y: number }
  subgraphId?: string
  color?: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  style: EdgeStyle
}

export interface GraphSubgraph {
  id: string
  label: string
}

export interface GraphModel {
  direction: FlowDirection
  nodes: GraphNode[]
  edges: GraphEdge[]
  subgraphs: GraphSubgraph[]
}

export function createEmptyGraphModel(): GraphModel {
  return {
    direction: 'TD',
    nodes: [],
    edges: [],
    subgraphs: [],
  }
}
