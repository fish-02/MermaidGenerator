import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useGraphStore } from '../store/graphStore'
import { useUiStore, type MobileTab, type WorkspaceMode } from '../store/uiStore'
import { useDismissableMenu } from '../hooks/useDismissableMenu'
import { useBreakpoint, useNarrowHeader } from '../hooks/useBreakpoint'
import { ExportMenu } from './ExportMenu'
import { NewDocumentMenu } from './NewDocumentMenu'
import {
  BrandIcon,
  UndoIcon,
  RedoIcon,
  ImportIcon,
  MoreIcon,
  CanvasModeIcon,
  CodeModeIcon,
  CompareModeIcon,
  PreviewModeIcon,
  SaveOkIcon,
  SaveErrorIcon,
} from './icons'

interface AppHeaderProps {
  onResetLayout: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onImportFile: (file: File) => void
  onCreateBlank: () => void
  onOpenExamples: () => void
  onOpenPaste: () => void
  code: string
  svg: string
  hasPreviewError: boolean
}

const MODE_OPTIONS: { value: WorkspaceMode; label: string; Icon: typeof CanvasModeIcon }[] = [
  { value: 'canvas', label: '畫布', Icon: CanvasModeIcon },
  { value: 'code', label: '程式碼', Icon: CodeModeIcon },
  { value: 'compare', label: '對照', Icon: CompareModeIcon },
]

const MOBILE_TAB_OPTIONS: { value: MobileTab; label: string; Icon: typeof CanvasModeIcon }[] = [
  { value: 'canvas', label: '畫布', Icon: CanvasModeIcon },
  { value: 'code', label: '程式碼', Icon: CodeModeIcon },
  { value: 'preview', label: '預覽', Icon: PreviewModeIcon },
]

function FilenameField() {
  const documentName = useGraphStore((state) => state.documentName)
  const setDocumentName = useGraphStore((state) => state.setDocumentName)
  const [draft, setDraft] = useState(documentName)
  const [editing, setEditing] = useState(false)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(documentName)
  }, [documentName, editing])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
      return
    }
    if (event.key === 'Escape') {
      cancelledRef.current = true
      event.currentTarget.blur()
    }
  }

  return (
    <input
      className="toolbar-filename"
      value={draft}
      onFocus={() => setEditing(true)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        setEditing(false)
        if (cancelledRef.current) {
          cancelledRef.current = false
          setDraft(documentName)
          return
        }
        setDocumentName(event.target.value)
      }}
      onKeyDown={handleKeyDown}
      aria-label="檔案名稱"
    />
  )
}

function SaveStatusLabel() {
  const status = useGraphStore((state) => state.saveStatus)
  if (status === 'idle') return null
  if (status === 'saving')
    return (
      <span className="toolbar-save-status">
        <span className="toolbar-save-status__text">儲存中…</span>
      </span>
    )
  if (status === 'error')
    return (
      <span className="toolbar-save-status toolbar-save-status--error">
        <SaveErrorIcon width={13} height={13} />
        <span className="toolbar-save-status__text">儲存失敗</span>
      </span>
    )
  return (
    <span className="toolbar-save-status toolbar-save-status--saved">
      <SaveOkIcon width={13} height={13} />
      <span className="toolbar-save-status__text">已儲存</span>
    </span>
  )
}

function ModeSwitcher() {
  const mode = useUiStore((state) => state.workspaceMode)
  const setWorkspaceMode = useUiStore((state) => state.setWorkspaceMode)

  return (
    <div className="mode-switcher" role="radiogroup" aria-label="工作模式">
      {MODE_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          className="mode-switcher__button"
          data-active={mode === value}
          onClick={() => setWorkspaceMode(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

function MobileTabBar() {
  const tab = useUiStore((state) => state.mobileTab)
  const setMobileTab = useUiStore((state) => state.setMobileTab)

  return (
    <div className="mode-switcher" role="tablist" aria-label="檢視頁籤">
      {MOBILE_TAB_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-label={label}
          className="mode-switcher__button"
          data-active={tab === value}
          onClick={() => setMobileTab(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

interface MoreMenuProps {
  onResetLayout: () => void
  compactActions?: {
    onUndo: () => void
    onRedo: () => void
    canUndo: boolean
    canRedo: boolean
    onImportClick: () => void
    onCreateBlank: () => void
    onOpenExamples: () => void
    onOpenPaste: () => void
  }
}

function MoreMenu({ onResetLayout, compactActions }: MoreMenuProps) {
  const { open, setOpen, ref } = useDismissableMenu<HTMLDivElement>()
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Some items (create/example/paste) open another modal dialog once this menu closes. Reclaiming
  // focus on the trigger *before* that happens keeps it off the about-to-unmount menu item, so the
  // browser doesn't fall back to <body> — which would otherwise become the dialog's focus-restore target.
  const select = (action: () => void) => () => {
    triggerRef.current?.focus()
    action()
    setOpen(false)
  }

  return (
    <div className="more-menu" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="toolbar-icon-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="更多選項"
        title="更多選項"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreIcon />
      </button>
      {open && (
        <div className="more-menu__panel" role="menu">
          {compactActions && (
            <>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                disabled={!compactActions.canUndo}
                onClick={select(compactActions.onUndo)}
              >
                復原
              </button>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                disabled={!compactActions.canRedo}
                onClick={select(compactActions.onRedo)}
              >
                重做
              </button>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                onClick={select(compactActions.onImportClick)}
              >
                匯入
              </button>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                onClick={select(compactActions.onCreateBlank)}
              >
                空白流程圖
              </button>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                onClick={select(compactActions.onOpenExamples)}
              >
                從範例建立…
              </button>
              <button
                type="button"
                role="menuitem"
                className="more-menu__item"
                onClick={select(compactActions.onOpenPaste)}
              >
                貼上 Mermaid 程式碼…
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            className="more-menu__item"
            onClick={() => {
              onResetLayout()
              setOpen(false)
            }}
          >
            重設版面
          </button>
        </div>
      )}
    </div>
  )
}

export function AppHeader({
  onResetLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImportFile,
  onCreateBlank,
  onOpenExamples,
  onOpenPaste,
  code,
  svg,
  hasPreviewError,
}: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const breakpoint = useBreakpoint()
  const narrow = useNarrowHeader()
  const isDesktop = breakpoint === 'desktop'

  return (
    <header className="app-header">
      <div className="app-header__identity">
        <BrandIcon className="app-header__brand-icon" width={22} height={22} />
        <FilenameField />
        <SaveStatusLabel />
      </div>

      {isDesktop ? <ModeSwitcher /> : <MobileTabBar />}

      <div className="app-header__actions">
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
        {!narrow && (
          <>
            <NewDocumentMenu onCreateBlank={onCreateBlank} onOpenExamples={onOpenExamples} onOpenPaste={onOpenPaste} />
            <button
              type="button"
              className="toolbar-icon-button"
              onClick={onUndo}
              disabled={!canUndo}
              title="復原（Ctrl+Z）"
              aria-label="復原"
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              className="toolbar-icon-button"
              onClick={onRedo}
              disabled={!canRedo}
              title="重做（Ctrl+Shift+Z）"
              aria-label="重做"
            >
              <RedoIcon />
            </button>
            <button type="button" className="toolbar-button" onClick={() => fileInputRef.current?.click()}>
              <ImportIcon />
              <span>匯入</span>
            </button>
          </>
        )}
        <ExportMenu code={code} svg={svg} hasError={hasPreviewError} />
        <MoreMenu
          onResetLayout={onResetLayout}
          compactActions={
            narrow
              ? {
                  onUndo,
                  onRedo,
                  canUndo,
                  canRedo,
                  onImportClick: () => fileInputRef.current?.click(),
                  onCreateBlank,
                  onOpenExamples,
                  onOpenPaste,
                }
              : undefined
          }
        />
      </div>
    </header>
  )
}
