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
import { resolveOverlaps, type OverlapBox } from '../canvas/autoArrange'
import { ShapeNode } from './nodes/ShapeNode'
import { GroupNode, type GroupNodeData } from './nodes/GroupNode'
import { CanvasToolOverlay, SHAPE_DRAG_DATA_TYPE } from './CanvasToolOverlay'
import type { NodeShape } from '../types/graph'

const nodeTypes = { shapeNode: ShapeNode, groupNode: GroupNode }

const GROUP_PADDING = 24
const GROUP_LABEL_HEIGHT = 30
const DEFAULT_NODE_WIDTH = 120
const DEFAULT_NODE_HEIGHT = 50
const ARRANGE_GAP = 32

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
    const nodeSize = (node: Node) => ({
      width: node.measured?.width ?? DEFAULT_NODE_WIDTH,
      height: node.measured?.height ?? DEFAULT_NODE_HEIGHT,
    })

    // Step 1: resolve overlaps between member nodes within each subgraph independently.
    const localPositions = new Map(nodes.map((node) => [node.id, { ...node.position }]))
    for (const subgraph of model.subgraphs) {
      const memberIds = model.nodes.filter((node) => node.subgraphId === subgraph.id).map((node) => node.id)
      const boxes: OverlapBox[] = memberIds
        .map((id) => nodes.find((node) => node.id === id))
        .filter((node): node is Node => Boolean(node))
        .map((node) => ({ id: node.id, ...localPositions.get(node.id)!, ...nodeSize(node) }))
      if (boxes.length < 2) continue
      resolveOverlaps(boxes, ARRANGE_GAP)
      for (const box of boxes) localPositions.set(box.id, { x: box.x, y: box.y })
    }

    // Step 2: build one box per subgraph (post step-1 bounding box) plus one box per standalone node.
    const topLevelBoxes: OverlapBox[] = []
    const subgraphOriginalBox = new Map<string, { x: number; y: number }>()

    for (const subgraph of model.subgraphs) {
      const memberIds = model.nodes.filter((node) => node.subgraphId === subgraph.id).map((node) => node.id)
      const members = memberIds
        .map((id) => nodes.find((node) => node.id === id))
        .filter((node): node is Node => Boolean(node))
      if (members.length === 0) continue

      const minX = Math.min(...members.map((node) => localPositions.get(node.id)!.x)) - GROUP_PADDING
      const minY =
        Math.min(...members.map((node) => localPositions.get(node.id)!.y)) - GROUP_PADDING - GROUP_LABEL_HEIGHT
      const maxX =
        Math.max(...members.map((node) => localPositions.get(node.id)!.x + nodeSize(node).width)) + GROUP_PADDING
      const maxY =
        Math.max(...members.map((node) => localPositions.get(node.id)!.y + nodeSize(node).height)) + GROUP_PADDING

      subgraphOriginalBox.set(subgraph.id, { x: minX, y: minY })
      topLevelBoxes.push({ id: subgraph.id, x: minX, y: minY, width: maxX - minX, height: maxY - minY })
    }

    for (const node of nodes) {
      const modelNode = model.nodes.find((candidate) => candidate.id === node.id)
      if (modelNode?.subgraphId) continue
      const position = localPositions.get(node.id)!
      topLevelBoxes.push({ id: node.id, ...position, ...nodeSize(node) })
    }

    resolveOverlaps(topLevelBoxes, ARRANGE_GAP)

    // Step 3: translate grouped members by their subgraph's shift; standalone nodes take the resolved box position directly.
    const finalPositions = new Map(localPositions)
    for (const box of topLevelBoxes) {
      const originalGroupBox = subgraphOriginalBox.get(box.id)
      if (originalGroupBox) {
        const dx = box.x - originalGroupBox.x
        const dy = box.y - originalGroupBox.y
        const memberIds = model.nodes.filter((node) => node.subgraphId === box.id).map((node) => node.id)
        for (const id of memberIds) {
          const position = localPositions.get(id)!
          finalPositions.set(id, { x: position.x + dx, y: position.y + dy })
        }
      } else {
        finalPositions.set(box.id, { x: box.x, y: box.y })
      }
    }

    applyNodePositions(Array.from(finalPositions, ([id, position]) => ({ id, position })))
  }, [nodes, model.nodes, model.subgraphs, applyNodePositions])

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
            <ControlButton onClick={handleAutoArrange} title="自動整理（解決重疊）">
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
