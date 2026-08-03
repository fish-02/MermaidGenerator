interface PreviewPanelProps {
  svg: string
  error: string | null
  /** Whether the current document has anything to render — for a code-only document (spec §11)
   *  this can't be read off the canvas model, which is always empty, so the caller decides. */
  hasContent: boolean
}

export function PreviewPanel({ svg, error, hasContent }: PreviewPanelProps) {
  return (
    <section className="panel preview-panel">
      <h2 className="panel__title">Mermaid 預覽（匯出以此為準）</h2>
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
      ) : !hasContent ? (
        <div className="panel__placeholder">尚無內容可預覽，先在畫布上新增節點吧</div>
      ) : (
        <div className="preview-panel__canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </section>
  )
}
