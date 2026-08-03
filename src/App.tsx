import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from 'zustand'
import { Group, Panel, Separator, useDefaultLayout, useGroupRef } from 'react-resizable-panels'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { CanvasPanel } from './components/CanvasPanel'
import { CodePanel } from './components/CodePanel'
import { PreviewPanel } from './components/PreviewPanel'
import { NoticeBanner } from './components/NoticeBanner'
import { DocumentReplacedBanner } from './components/DocumentReplacedBanner'
import { ConfirmReplaceDialog, type PendingReplace } from './components/dialogs/ConfirmReplaceDialog'
import { ExampleGalleryDialog } from './components/dialogs/ExampleGalleryDialog'
import { PasteCodeDialog } from './components/dialogs/PasteCodeDialog'
import { OnboardingDialog } from './components/dialogs/OnboardingDialog'
import { useGraphStore } from './store/graphStore'
import { useUiStore } from './store/uiStore'
import { DEFAULT_DOCUMENT_NAME } from './store/persistence'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useFileDrop } from './hooks/useFileDrop'
import { importDiagramFile } from './import/importDiagram'
import { resolveMermaidSource } from './import/resolveMermaidSource'
import { graphModelToMermaid } from './serialize/modelToMermaid'
import { usePreviewRender } from './mermaid/usePreviewRender'
import { createEmptyGraphModel } from './types/graph'
import type { DiagramExample } from './examples/exampleLibrary'

interface Notice {
  type: 'warning' | 'error'
  message: string
}

const LAYOUT_ID = 'mermaidgenerator-main-layout'
const DEFAULT_LAYOUT = { code: 25, canvas: 40, preview: 35 }

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, [contenteditable="true"], .cm-editor'))
}

function App() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    storage: window.localStorage,
    onlySaveAfterUserInteractions: true,
  })
  const groupRef = useGroupRef()

  const workspaceMode = useUiStore((state) => state.workspaceMode)
  const mobileTab = useUiStore((state) => state.mobileTab)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  const resetLayout = useCallback(() => {
    groupRef.current?.setLayout(DEFAULT_LAYOUT)
    window.localStorage.removeItem(`react-resizable-panels:${LAYOUT_ID}`)
  }, [groupRef])

  const [previewExpandedInCanvasMode, setPreviewExpandedInCanvasMode] = useState(false)

  // Mode switching is applied as a CSS override (see `.app-main--mode-*` rules) rather than
  // by calling the Group's imperative setLayout(): react-resizable-panels' setLayout does not
  // apply the requested percentages verbatim once any panel would cross its minSize boundary —
  // it clamps that panel to minSize and dumps the remainder onto an unrelated panel instead of
  // proportionally rebalancing. CSS overrides sidestep that entirely, and leave the library's
  // own internal layout state (used for compare-mode drag persistence) completely undisturbed
  // while canvas/code mode are active.
  const modeClass =
    workspaceMode === 'canvas'
      ? `app-main--mode-canvas${previewExpandedInCanvasMode ? ' app-main--preview-expanded' : ''}`
      : workspaceMode === 'code'
        ? 'app-main--mode-code'
        : ''

  const { undo, redo, pastStates, futureStates } = useStore(useGraphStore.temporal, (state) => state)
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const model = useGraphStore((state) => state.model)
  const rawSource = useGraphStore((state) => state.rawSource)
  const documentName = useGraphStore((state) => state.documentName)
  const previousDocumentSnapshot = useGraphStore((state) => state.previousDocumentSnapshot)
  // rawSource is authoritative for documents whose diagram type has no canvas representation (spec §11).
  const code = useMemo(() => rawSource ?? graphModelToMermaid(model), [model, rawSource])
  const { svg, error: previewError } = usePreviewRender(code)
  const hasPreviewContent = rawSource !== null ? rawSource.trim().length > 0 : model.nodes.length > 0

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const [notice, setNotice] = useState<Notice | null>(null)

  // Single-document overwrite protection (spec §9.3): blank/example/import/paste never apply
  // directly — they stage a replacement and require explicit confirmation first.
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null)
  const [exampleGalleryOpen, setExampleGalleryOpen] = useState(false)
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const onboardingDismissed = useUiStore((state) => state.onboardingDismissed)
  const setOnboardingDismissed = useUiStore((state) => state.setOnboardingDismissed)

  const handleCreateBlank = useCallback(() => {
    setOnboardingDismissed(true)
    setPendingReplace({
      sourceLabel: '空白流程圖',
      documentName: DEFAULT_DOCUMENT_NAME,
      model: createEmptyGraphModel(),
      rawSource: null,
    })
  }, [setOnboardingDismissed])

  const handleOpenExamples = useCallback(() => {
    setOnboardingDismissed(true)
    setExampleGalleryOpen(true)
  }, [setOnboardingDismissed])

  const handleOpenPaste = useCallback(() => {
    setOnboardingDismissed(true)
    setPasteDialogOpen(true)
  }, [setOnboardingDismissed])

  const handleSelectExample = useCallback((example: DiagramExample) => {
    const resolved = resolveMermaidSource(example.code)
    setExampleGalleryOpen(false)
    setPendingReplace({
      sourceLabel: `範例：${example.title}`,
      documentName: example.title,
      model: resolved.model,
      rawSource: resolved.rawSource,
      warnings: resolved.warnings,
    })
  }, [])

  const handleSubmitPaste = useCallback((text: string) => {
    const resolved = resolveMermaidSource(text)
    setPasteDialogOpen(false)
    setPendingReplace({
      sourceLabel: '貼上的 Mermaid 程式碼',
      documentName: DEFAULT_DOCUMENT_NAME,
      model: resolved.model,
      rawSource: resolved.rawSource,
      warnings: resolved.warnings,
    })
  }, [])

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const { model, documentName, rawSource, warnings } = await importDiagramFile(file)
      setPendingReplace({ sourceLabel: `匯入「${file.name}」`, documentName, model, rawSource, warnings })
    } catch (err) {
      setNotice({
        type: 'error',
        message: `匯入「${file.name}」失敗：${err instanceof Error ? err.message : '未知錯誤'}`,
      })
    }
  }, [])

  useFileDrop(handleImportFile)

  const handleConfirmReplace = useCallback(() => {
    if (!pendingReplace) return
    useGraphStore.getState().openDocument({
      model: pendingReplace.model,
      documentName: pendingReplace.documentName,
      rawSource: pendingReplace.rawSource,
    })
    // A code-only diagram type has nothing to show on the canvas — jump straight to the code
    // view so the user isn't left staring at an empty canvas (spec §11 "自動切換到程式碼模式").
    if (pendingReplace.rawSource !== null) {
      useUiStore.getState().setWorkspaceMode('code')
      useUiStore.getState().setMobileTab('code')
    }
    if (pendingReplace.warnings && pendingReplace.warnings.length > 0) {
      setNotice({
        type: 'warning',
        message: `已套用「${pendingReplace.sourceLabel}」，但有 ${pendingReplace.warnings.length} 行無法解析，其餘內容已正常套用：\n${pendingReplace.warnings.join('\n')}`,
      })
    } else {
      setNotice(null)
    }
    setPendingReplace(null)
  }, [pendingReplace])

  return (
    <div className="app">
      <AppHeader
        onResetLayout={resetLayout}
        onUndo={() => undo()}
        onRedo={() => redo()}
        canUndo={canUndo}
        canRedo={canRedo}
        onImportFile={handleImportFile}
        onCreateBlank={handleCreateBlank}
        onOpenExamples={handleOpenExamples}
        onOpenPaste={handleOpenPaste}
        code={code}
        svg={svg}
        hasPreviewError={Boolean(previewError)}
      />
      {notice && <NoticeBanner type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}
      {previousDocumentSnapshot && (
        <DocumentReplacedBanner
          onRestore={() => useGraphStore.getState().restorePreviousDocument()}
          onDismiss={() => useGraphStore.setState({ previousDocumentSnapshot: null })}
        />
      )}
      {isDesktop ? (
        <Group
          orientation="horizontal"
          className={`app-main${modeClass ? ` ${modeClass}` : ''}`}
          groupRef={groupRef}
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
        >
          <Panel id="code" defaultSize={`${DEFAULT_LAYOUT.code}%`} minSize="15%" className="app-main__panel">
            <CodePanel />
          </Panel>
          <Separator className="app-main__separator" />
          <Panel id="canvas" defaultSize={`${DEFAULT_LAYOUT.canvas}%`} minSize="15%" className="app-main__panel">
            <CanvasPanel
              showPreviewToggle={workspaceMode === 'canvas'}
              previewExpanded={previewExpandedInCanvasMode}
              onTogglePreview={() => setPreviewExpandedInCanvasMode((value) => !value)}
            />
          </Panel>
          <Separator className="app-main__separator" />
          <Panel id="preview" defaultSize={`${DEFAULT_LAYOUT.preview}%`} minSize="20%" className="app-main__panel">
            <PreviewPanel svg={svg} error={previewError} hasContent={hasPreviewContent} />
          </Panel>
        </Group>
      ) : (
        // Tablet/mobile: a single active tab fills the space (spec §7) rather than squeezing all
        // three panels into a viewport too narrow to make them usable.
        <div className="app-main app-main--tabbed">
          <div className="app-main__panel app-main__panel--tabbed" hidden={mobileTab !== 'canvas'}>
            <CanvasPanel showPreviewToggle={false} previewExpanded={false} onTogglePreview={() => {}} />
          </div>
          <div className="app-main__panel app-main__panel--tabbed" hidden={mobileTab !== 'code'}>
            <CodePanel />
          </div>
          <div className="app-main__panel app-main__panel--tabbed" hidden={mobileTab !== 'preview'}>
            <PreviewPanel svg={svg} error={previewError} hasContent={hasPreviewContent} />
          </div>
        </div>
      )}
      <OnboardingDialog
        open={!onboardingDismissed}
        onCreateBlank={handleCreateBlank}
        onOpenExamples={handleOpenExamples}
        onOpenPaste={handleOpenPaste}
        onDismiss={() => setOnboardingDismissed(true)}
      />
      <ExampleGalleryDialog
        open={exampleGalleryOpen}
        onClose={() => setExampleGalleryOpen(false)}
        onSelect={handleSelectExample}
      />
      <PasteCodeDialog open={pasteDialogOpen} onClose={() => setPasteDialogOpen(false)} onSubmit={handleSubmitPaste} />
      <ConfirmReplaceDialog
        pending={pendingReplace}
        currentCode={code}
        currentDocumentName={documentName}
        onCancel={() => setPendingReplace(null)}
        onConfirm={handleConfirmReplace}
      />
    </div>
  )
}

export default App
