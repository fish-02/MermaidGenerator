import { useState } from 'react'
import { Dialog } from './Dialog'

interface PasteCodeDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}

export function PasteCodeDialog({ open, onClose, onSubmit }: PasteCodeDialogProps) {
  const [text, setText] = useState('')

  const handleClose = () => {
    setText('')
    onClose()
  }

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit(text)
    setText('')
  }

  return (
    <Dialog open={open} onClose={handleClose} ariaLabel="貼上 Mermaid 程式碼" className="dialog--paste">
      <h2 className="dialog__title">貼上 Mermaid 程式碼</h2>
      <textarea
        className="dialog__textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={'flowchart TD\n  A[開始] --> B[結束]'}
        rows={12}
        autoFocus
      />
      <div className="dialog__actions">
        <div className="dialog__actions-end">
          <button type="button" className="toolbar-button" onClick={handleClose}>
            取消
          </button>
          <button type="button" className="toolbar-button toolbar-button--primary" disabled={!text.trim()} onClick={handleSubmit}>
            確定
          </button>
        </div>
      </div>
    </Dialog>
  )
}
