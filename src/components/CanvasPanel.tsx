import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  ControlButton,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGraphStore } from '../store/graphStore'
import { modelToRFEdges, modelToRFNodes } from '../canvas/modelToReactFlow'
import { computeHierarchicalLayout } from '../canvas/autoArrange'
import { ShapeNode } from './nodes/ShapeNode'
import { GroupNode, type GroupNodeData } from './nodes/GroupNode'
import { CanvasToolOverlay, SHAPE_DRAG_DATA_TYPE } from './CanvasToolOverlay'
import type { NodeShape } from '../types/graph'

const nodeTypes = { shapeNode: ShapeNode, groupNode: GroupNode }

const GROUP_PADDING = 24
const GROUP_LABEL_HEIGHT = 30
const DEFAULT_NODE_WIDTH = 120
const DEFAULT_NODE_HEIGHT = 50

function CanvasInner() {
  const model = useGraphStore((state) => state.model)
  const addNode = useGraphStore((state) => state.addNode)
  const updateNodePosition = useGraphStore((state) => state.updateNodePosition)
  const applyNodePositions = useGraphStore((state) => state.applyNodePositions)
  const removeNode = useGraphStore((state) => state.removeNode)
  const removeNodes = useGraphStore((state) => state.removeNodes)
  const duplicateNode = useGraphStore((state) => state.duplicateNode)
  const addEdge = useGraphStore((state) => state.addEdge)
  const removeEdge = useGraphStore((state) => state.removeEdge)
  const updateNodesColor = useGraphStore((state) => state.updateNodesColor)
  const groupNodes = useGraphStore((state) => state.groupNodes)
  const ungroupSubgraph = useGraphStore((state) => state.ungroupSubgraph)
  const { screenToFlowPosition } = useReactFlow()

  const rfNodesFromModel = useMemo(() => modelToRFNodes(model), [model])
  const rfEdgesFromModel = useMemo(() => modelToRFEdges(model), [model])

  const [nodes, setNodes] = useState<Node[]>(rfNodesFromModel)
  const [edges, setEdges] = useState<Edge[]>(rfEdgesFromModel)

  useEffect(() => {
    setNodes((current) => {
      const selectedIds = new Set(current.filter((node) => node.selected).map((node) => node.id))
      return rfNodesFromModel.map((node) => (selectedIds.has(node.id) ? { ...node, selected: true } : node))
    })
  }, [rfNodesFromModel])
  useEffect(() => setEdges(rfEdgesFromModel), [rfEdgesFromModel])

  const groupRFNodes = useMemo<Node<GroupNodeData>[]>(() => {
    return model.subgraphs.map((subgraph) => {
      const memberIds = new Set(model.nodes.filter((node) => node.subgraphId === subgraph.id).map((node) => node.id))
      const members = nodes.filter((node) => memberIds.has(node.id))

      if (members.length === 0) {
        return {
          id: subgraph.id,
          type: 'groupNode',
          position: { x: 0, y: 0 },
          data: { label: subgraph.label },
          width: 0,
          height: 0,
          draggable: false,
          selectable: true,
          zIndex: -1,
        }
      }

      const minX = Math.min(...members.map((node) => node.position.x)) - GROUP_PADDING
      const minY = Math.min(...members.map((node) => node.position.y)) - GROUP_PADDING - GROUP_LABEL_HEIGHT
      const maxX = Math.max(...members.map((node) => node.position.x + (node.measured?.width ?? DEFAULT_NODE_WIDTH))) + GROUP_PADDING
      const maxY = Math.max(...members.map((node) => node.position.y + (node.measured?.height ?? DEFAULT_NODE_HEIGHT))) + GROUP_PADDING

      return {
        id: subgraph.id,
        type: 'groupNode',
        position: { x: minX, y: minY },
        data: { label: subgraph.label },
        width: maxX - minX,
        height: maxY - minY,
        draggable: false,
        selectable: true,
        zIndex: -1,
      }
    })
  }, [model.subgraphs, model.nodes, nodes])

  const allNodes = useMemo<Node[]>(() => [...groupRFNodes, ...nodes], [groupRFNodes, nodes])

  const handleAutoArrange = useCallback(() => {
    const arrangeNodes = model.nodes.map((modelNode) => {
      const rfNode = nodes.find((node) => node.id === modelNode.id)
      return {
        id: modelNode.id,
        width: rfNode?.measured?.width ?? DEFAULT_NODE_WIDTH,
        height: rfNode?.measured?.height ?? DEFAULT_NODE_HEIGHT,
        subgraphId: modelNode.subgraphId,
      }
    })
    const subgraphIds = model.subgraphs.map((subgraph) => subgraph.id)
    const positions = computeHierarchicalLayout(arrangeNodes, model.edges, subgraphIds, model.direction)
    applyNodePositions(Array.from(positions, ([id, position]) => ({ id, position })))
  }, [nodes, model.nodes, model.edges, model.subgraphs, model.direction, applyNodePositions])

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((current) => applyNodeChanges(changes, current))
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          updateNodePosition(change.id, change.position)
        }
        if (change.type === 'remove') {
          removeNode(change.id)
        }
      }
    },
    [updateNodePosition, removeNode],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((current) => applyEdgeChanges(changes, current))
      for (const change of changes) {
        if (change.type === 'remove') {
          removeEdge(change.id)
        }
      }
    },
    [removeEdge],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      addEdge(connection.source, connection.target)
    },
    [addEdge],
  )

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const shape = event.dataTransfer.getData(SHAPE_DRAG_DATA_TYPE) as NodeShape
      if (!shape) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(shape, position)
    },
    [addNode, screenToFlowPosition],
  )

  const selectedNodeIds = useMemo(() => nodes.filter((node) => node.selected).map((node) => node.id), [nodes])
  const hasGroupedSelection = selectedNodeIds.some((id) => model.nodes.find((node) => node.id === id)?.subgraphId)

  return (
    <section className="panel canvas-panel" onDragOver={onDragOver} onDrop={onDrop}>
      <h2 className="panel__title">畫布</h2>
      <div className="canvas-panel__flow">
        <ReactFlow
          nodes={allNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls>
            <ControlButton onClick={handleAutoArrange} title="自動整理（依連線關係重新排版）">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </ControlButton>
          </Controls>
        </ReactFlow>
        {model.nodes.length === 0 && (
          <p className="canvas-panel__empty-hint">拖曳左上角「形狀與顏色」中的形狀到畫布，開始建立流程圖</p>
        )}
        <CanvasToolOverlay
          selectedNodeIds={selectedNodeIds}
          hasGroupedSelection={hasGroupedSelection}
          onColorSelect={(color) => {
            if (selectedNodeIds.length > 0) updateNodesColor(selectedNodeIds, color)
          }}
          onDuplicate={() => {
            if (selectedNodeIds.length === 1) duplicateNode(selectedNodeIds[0])
          }}
          onDelete={() => {
            if (selectedNodeIds.length > 0) removeNodes(selectedNodeIds)
          }}
          onGroup={() => {
            if (selectedNodeIds.length >= 2) groupNodes(selectedNodeIds)
          }}
          onUngroup={() => {
            const targetSubgraphIds = new Set(
              selectedNodeIds
                .map((id) => model.nodes.find((node) => node.id === id)?.subgraphId)
                .filter((id): id is string => Boolean(id)),
            )
            targetSubgraphIds.forEach((subgraphId) => ungroupSubgraph(subgraphId))
          }}
        />
      </div>
    </section>
  )
}

export function CanvasPanel() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
