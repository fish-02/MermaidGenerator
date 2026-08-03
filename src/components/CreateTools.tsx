import { useMemo, useState, type DragEvent } from 'react'
import type { NodeShape } from '../types/graph'
import { SHAPE_LIST } from '../canvas/shapeMeta'
import { useUiStore } from '../store/uiStore'
import { GridViewIcon, ListViewIcon, SearchIcon } from './icons'

export const SHAPE_DRAG_DATA_TYPE = 'application/x-mermaidgenerator-shape'

interface CreateToolsProps {
  onCreateShape: (shape: NodeShape) => void
}

export function CreateTools({ onCreateShape }: CreateToolsProps) {
  const paletteView = useUiStore((state) => state.paletteView)
  const setPaletteView = useUiStore((state) => state.setPaletteView)
  const recentShapes = useUiStore((state) => state.recentShapes)
  const [query, setQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<NodeShape | null>(null)

  const orderedShapes = useMemo(() => {
    const filtered = SHAPE_LIST.filter((meta) => meta.label.toLowerCase().includes(query.trim().toLowerCase()))
    const recentSet = new Set(recentShapes)
    const recentFirst = filtered.filter((meta) => recentSet.has(meta.id))
    recentFirst.sort((a, b) => recentShapes.indexOf(a.id) - recentShapes.indexOf(b.id))
    const rest = filtered.filter((meta) => !recentSet.has(meta.id))
    return [...recentFirst, ...rest]
  }, [query, recentShapes])

  const hoveredMeta = SHAPE_LIST.find((meta) => meta.id === hoveredId)

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, shape: NodeShape) => {
    event.dataTransfer.setData(SHAPE_DRAG_DATA_TYPE, shape)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="create-tools">
      <div className="create-tools__toolbar">
        <div className="create-tools__search">
          <SearchIcon width={14} height={14} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋形狀"
            aria-label="搜尋形狀"
          />
        </div>
        <div className="create-tools__view-toggle" role="radiogroup" aria-label="形狀顯示方式">
          <button
            type="button"
            role="radio"
            aria-checked={paletteView === 'grid'}
            className="create-tools__view-button"
            title="圖示網格"
            onClick={() => setPaletteView('grid')}
          >
            <GridViewIcon />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={paletteView === 'list'}
            className="create-tools__view-button"
            title="圖示＋名稱清單"
            onClick={() => setPaletteView('list')}
          >
            <ListViewIcon />
          </button>
        </div>
      </div>

      {orderedShapes.length === 0 ? (
        <p className="create-tools__empty">找不到符合的形狀</p>
      ) : (
        <ul className={`create-tools__list create-tools__list--${paletteView}`}>
          {orderedShapes.map((meta) => {
            const Icon = meta.icon
            return (
              <li key={meta.id}>
                <button
                  type="button"
                  className="create-tools__shape"
                  draggable
                  onDragStart={(event) => handleDragStart(event, meta.id)}
                  onClick={() => onCreateShape(meta.id)}
                  onMouseEnter={() => setHoveredId(meta.id)}
                  onMouseLeave={() => setHoveredId((current) => (current === meta.id ? null : current))}
                  onFocus={() => setHoveredId(meta.id)}
                  onBlur={() => setHoveredId((current) => (current === meta.id ? null : current))}
                  aria-label={`新增${meta.label}節點`}
                >
                  <Icon width={20} height={20} />
                  {paletteView === 'list' && <span className="create-tools__shape-name">{meta.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="create-tools__hint" aria-live="polite">
        {hoveredMeta ? `${hoveredMeta.label} · ${hoveredMeta.syntax}` : '將滑鼠移至形狀上或用鍵盤聚焦，可查看名稱與 Mermaid 語法'}
      </p>
    </div>
  )
}
