import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  MOBILE_SHEET_HEIGHT_MAX,
  MOBILE_SHEET_HEIGHT_MIN,
  RAIL_SECTION_RATIO_MAX,
  RAIL_SECTION_RATIO_MIN,
  RAIL_WIDTH_MAX,
  RAIL_WIDTH_MIN,
  useUiStore,
} from '../store/uiStore'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { CreateTools } from './CreateTools'
import { PropertiesPanel } from './PropertiesPanel'
import { ChevronRightIcon } from './icons'
import type { NodeShape } from '../types/graph'

interface LeftRailProps {
  onCreateShape: (shape: NodeShape) => void
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  selectedSubgraphId: string | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function LeftRail({ onCreateShape, selectedNodeIds, selectedEdgeIds, selectedSubgraphId }: LeftRailProps) {
  const collapsed = useUiStore((state) => state.leftRailCollapsed)
  const setCollapsed = useUiStore((state) => state.setLeftRailCollapsed)
  const width = useUiStore((state) => state.leftRailWidth)
  const setWidth = useUiStore((state) => state.setLeftRailWidth)
  const ratio = useUiStore((state) => state.leftRailSectionRatio)
  const setRatio = useUiStore((state) => state.setLeftRailSectionRatio)
  const createCollapsed = useUiStore((state) => state.createSectionCollapsed)
  const setCreateCollapsed = useUiStore((state) => state.setCreateSectionCollapsed)
  const propertiesCollapsed = useUiStore((state) => state.propertiesSectionCollapsed)
  const setPropertiesCollapsed = useUiStore((state) => state.setPropertiesSectionCollapsed)

  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWidthPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = width

      const handleMove = (moveEvent: PointerEvent) => {
        setDragWidth(clamp(startWidth + (moveEvent.clientX - startX), RAIL_WIDTH_MIN, RAIL_WIDTH_MAX))
      }
      const handleUp = (upEvent: PointerEvent) => {
        setWidth(clamp(startWidth + (upEvent.clientX - startX), RAIL_WIDTH_MIN, RAIL_WIDTH_MAX))
        setDragWidth(null)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [width, setWidth],
  )

  const handleRatioPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault()
      const startY = event.clientY
      const startRatio = ratio
      const containerHeight = containerRef.current?.getBoundingClientRect().height ?? 400

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = (moveEvent.clientY - startY) / containerHeight
        setDragRatio(clamp(startRatio + delta, RAIL_SECTION_RATIO_MIN, RAIL_SECTION_RATIO_MAX))
      }
      const handleUp = (upEvent: PointerEvent) => {
        const delta = (upEvent.clientY - startY) / containerHeight
        setRatio(clamp(startRatio + delta, RAIL_SECTION_RATIO_MIN, RAIL_SECTION_RATIO_MAX))
        setDragRatio(null)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [ratio, setRatio],
  )

  const handleWidthKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setWidth(width - 16)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setWidth(width + 16)
    }
  }

  const handleRatioKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setRatio(ratio - 0.05)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setRatio(ratio + 0.05)
    }
  }

  if (collapsed) {
    return (
      <div className="left-rail left-rail--collapsed">
        <button
          type="button"
          className="left-rail__expand-button"
          onClick={() => setCollapsed(false)}
          aria-label="展開建立／屬性欄"
          title="展開建立／屬性欄"
        >
          <ChevronRightIcon />
        </button>
      </div>
    )
  }

  const effectiveWidth = dragWidth ?? width
  const effectiveRatio = dragRatio ?? ratio
  const bothExpanded = !createCollapsed && !propertiesCollapsed

  return (
    <div className="left-rail" style={{ width: effectiveWidth }} ref={containerRef}>
      <div className="left-rail__topbar">
        <span className="left-rail__topbar-title">建立／屬性</span>
        <button
          type="button"
          className="left-rail__collapse-button"
          onClick={() => setCollapsed(true)}
          aria-label="收合建立／屬性欄"
          title="收合建立／屬性欄"
        >
          收合 ◂
        </button>
      </div>

      <div className="left-rail__sections">
        <section
          className={`left-rail__section${createCollapsed ? ' left-rail__section--collapsed' : ''}`}
          style={bothExpanded ? { flex: effectiveRatio } : undefined}
        >
          <div className="left-rail__section-header">
            <h2 className="left-rail__section-title">建立</h2>
            <button
              type="button"
              className="left-rail__section-toggle"
              onClick={() => setCreateCollapsed(!createCollapsed)}
              aria-expanded={!createCollapsed}
            >
              {createCollapsed ? '展開 ▾' : '收合 ▴'}
            </button>
          </div>
          {!createCollapsed && (
            <div className="left-rail__section-body">
              <CreateTools onCreateShape={onCreateShape} />
            </div>
          )}
        </section>

        {bothExpanded && (
          <div
            className="left-rail__ratio-handle"
            role="separator"
            aria-orientation="horizontal"
            aria-label="調整建立與屬性區高度比例"
            tabIndex={0}
            onPointerDown={handleRatioPointerDown}
            onKeyDown={handleRatioKeyDown}
          />
        )}

        <section
          className={`left-rail__section${propertiesCollapsed ? ' left-rail__section--collapsed' : ''}`}
          style={bothExpanded ? { flex: 1 - effectiveRatio } : undefined}
        >
          <div className="left-rail__section-header">
            <h2 className="left-rail__section-title">屬性</h2>
            <button
              type="button"
              className="left-rail__section-toggle"
              onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
              aria-expanded={!propertiesCollapsed}
            >
              {propertiesCollapsed ? '展開 ▾' : '收合 ▴'}
            </button>
          </div>
          {!propertiesCollapsed && (
            <div className="left-rail__section-body">
              <PropertiesPanel
                selectedNodeIds={selectedNodeIds}
                selectedEdgeIds={selectedEdgeIds}
                selectedSubgraphId={selectedSubgraphId}
              />
            </div>
          )}
        </section>
      </div>

      <div
        className="left-rail__width-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="調整建立／屬性欄寬度"
        tabIndex={0}
        onPointerDown={handleWidthPointerDown}
        onKeyDown={handleWidthKeyDown}
      />
    </div>
  )
}

interface LeftRailOverlayProps {
  variant: 'drawer' | 'sheet'
  onCreateShape: (shape: NodeShape) => void
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  selectedSubgraphId: string | null
}

/** Tablet drawer / mobile bottom-sheet variant of the create/properties rail (spec §7). */
export function LeftRailOverlay({
  variant,
  onCreateShape,
  selectedNodeIds,
  selectedEdgeIds,
  selectedSubgraphId,
}: LeftRailOverlayProps) {
  const open = useUiStore((state) => state.railOverlayOpen)
  const setOpen = useUiStore((state) => state.setRailOverlayOpen)
  const createCollapsed = useUiStore((state) => state.createSectionCollapsed)
  const setCreateCollapsed = useUiStore((state) => state.setCreateSectionCollapsed)
  const propertiesCollapsed = useUiStore((state) => state.propertiesSectionCollapsed)
  const setPropertiesCollapsed = useUiStore((state) => state.setPropertiesSectionCollapsed)
  const sheetHeight = useUiStore((state) => state.mobileSheetHeight)
  const setSheetHeight = useUiStore((state) => state.setMobileSheetHeight)

  const containerRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [setOpen])
  useFocusTrap(open, containerRef, close)

  const [dragHeight, setDragHeight] = useState<number | null>(null)

  const handleHeightPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault()
      const startY = event.clientY
      const startHeight = sheetHeight

      const handleMove = (moveEvent: PointerEvent) => {
        setDragHeight(clamp(startHeight - (moveEvent.clientY - startY), MOBILE_SHEET_HEIGHT_MIN, MOBILE_SHEET_HEIGHT_MAX))
      }
      const handleUp = (upEvent: PointerEvent) => {
        setSheetHeight(clamp(startHeight - (upEvent.clientY - startY), MOBILE_SHEET_HEIGHT_MIN, MOBILE_SHEET_HEIGHT_MAX))
        setDragHeight(null)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [sheetHeight, setSheetHeight],
  )

  const handleHeightKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSheetHeight(sheetHeight + 24)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSheetHeight(sheetHeight - 24)
    }
  }

  if (!open) return null

  const effectiveHeight = dragHeight ?? sheetHeight

  return (
    <>
      <div className="rail-overlay__backdrop" onClick={close} />
      <div
        className={`rail-overlay rail-overlay--${variant}`}
        style={variant === 'sheet' ? { height: effectiveHeight } : undefined}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="建立與屬性"
      >
        {variant === 'sheet' && (
          <div
            className="rail-overlay__grab"
            role="separator"
            aria-orientation="horizontal"
            aria-label="調整面板高度"
            tabIndex={0}
            onPointerDown={handleHeightPointerDown}
            onKeyDown={handleHeightKeyDown}
          />
        )}
        <div className="rail-overlay__topbar">
          <span className="rail-overlay__title">建立／屬性</span>
          <button type="button" className="left-rail__collapse-button" onClick={close} aria-label="關閉">
            關閉 ✕
          </button>
        </div>
        <div className="left-rail__sections">
          <section className={`left-rail__section${createCollapsed ? ' left-rail__section--collapsed' : ''}`}>
            <div className="left-rail__section-header">
              <h2 className="left-rail__section-title">建立</h2>
              <button
                type="button"
                className="left-rail__section-toggle"
                onClick={() => setCreateCollapsed(!createCollapsed)}
                aria-expanded={!createCollapsed}
              >
                {createCollapsed ? '展開 ▾' : '收合 ▴'}
              </button>
            </div>
            {!createCollapsed && (
              <div className="left-rail__section-body">
                <CreateTools
                  onCreateShape={(shape) => {
                    onCreateShape(shape)
                    close()
                  }}
                />
              </div>
            )}
          </section>

          <section className={`left-rail__section${propertiesCollapsed ? ' left-rail__section--collapsed' : ''}`}>
            <div className="left-rail__section-header">
              <h2 className="left-rail__section-title">屬性</h2>
              <button
                type="button"
                className="left-rail__section-toggle"
                onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
                aria-expanded={!propertiesCollapsed}
              >
                {propertiesCollapsed ? '展開 ▾' : '收合 ▴'}
              </button>
            </div>
            {!propertiesCollapsed && (
              <div className="left-rail__section-body">
                <PropertiesPanel
                  selectedNodeIds={selectedNodeIds}
                  selectedEdgeIds={selectedEdgeIds}
                  selectedSubgraphId={selectedSubgraphId}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
