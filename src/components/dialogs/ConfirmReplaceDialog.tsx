import { Dialog } from './Dialog'
import { exportMmd } from '../../export/exportDiagram'

export interface PendingReplace {
  sourceLabel: string
  documentName: string
  model: import('../../types/graph').GraphModel
  rawSource: string | null
  warnings?: string[]
}

interface ConfirmReplaceDialogProps {
  pending: PendingReplace | null
  currentCode: string
  currentDocumentName: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmReplaceDialog({ pending, currentCode, currentDocumentName, onCancel, onConfirm }: ConfirmReplaceDialogProps) {
  return (
    <Dialog open={pending !== null} onClose={onCancel} ariaLabel="確認取代目前文件" className="dialog--confirm">
      {pending && (
        <>
          <h2 className="dialog__title">確定要取代目前文件嗎？</h2>
          <p className="dialog__body">
            即將以「{pending.sourceLabel}」取代目前的文件「{currentDocumentName}」，目前內容將被覆蓋。取代後可使用一次性的「復原上一份文件」還原，但重新整理頁面或再次編輯新文件後就無法復原。
          </p>
          <div className="dialog__actions">
            <button
              type="button"
              className="toolbar-button"
              onClick={() => exportMmd(currentCode, `${currentDocumentName}.mmd`)}
            >
              先下載目前 .mmd
            </button>
            <div className="dialog__actions-end">
              <button type="button" className="toolbar-button" onClick={onCancel}>
                取消
              </button>
              <button type="button" className="toolbar-button toolbar-button--primary" onClick={onConfirm}>
                確定取代
              </button>
            </div>
          </div>
        </>
      )}
    </Dialog>
  )
}
