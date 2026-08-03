import { Dialog } from './Dialog'

interface OnboardingDialogProps {
  open: boolean
  onCreateBlank: () => void
  onOpenExamples: () => void
  onOpenPaste: () => void
  onDismiss: () => void
}

export function OnboardingDialog({ open, onCreateBlank, onOpenExamples, onOpenPaste, onDismiss }: OnboardingDialogProps) {
  return (
    <Dialog open={open} onClose={onDismiss} ariaLabel="建立第一張流程圖" className="dialog--onboarding">
      <button type="button" className="dialog__close" onClick={onDismiss} aria-label="關閉">
        ✕
      </button>
      <h2 className="dialog__title">建立第一張流程圖</h2>
      <p className="dialog__body">開始使用 MermaidGenerator：建立空白流程圖、從範例開始，或直接貼上既有的 Mermaid 程式碼。</p>
      <div className="onboarding__actions">
        <button type="button" className="toolbar-button toolbar-button--primary" onClick={onCreateBlank}>
          空白流程圖
        </button>
        <button type="button" className="toolbar-button" onClick={onOpenExamples}>
          查看範例
        </button>
        <button type="button" className="toolbar-button" onClick={onOpenPaste}>
          貼上 Mermaid 程式碼
        </button>
      </div>
      <p className="onboarding__hint">也可以直接把 .mmd 檔案拖曳到視窗中匯入。</p>
    </Dialog>
  )
}
