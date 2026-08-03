import { useEffect, useMemo, useRef, useState } from 'react'
import { useGraphStore } from '../store/graphStore'
import { useUiStore } from '../store/uiStore'
import { COLOR_OPTIONS } from '../canvas/colorOptions'
import { SHAPE_LIST } from '../canvas/shapeMeta'
import type { NodeShape } from '../types/graph'

interface PropertiesPanelProps {
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  selectedSubgraphId: string | null
}

export function PropertiesPanel({ selectedNodeIds, selectedEdgeIds, selectedSubgraphId }: PropertiesPanelProps) {
  if (selectedSubgraphId) {
    return <GroupProperties key={selectedSubgraphId} subgraphId={selectedSubgraphId} />
  }
  if (selectedEdgeIds.length > 0 && selectedNodeIds.length === 0) {
    return <EdgeProperties key={selectedEdgeIds.join(',')} edgeIds={selectedEdgeIds} />
  }
  if (selectedNodeIds.length === 1) {
    return <NodeProperties key={selectedNodeIds[0]} nodeId={selectedNodeIds[0]} />
  }
  if (selectedNodeIds.length > 1) {
    return <MultiNodeProperties key={selectedNodeIds.join(',')} nodeIds={selectedNodeIds} />
  }
  return <DocumentProperties />
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (color: string | undefined) => void
}) {
  return (
    <div className="color-picker">
      {COLOR_OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          className={`color-picker__item${value === option.color ? ' color-picker__item--active' : ''}`}
          onClick={() => onChange(option.color)}
        >
          <span
            className={`color-picker__swatch${option.color ? '' : ' color-picker__swatch--reset'}`}
            style={option.color ? { backgroundColor: option.color } : undefined}
          />
          <span className="color-picker__label">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function NodeProperties({ nodeId }: { nodeId: string }) {
  const node = useGraphStore((state) => state.model.nodes.find((n) => n.id === nodeId))
  const updateNodeLabel = useGraphStore((state) => state.updateNodeLabel)
  const updateNodeShape = useGraphStore((state) => state.updateNodeShape)
  const updateNodeColor = useGraphStore((state) => state.updateNodeColor)
  const renameNodeId = useGraphStore((state) => state.renameNodeId)
  const duplicateNode = useGraphStore((state) => state.duplicateNode)
  const removeNode = useGraphStore((state) => state.removeNode)
  const setPendingFocus = useUiStore((state) => state.setPendingFocus)

  const [idDraft, setIdDraft] = useState(nodeId)
  const [idError, setIdError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    setIdDraft(nodeId)
    setIdError(null)
  }, [nodeId])

  if (!node) return null

  const commitId = (raw: string) => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const trimmed = raw.trim()
    if (trimmed === nodeId) {
      setIdError(null)
      return
    }
    const result = renameNodeId(nodeId, trimmed)
    if (!result.ok) {
      setIdError(result.reason ?? 'ID 無效')
      return
    }
    setIdError(null)
    setPendingFocus(trimmed, false)
  }

  return (
    <div className="properties-panel__section">
      <h3 className="properties-panel__title">節點屬性</h3>
      <label className="properties-field">
        <span>文字</span>
        <input type="text" value={node.label} onChange={(event) => updateNodeLabel(nodeId, event.target.value)} />
      </label>
      <label className="properties-field">
        <span>形狀</span>
        <select value={node.shape} onChange={(event) => updateNodeShape(nodeId, event.target.value as NodeShape)}>
          {SHAPE_LIST.map((meta) => (
            <option key={meta.id} value={meta.id}>
              {meta.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="properties-field properties-field--colors">
        <legend>填色</legend>
        <ColorPicker value={node.color} onChange={(color) => updateNodeColor(nodeId, color)} />
      </fieldset>

      <details className="properties-panel__advanced">
        <summary>進階</summary>
        <label className="properties-field">
          <span>Mermaid ID</span>
          <input
            type="text"
            value={idDraft}
            onChange={(event) => setIdDraft(event.target.value)}
            onBlur={(event) => commitId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                cancelledRef.current = true
                setIdDraft(nodeId)
                setIdError(null)
                event.currentTarget.blur()
              }
            }}
            aria-invalid={idError ? true : undefined}
          />
        </label>
        {idError && (
          <p className="properties-field__error" role="alert">
            {idError}
          </p>
        )}
        <p className="properties-field__hint">修改 ID 會同步更新所有連線；請確認不與其他節點或群組重複。</p>
      </details>

      <div className="properties-panel__actions">
        <button type="button" onClick={() => duplicateNode(nodeId)}>
          複製
        </button>
        <button type="button" className="properties-panel__danger" onClick={() => removeNode(nodeId)}>
          刪除
        </button>
      </div>
    </div>
  )
}

function MultiNodeProperties({ nodeIds }: { nodeIds: string[] }) {
  const model = useGraphStore((state) => state.model)
  const updateNodesColor = useGraphStore((state) => state.updateNodesColor)
  const removeNodes = useGraphStore((state) => state.removeNodes)
  const groupNodes = useGraphStore((state) => state.groupNodes)
  const ungroupSubgraph = useGraphStore((state) => state.ungroupSubgraph)

  const groupedSubgraphIds = new Set(
    nodeIds
      .map((id) => model.nodes.find((node) => node.id === id)?.subgraphId)
      .filter((id): id is string => Boolean(id)),
  )

  return (
    <div className="properties-panel__section">
      <h3 className="properties-panel__title">已選取 {nodeIds.length} 個節點</h3>
      <fieldset className="properties-field properties-field--colors">
        <legend>填色（套用至所有選取節點）</legend>
        <ColorPicker value={undefined} onChange={(color) => updateNodesColor(nodeIds, color)} />
      </fieldset>
      <div className="properties-panel__actions">
        <button type="button" disabled={nodeIds.length < 2} onClick={() => groupNodes(nodeIds)}>
          群組
        </button>
        <button
          type="button"
          disabled={groupedSubgraphIds.size === 0}
          onClick={() => groupedSubgraphIds.forEach((id) => ungroupSubgraph(id))}
        >
          取消群組
        </button>
        <button type="button" className="properties-panel__danger" onClick={() => removeNodes(nodeIds)}>
          刪除
        </button>
      </div>
    </div>
  )
}

function EdgeProperties({ edgeIds }: { edgeIds: string[] }) {
  const allEdges = useGraphStore((state) => state.model.edges)
  const edges = useMemo(() => allEdges.filter((edge) => edgeIds.includes(edge.id)), [allEdges, edgeIds])
  const updateEdgeLabel = useGraphStore((state) => state.updateEdgeLabel)
  const updateEdgesStyle = useGraphStore((state) => state.updateEdgesStyle)
  const removeEdges = useGraphStore((state) => state.removeEdges)

  if (edges.length === 0) return null

  const single = edges.length === 1 ? edges[0] : undefined
  const allDashed = edges.every((edge) => edge.style === 'dashed')
  const allSolid = edges.every((edge) => edge.style === 'solid')

  return (
    <div className="properties-panel__section">
      <h3 className="properties-panel__title">{edges.length > 1 ? `已選取 ${edges.length} 條連線` : '連線屬性'}</h3>
      <fieldset className="properties-field">
        <legend>線型</legend>
        <div className="properties-panel__segmented" role="radiogroup" aria-label="線型">
          <button
            type="button"
            role="radio"
            aria-checked={allSolid}
            className={allSolid ? 'is-active' : ''}
            onClick={() => updateEdgesStyle(edgeIds, 'solid')}
          >
            實線
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={allDashed}
            className={allDashed ? 'is-active' : ''}
            onClick={() => updateEdgesStyle(edgeIds, 'dashed')}
          >
            虛線
          </button>
        </div>
      </fieldset>
      {single && (
        <label className="properties-field">
          <span>標籤</span>
          <input
            type="text"
            value={single.label ?? ''}
            placeholder="（無標籤）"
            onChange={(event) => updateEdgeLabel(single.id, event.target.value)}
          />
        </label>
      )}
      <div className="properties-panel__actions">
        <button type="button" className="properties-panel__danger" onClick={() => removeEdges(edgeIds)}>
          刪除
        </button>
      </div>
    </div>
  )
}

function GroupProperties({ subgraphId }: { subgraphId: string }) {
  const subgraph = useGraphStore((state) => state.model.subgraphs.find((sg) => sg.id === subgraphId))
  const updateSubgraphLabel = useGraphStore((state) => state.updateSubgraphLabel)
  const renameSubgraphId = useGraphStore((state) => state.renameSubgraphId)
  const ungroupSubgraph = useGraphStore((state) => state.ungroupSubgraph)
  const setPendingSelectSubgraphId = useUiStore((state) => state.setPendingSelectSubgraphId)

  const [idDraft, setIdDraft] = useState(subgraphId)
  const [idError, setIdError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    setIdDraft(subgraphId)
    setIdError(null)
  }, [subgraphId])

  if (!subgraph) return null

  const commitId = (raw: string) => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const trimmed = raw.trim()
    if (trimmed === subgraphId) {
      setIdError(null)
      return
    }
    const result = renameSubgraphId(subgraphId, trimmed)
    if (!result.ok) {
      setIdError(result.reason ?? 'ID 無效')
      return
    }
    setIdError(null)
    setPendingSelectSubgraphId(trimmed)
  }

  return (
    <div className="properties-panel__section">
      <h3 className="properties-panel__title">群組屬性</h3>
      <label className="properties-field">
        <span>名稱</span>
        <input
          type="text"
          value={subgraph.label}
          onChange={(event) => updateSubgraphLabel(subgraphId, event.target.value)}
        />
      </label>

      <details className="properties-panel__advanced">
        <summary>進階</summary>
        <label className="properties-field">
          <span>Mermaid ID</span>
          <input
            type="text"
            value={idDraft}
            onChange={(event) => setIdDraft(event.target.value)}
            onBlur={(event) => commitId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                cancelledRef.current = true
                setIdDraft(subgraphId)
                setIdError(null)
                event.currentTarget.blur()
              }
            }}
            aria-invalid={idError ? true : undefined}
          />
        </label>
        {idError && (
          <p className="properties-field__error" role="alert">
            {idError}
          </p>
        )}
      </details>

      <p className="properties-field__hint">背景色、邊框與內距設定將於後續版本提供。</p>

      <div className="properties-panel__actions">
        <button type="button" className="properties-panel__danger" onClick={() => ungroupSubgraph(subgraphId)}>
          取消群組
        </button>
      </div>
    </div>
  )
}

function DocumentProperties() {
  const direction = useGraphStore((state) => state.model.direction)
  const setDirection = useGraphStore((state) => state.setDirection)

  return (
    <div className="properties-panel__section">
      <h3 className="properties-panel__title">文件設定</h3>
      <fieldset className="properties-field">
        <legend>圖表方向</legend>
        <div className="properties-panel__segmented" role="radiogroup" aria-label="圖表方向">
          <button
            type="button"
            role="radio"
            aria-checked={direction === 'TD'}
            className={direction === 'TD' ? 'is-active' : ''}
            onClick={() => setDirection('TD')}
          >
            上到下
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={direction === 'LR'}
            className={direction === 'LR' ? 'is-active' : ''}
            onClick={() => setDirection('LR')}
          >
            左到右
          </button>
        </div>
      </fieldset>
      <p className="properties-field__hint">請先在畫布上選取節點、連線或群組，即可編輯其屬性。</p>
      <p className="properties-field__hint">輸出主題、背景與全域字體設定將於後續版本提供。</p>
    </div>
  )
}
