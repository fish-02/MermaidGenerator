import { useRef } from 'react'
import { useDismissableMenu } from '../hooks/useDismissableMenu'
import { NewDocumentIcon, ChevronDownIcon } from './icons'

interface NewDocumentMenuProps {
  onCreateBlank: () => void
  onOpenExamples: () => void
  onOpenPaste: () => void
}

export function NewDocumentMenu({ onCreateBlank, onOpenExamples, onOpenPaste }: NewDocumentMenuProps) {
  const { open, setOpen, ref: containerRef } = useDismissableMenu<HTMLDivElement>()
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Each item opens another modal dialog once this menu closes. Reclaiming focus on the trigger
  // *before* that happens keeps it off the about-to-unmount menu item, so the browser doesn't
  // fall back to <body> — which would otherwise become the dialog's (wrong) focus-restore target.
  const select = (action: () => void) => () => {
    triggerRef.current?.focus()
    action()
    setOpen(false)
  }

  return (
    <div className="new-document-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="toolbar-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <NewDocumentIcon />
        <span>新建</span>
        <ChevronDownIcon width={12} height={12} />
      </button>
      {open && (
        <div className="new-document-menu__panel" role="menu">
          <button type="button" role="menuitem" className="export-menu__item" onClick={select(onCreateBlank)}>
            空白流程圖
          </button>
          <button type="button" role="menuitem" className="export-menu__item" onClick={select(onOpenExamples)}>
            從範例建立…
          </button>
          <button type="button" role="menuitem" className="export-menu__item" onClick={select(onOpenPaste)}>
            貼上 Mermaid 程式碼…
          </button>
        </div>
      )}
    </div>
  )
}
