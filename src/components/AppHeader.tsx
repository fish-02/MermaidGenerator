import { useRef } from 'react'

interface AppHeaderProps {
  onResetLayout: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onImportFile: (file: File) => void
}

export function AppHeader({ onResetLayout, onUndo, onRedo, canUndo, canRedo, onImportFile }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="app-header">
      <h1 className="app-header__title">MermaidGenerator</h1>
      <p className="app-header__subtitle">拖拉繪製流程圖，即時產生 Mermaid 程式碼</p>
      <div className="app-header__actions">
        <button type="button" className="app-header__icon-button" onClick={onUndo} disabled={!canUndo} title="復原（Ctrl+Z）">
          復原
        </button>
        <button
          type="button"
          className="app-header__icon-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做（Ctrl+Shift+Z）"
        >
          重做
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mmd,.json,text/plain,application/json"
          className="app-header__file-input"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImportFile(file)
            event.target.value = ''
          }}
        />
        <button type="button" className="app-header__icon-button" onClick={() => fileInputRef.current?.click()}>
          匯入
        </button>
        <button type="button" className="app-header__reset-button" onClick={onResetLayout}>
          重設版面
        </button>
      </div>
    </header>
  )
}
