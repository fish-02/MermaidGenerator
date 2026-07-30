import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Group, Panel, Separator, useDefaultLayout, useGroupRef } from 'react-resizable-panels'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { CanvasPanel } from './components/CanvasPanel'
import { CodePanel } from './components/CodePanel'
import { PreviewPanel } from './components/PreviewPanel'
import { NoticeBanner } from './components/NoticeBanner'
import { useGraphStore } from './store/graphStore'
import { importDiagramFile } from './import/importDiagram'

interface Notice {
  type: 'warning' | 'error'
  message: string
}

const LAYOUT_ID = 'mermaidgenerator-main-layout'
const DEFAULT_LAYOUT = { code: 25, canvas: 25, preview: 50 }

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, [contenteditable="true"], .cm-editor'))
}

function App() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    storage: window.localStorage,
  })
  const groupRef = useGroupRef()

  const resetLayout = useCallback(() => {
    groupRef.current?.setLayout(DEFAULT_LAYOUT)
    window.localStorage.removeItem(`react-resizable-panels:${LAYOUT_ID}`)
  }, [groupRef])

  const { undo, redo, pastStates, futureStates } = useStore(useGraphStore.temporal, (state) => state)
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

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

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const { model, warnings } = await importDiagramFile(file)
      useGraphStore.getState().setModel(model)
      if (warnings.length > 0) {
        setNotice({
          type: 'warning',
          message: `已匯入「${file.name}」，但有 ${warnings.length} 行無法解析，其餘內容已正常匯入：\n${warnings.join('\n')}`,
        })
      } else {
        setNotice(null)
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: `匯入「${file.name}」失敗：${err instanceof Error ? err.message : '未知錯誤'}`,
      })
    }
  }, [])

  return (
    <div className="app">
      <AppHeader
        onResetLayout={resetLayout}
        onUndo={() => undo()}
        onRedo={() => redo()}
        canUndo={canUndo}
        canRedo={canRedo}
        onImportFile={handleImportFile}
      />
      {notice && <NoticeBanner type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />}
      <Group
        orientation="horizontal"
        className="app-main"
        groupRef={groupRef}
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <Panel id="code" defaultSize={`${DEFAULT_LAYOUT.code}%`} minSize="15%" className="app-main__panel">
          <CodePanel />
        </Panel>
        <Separator className="app-main__separator" />
        <Panel id="canvas" defaultSize={`${DEFAULT_LAYOUT.canvas}%`} minSize="15%" className="app-main__panel">
          <CanvasPanel />
        </Panel>
        <Separator className="app-main__separator" />
        <Panel id="preview" defaultSize={`${DEFAULT_LAYOUT.preview}%`} minSize="20%" className="app-main__panel">
          <PreviewPanel />
        </Panel>
      </Group>
    </div>
  )
}

export default App
