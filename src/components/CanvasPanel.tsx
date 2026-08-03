import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
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
import { useUiStore } from '../store/uiStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { modelToRFEdges, modelToRFNodes } from '../canvas/modelToReactFlow'
import { computeHierarchicalLayout } from '../canvas/autoArrange'
import { ShapeNode } from './nodes/ShapeNode'
import { GroupNode, type GroupNodeData } from './nodes/GroupNode'
import { LeftRail, LeftRailOverlay } from './LeftRail'
import { SHAPE_DRAG_DATA_TYPE } from './CreateTools'
import type { NodeShape } from '../types/graph'

const nodeTypes = { shapeNode: ShapeNode, groupNode: GroupNode }

const GROUP_PADDING = 24
const GROUP_LABEL_HEIGHT = 30
const DEFAULT_NODE_WIDTH = 120
const DEFAULT_NODE_HEIGHT = 50

interface CanvasInnerProps {
  showPreviewToggle: boolean
  previewExpanded: boolean
  onTogglePreview: () => void
}

function CanvasInner({ showPreviewToggle, previewExpanded, onTogglePreview }: CanvasInnerProps) {
  const breakpoint = useBreakpoint()
  const model = useGraphStore((state) => state.model)
  const rawSource = useGraphStore((state) => state.rawSource)
  const addNode = useGraphStore((state) => state.addNode)
  const updateNodePosition = useGraphStore((state) => state.updateNodePosition)
  const applyNodePositions = useGraphStore((state) => state.applyNodePositions)
  const removeNode = useGraphStore((state) => state.removeNode)
  const addEdge = useGraphStore((state) => state.addEdge)
  const removeEdge = useGraphStore((state) => state.removeEdge)
  const { screenToFlowPosition } = useReactFlow()

  const pendingFocusNodeId = useUiStore((state) => state.pendingFocusNodeId)
  const pendingFocusEdit = useUiStore((state) => state.pendingFocusEdit)
  const pendingSelectSubgraphId = useUiStore((state) => state.pendingSelectSubgraphId)
  const pushRecentShape = useUiStore((state) => state.pushRecentShape)
  const railOverlayOpen = useUiStore((state) => state.railOverlayOpen)
  const setRailOverlayOpen = useUiStore((state) => state.setRailOverlayOpen)

  const flowWrapperRef = useRef<HTMLDivElement>(null)
  const [selectedSubgraphId, setSelectedSubgraphId] = useState<string | null>(null)

  const rfNodesFromModel = useMemo(() => modelToRFNodes(model), [model])
  const rfEdgesFromModel = useMemo(() => modelToRFEdges(model), [model])

  const [nodes, setNodes] = useState<Node[]>(rfNodesFromModel)
  const [edges, setEdges] = useState<Edge[]>(rfEdgesFromModel)

  useEffect(() => {
    setNodes((current) => {
      const selectedIds = new Set(current.filter((node) => node.selected).map((node) => node.id))
      return rfNodesFromModel.map((node) => {
        if (node.id === pendingFocusNodeId) return { ...node, selected: true }
        return selectedIds.has(node.id) ? { ...node, selected: true } : node
      })
    })
    // Selection itself is derived straight from rfNodesFromModel (no dependency on when React
    // Flow's internal store actually mounts the node's DOM), so it's safe to clear here — except
    // when this is a "select and enter edit mode" request, in which case ShapeNode is the one
    // that must observe the flag once it mounts (possibly several async hops later) and clear it.
    if (pendingFocusNodeId && !pendingFocusEdit) {
      useUiStore.getState().setPendingFocus(null, false)
    }
  }, [rfNodesFromModel, pendingFocusNodeId, pendingFocusEdit])
  useEffect(() => setEdges(rfEdgesFromModel), [rfEdgesFromModel])

  useEffect(() => {
    if (pendingSelectSubgraphId) {
      setSelectedSubgraphId(pendingSelectSubgraphId)
      useUiStore.getState().setPendingSelectSubgraphId(null)
    }
  }, [pendingSelectSubgraphId])

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
      const subgraphIds = new Set(model.subgraphs.map((subgraph) => subgraph.id))
      const groupSelectChange = changes.find(
        (change): change is Extract<NodeChange<Node>, { type: 'select' }> =>
          change.type === 'select' && change.selected === true && subgraphIds.has(change.id),
      )
      if (groupSelectChange) {
        setSelectedSubgraphId(groupSelectChange.id)
      }

      const nodeChanges = changes.filter((change) => !('id' in change && subgraphIds.has(change.id)))
      setNodes((current) => applyNodeChanges(nodeChanges, current))
      for (const change of nodeChanges) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          updateNodePosition(change.id, change.position)
        }
        if (change.type === 'remove') {
          removeNode(change.id)
        }
        if (change.type === 'select' && change.selected) {
          setSelectedSubgraphId(null)
        }
      }
    },
    [updateNodePosition, removeNode, model.subgraphs],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((current) => applyEdgeChanges(changes, current))
      for (const change of changes) {
        if (change.type === 'remove') {
          removeEdge(change.id)
        }
        if (change.type === 'select' && change.selected) {
          setSelectedSubgraphId(null)
        }
      }
    },
    [removeEdge],
  )

  const onPaneClick = useCallback(() => {
    setSelectedSubgraphId(null)
  }, [])

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
      const id = addNode(shape, position)
      pushRecentShape(shape)
      useUiStore.getState().setPendingFocus(id, true)
    },
    [addNode, screenToFlowPosition, pushRecentShape],
  )

  const handleCreateShape = useCallback(
    (shape: NodeShape) => {
      const rect = flowWrapperRef.current?.getBoundingClientRect()
      const center = rect
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      const id = addNode(shape, center)
      pushRecentShape(shape)
      useUiStore.getState().setPendingFocus(id, true)
    },
    [addNode, screenToFlowPosition, pushRecentShape],
  )

  const selectedNodeIds = useMemo(() => nodes.filter((node) => node.selected).map((node) => node.id), [nodes])
  const selectedEdgeIds = useMemo(() => edges.filter((edge) => edge.selected).map((edge) => edge.id), [edges])

  const isDesktop = breakpoint === 'desktop'
  const overlayVariant = breakpoint === 'tablet' ? 'drawer' : breakpoint === 'mobile' ? 'sheet' : null
  const isCodeOnly = rawSource !== null

  if (isCodeOnly) {
    return (
      <section className="panel canvas-panel">
        <div className="panel__title">
          <h2 className="panel__title-text">畫布</h2>
        </div>
        <div className="canvas-panel__code-only">
          <p>此文件的圖表類型目前僅支援程式碼編輯，尚無法在畫布上視覺化拖拉。</p>
          <p className="canvas-panel__code-only-hint">請切換到「程式碼」查看或編輯完整內容。</p>
        </div>
      </section>
    )
  }

  return (
    <section className="panel canvas-panel" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="panel__title panel__title--with-action">
        <h2 className="panel__title-text">畫布</h2>
        {isDesktop && showPreviewToggle && (
          <button
            type="button"
            className="panel__collapse-button"
            aria-pressed={previewExpanded}
            onClick={onTogglePreview}
          >
            {previewExpanded ? '隱藏預覽' : '顯示預覽'}
          </button>
        )}
        {!isDesktop && (
          <button
            type="button"
            className="panel__collapse-button"
            aria-expanded={railOverlayOpen}
            onClick={() => setRailOverlayOpen(!railOverlayOpen)}
          >
            {railOverlayOpen ? '關閉建立／屬性' : '建立／屬性'}
          </button>
        )}
      </div>
      <div className="canvas-panel__body">
        {isDesktop && (
          <LeftRail
            onCreateShape={handleCreateShape}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeIds={selectedEdgeIds}
            selectedSubgraphId={selectedSubgraphId}
          />
        )}
        <div className="canvas-panel__flow" ref={flowWrapperRef}>
          <ReactFlow
            nodes={allNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
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
            <p className="canvas-panel__empty-hint">
              {isDesktop ? '從左側「建立」拖曳或點擊形狀，開始建立流程圖' : '點擊上方「建立／屬性」新增形狀，開始建立流程圖'}
            </p>
          )}
        </div>
        {overlayVariant && (
          <LeftRailOverlay
            variant={overlayVariant}
            onCreateShape={handleCreateShape}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeIds={selectedEdgeIds}
            selectedSubgraphId={selectedSubgraphId}
          />
        )}
      </div>
    </section>
  )
}

export function CanvasPanel(props: CanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
