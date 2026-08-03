import { useEffect, useState } from 'react'
import { Dialog } from './Dialog'
import { EXAMPLE_LIBRARY, type DiagramExample } from '../../examples/exampleLibrary'
import { getExampleThumbnail } from '../../examples/exampleThumbnailCache'

interface ExampleGalleryDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (example: DiagramExample) => void
}

function ExampleThumbnail({ example }: { example: DiagramExample }) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getExampleThumbnail(example.id, example.code).then((result) => {
      if (!cancelled) setSvg(result)
    })
    return () => {
      cancelled = true
    }
  }, [example.id, example.code])

  return (
    <div className="example-gallery__thumbnail" aria-hidden="true">
      {svg ? (
        <div className="example-gallery__thumbnail-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="example-gallery__thumbnail-skeleton" />
      )}
    </div>
  )
}

export function ExampleGalleryDialog({ open, onClose, onSelect }: ExampleGalleryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} ariaLabel="範例庫" className="dialog--gallery">
      <div className="dialog__header">
        <h2 className="dialog__title">從範例建立</h2>
        <button type="button" className="dialog__close" onClick={onClose} aria-label="關閉">
          ✕
        </button>
      </div>
      <p className="dialog__body">
        流程圖類型的範例可在畫布上直接編輯；其他 Mermaid 圖表類型第一版僅支援在程式碼模式編輯。
      </p>
      <div className="example-gallery__grid">
        {EXAMPLE_LIBRARY.map((example) => (
          <div key={example.id} className="example-gallery__card">
            <ExampleThumbnail example={example} />
            <div className="example-gallery__card-head">
              <h3 className="example-gallery__card-title">{example.title}</h3>
              <span
                className={`example-gallery__badge${example.canvasEditable ? ' example-gallery__badge--canvas' : ''}`}
              >
                {example.canvasEditable ? '支援畫布編輯' : '程式碼編輯'}
              </span>
            </div>
            <p className="example-gallery__card-description">{example.description}</p>
            <button type="button" className="toolbar-button toolbar-button--primary" onClick={() => onSelect(example)}>
              使用此範例
            </button>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
