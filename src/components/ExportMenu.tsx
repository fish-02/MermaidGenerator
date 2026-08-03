import { useState } from 'react'
import { exportMmd, exportPng, exportSvg } from '../export/exportDiagram'
import { useDismissableMenu } from '../hooks/useDismissableMenu'
import { ExportIcon, ChevronDownIcon } from './icons'

interface ExportMenuProps {
  code: string
  svg: string
  hasError: boolean
}

export function ExportMenu({ code, svg, hasError }: ExportMenuProps) {
  const { open, setOpen, ref: containerRef } = useDismissableMenu<HTMLDivElement>()
  const [transparent, setTransparent] = useState(true)
  const [exportingPng, setExportingPng] = useState(false)
  const [pngError, setPngError] = useState<string | null>(null)

  const canExportImage = Boolean(svg) && !hasError

  const handleExportPng = async () => {
    setExportingPng(true)
    setPngError(null)
    try {
      await exportPng(svg, transparent)
    } catch (err) {
      setPngError(err instanceof Error ? err.message : 'PNG 匯出失敗')
    } finally {
      setExportingPng(false)
    }
  }

  return (
    <div className="export-menu" ref={containerRef}>
      <button
        type="button"
        className="toolbar-button toolbar-button--primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ExportIcon />
        <span>匯出</span>
        <ChevronDownIcon width={12} height={12} />
      </button>
      {open && (
        <div className="export-menu__panel" role="menu">
          <label className="export-menu__toggle">
            <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} />
            透明背景
          </label>
          <button type="button" role="menuitem" className="export-menu__item" onClick={() => exportMmd(code)}>
            下載 .mmd
          </button>
          <button
            type="button"
            role="menuitem"
            className="export-menu__item"
            disabled={!canExportImage}
            onClick={() => exportSvg(svg, transparent)}
          >
            下載 SVG
          </button>
          <button
            type="button"
            role="menuitem"
            className="export-menu__item"
            disabled={!canExportImage || exportingPng}
            onClick={handleExportPng}
          >
            {exportingPng ? '下載中…' : '下載 PNG'}
          </button>
          {pngError && (
            <p className="export-menu__error" role="alert">
              {pngError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
