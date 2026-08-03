import { useCallback, useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { useGraphStore } from '../store/graphStore'
import { graphModelToMermaid } from '../serialize/modelToMermaid'
import { parseMermaidToModel, type ParseWarning } from '../parse/mermaidToModel'
import { useResolvedTheme } from '../hooks/useResolvedTheme'

const PARSE_DEBOUNCE_MS = 500

export function CodePanel() {
  const model = useGraphStore((state) => state.model)
  const rawSource = useGraphStore((state) => state.rawSource)
  const isCodeOnly = rawSource !== null

  const [text, setText] = useState(() => rawSource ?? graphModelToMermaid(model))
  const [warnings, setWarnings] = useState<ParseWarning[]>([])
  const [warningsExpanded, setWarningsExpanded] = useState(false)
  const lastEmittedCodeRef = useRef<string | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const nextCode = isCodeOnly ? (rawSource ?? '') : graphModelToMermaid(model)
    if (nextCode === lastEmittedCodeRef.current) return
    setText(nextCode)
    setWarnings([])
  }, [model, rawSource, isCodeOnly])

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = useCallback((value: string) => {
    setText(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      // A code-only document (non-flowchart diagram type) has no canvas representation to parse
      // into — the raw text itself is the source of truth (spec §11).
      if (useGraphStore.getState().rawSource !== null) {
        lastEmittedCodeRef.current = value
        useGraphStore.getState().updateRawSource(value)
        return
      }
      const currentModel = useGraphStore.getState().model
      const { model: parsedModel, warnings: parseWarnings } = parseMermaidToModel(value, currentModel)
      lastEmittedCodeRef.current = graphModelToMermaid(parsedModel)
      setWarnings(parseWarnings)
      useGraphStore.getState().setModel(parsedModel)
    }, PARSE_DEBOUNCE_MS)
  }, [])

  const resolvedTheme = useResolvedTheme()

  return (
    <section className="panel code-panel">
      <h2 className="panel__title">Mermaid 程式碼</h2>
      {isCodeOnly && (
        <p className="code-panel__info">此文件的圖表類型目前僅支援程式碼編輯，變更會自動儲存。</p>
      )}
      <CodeMirror
        value={text}
        onChange={handleChange}
        style={{ flex: 1, overflow: 'auto', fontSize: 13 }}
        basicSetup={{ lineNumbers: true }}
        theme={resolvedTheme === 'dark' ? oneDark : 'light'}
      />
      {warnings.length > 0 && (
        <div className="code-panel__warnings">
          <button
            type="button"
            className="code-panel__warnings-toggle"
            onClick={() => setWarningsExpanded((expanded) => !expanded)}
          >
            ⚠ {warnings.length} 行無法解析（其餘正常同步）{warningsExpanded ? ' ▾' : ' ▸'}
          </button>
          {warningsExpanded && (
            <ul className="code-panel__warnings-list">
              {warnings.map((warning) => (
                <li key={`${warning.line}-${warning.text}`}>
                  第 {warning.line} 行：{warning.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
