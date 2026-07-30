import { useEffect, useState } from 'react'
import { useGraphStore } from '../store/graphStore'
import { graphModelToMermaid } from '../serialize/modelToMermaid'
import { renderMermaidToSvg } from '../mermaid/render'
import { exportMmd, exportPng, exportSvg } from '../export/exportDiagram'

export function PreviewPanel() {
  const model = useGraphStore((state) => state.model)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [transparent, setTransparent] = useState(true)
  const [exportingPng, setExportingPng] = useState(false)

  useEffect(() => {
    let cancelled = false
    const code = graphModelToMermaid(model)

    renderMermaidToSvg(code)
      .then((result) => {
        if (cancelled) return
        setSvg(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [model])

  const canExportImage = Boolean(svg) && !error

  const handleExportPng = async () => {
    setExportingPng(true)
    try {
      await exportPng(svg, transparent)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'PNG 匯出失敗')
    } finally {
      setExportingPng(false)
    }
  }

  return (
    <section className="panel preview-panel">
      <h2 className="panel__title">Mermaid 預覽（匯出以此為準）</h2>
      <div className="preview-panel__toolbar">
        <label className="preview-panel__toggle">
          <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} />
          透明背景
        </label>
        <div className="preview-panel__export-buttons">
          <button type="button" onClick={() => exportMmd(graphModelToMermaid(model))}>
            匯出 .mmd
          </button>
          <button type="button" disabled={!canExportImage} onClick={() => exportSvg(svg, transparent)}>
            匯出 SVG
          </button>
          <button type="button" disabled={!canExportImage || exportingPng} onClick={handleExportPng}>
            {exportingPng ? '匯出中…' : '匯出 PNG'}
          </button>
        </div>
      </div>
      {error ? (
        <div className="panel__placeholder panel__placeholder--error">
          <p className="preview-panel__error-message">
            這個圖表目前無法正常渲染，可能是節點文字包含 Mermaid 無法辨識的內容。畫布與程式碼內容不會遺失，可以調整後再試一次。
          </p>
          <details className="preview-panel__error-detail">
            <summary>技術細節</summary>
            {error}
          </details>
        </div>
      ) : model.nodes.length === 0 ? (
        <div className="panel__placeholder">尚無內容可預覽，先在畫布上新增節點吧</div>
      ) : (
        <div className="preview-panel__canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </section>
  )
}
