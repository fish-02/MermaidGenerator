import { useState, type DragEvent } from 'react'
import type { NodeShape } from '../types/graph'

const SHAPES: { id: NodeShape; label: string }[] = [
  { id: 'rectangle', label: '矩形' },
  { id: 'rounded', label: '圓角矩形' },
  { id: 'circle', label: '圓形' },
  { id: 'diamond', label: '菱形（判斷）' },
  { id: 'stadium', label: '膠囊形（開始／結束）' },
  { id: 'cylinder', label: '資料庫圓柱' },
]

const COLOR_SWATCHES: { color: string | undefined; label: string }[] = [
  { color: undefined, label: '預設（清除顏色）' },
  { color: '#fecaca', label: '紅' },
  { color: '#fed7aa', label: '橘' },
  { color: '#fef08a', label: '黃' },
  { color: '#bbf7d0', label: '綠' },
  { color: '#bfdbfe', label: '藍' },
  { color: '#ddd6fe', label: '紫' },
  { color: '#e5e7eb', label: '灰' },
]

export const SHAPE_DRAG_DATA_TYPE = 'application/x-mermaidgenerator-shape'

interface CanvasToolOverlayProps {
  selectedNodeIds: string[]
  hasGroupedSelection: boolean
  onColorSelect: (color: string | undefined) => void
  onDuplicate: () => void
  onDelete: () => void
  onGroup: () => void
  onUngroup: () => void
}

export function CanvasToolOverlay({
  selectedNodeIds,
  hasGroupedSelection,
  onColorSelect,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
}: CanvasToolOverlayProps) {
  const [collapsed, setCollapsed] = useState(true)
  const hasSelection = selectedNodeIds.length > 0

  const handleDragStart = (event: DragEvent<HTMLLIElement>, shape: NodeShape) => {
    event.dataTransfer.setData(SHAPE_DRAG_DATA_TYPE, shape)
    event.dataTransfer.effectAllowed = 'copy'
  }

  if (collapsed) {
    return (
      <button type="button" className="canvas-overlay canvas-overlay--collapsed" onClick={() => setCollapsed(false)}>
        形狀與顏色 ▸
      </button>
    )
  }

  return (
    <div className="canvas-overlay">
      <div className="canvas-overlay__header">
        <span>形狀與顏色</span>
        <button type="button" className="panel__collapse-button" onClick={() => setCollapsed(true)}>
          收合 ◂
        </button>
      </div>

      <div className="canvas-overlay__section">
        <h3 className="canvas-overlay__section-title">形狀（拖到畫布）</h3>
        <ul className="shape-palette__list">
          {SHAPES.map((shape) => (
            <li
              key={shape.id}
              className={`shape-palette__item shape-palette__item--${shape.id}`}
              draggable
              onDragStart={(event) => handleDragStart(event, shape.id)}
            >
              {shape.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="canvas-overlay__section">
        <h3 className="canvas-overlay__section-title">操作</h3>
        {!hasSelection && <p className="canvas-overlay__hint">請先選取畫布上的節點</p>}
        <div className="canvas-overlay__actions">
          <button type="button" disabled={selectedNodeIds.length !== 1} onClick={onDuplicate}>
            複製
          </button>
          <button type="button" disabled={!hasSelection} onClick={onDelete}>
            刪除
          </button>
          <button type="button" disabled={selectedNodeIds.length < 2} onClick={onGroup}>
            群組
          </button>
          <button type="button" disabled={!hasGroupedSelection} onClick={onUngroup}>
            取消群組
          </button>
        </div>
      </div>

      <div className="canvas-overlay__section">
        <h3 className="canvas-overlay__section-title">顏色</h3>
        {!hasSelection && <p className="canvas-overlay__hint">請先選取畫布上的節點</p>}
        <div className={`color-swatches${hasSelection ? '' : ' color-swatches--disabled'}`}>
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.label}
              type="button"
              className={`color-swatches__item${swatch.color === undefined ? ' color-swatches__item--reset' : ''}`}
              style={swatch.color ? { backgroundColor: swatch.color } : undefined}
              title={swatch.label}
              disabled={!hasSelection}
              onClick={() => onColorSelect(swatch.color)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
