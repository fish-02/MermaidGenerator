import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { GraphModel } from '../types/graph'
import type { ShapeNodeData } from '../components/nodes/ShapeNode'

export function modelToRFNodes(model: GraphModel): Node<ShapeNodeData>[] {
  return model.nodes.map((node) => ({
    id: node.id,
    type: 'shapeNode',
    position: node.position,
    data: { label: node.label, shape: node.shape, color: node.color },
  }))
}

export function modelToRFEdges(model: GraphModel): Edge[] {
  const isLR = model.direction === 'LR'
  const sourceHandle = isLR ? 'source-right' : 'source-bottom'
  const targetHandle = isLR ? 'target-left' : 'target-top'

  return model.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    label: edge.label,
    style: edge.style === 'dashed' ? { strokeDasharray: '5 5' } : undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}
