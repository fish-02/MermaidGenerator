import { useCallback, useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { useGraphStore } from '../store/graphStore'
import { graphModelToMermaid } from '../serialize/modelToMermaid'
import { parseMermaidToModel, type ParseWarning } from '../parse/mermaidToModel'

const PARSE_DEBOUNCE_MS = 500

export function CodePanel() {
  const model = useGraphStore((state) => state.model)
  const [text, setText] = useState(() => graphModelToMermaid(model))
  const [warnings, setWarnings] = useState<ParseWarning[]>([])
  const [warningsExpanded, setWarningsExpanded] = useState(false)
  const lastEmittedCodeRef = useRef<string | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const nextCode = graphModelToMermaid(model)
    if (nextCode === lastEmittedCodeRef.current) return
    setText(nextCode)
    setWarnings([])
  }, [model])

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = useCallback((value: string) => {
    setText(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      const currentModel = useGraphStore.getState().model
      const { model: parsedModel, warnings: parseWarnings } = parseMermaidToModel(value, currentModel)
      lastEmittedCodeRef.current = graphModelToMermaid(parsedModel)
      setWarnings(parseWarnings)
      useGraphStore.getState().setModel(parsedModel)
    }, PARSE_DEBOUNCE_MS)
  }, [])

  return (
    <section className="panel code-panel">
      <h2 className="panel__title">Mermaid 程式碼</h2>
      <CodeMirror
        value={text}
        onChange={handleChange}
        style={{ flex: 1, overflow: 'auto', fontSize: 13 }}
        basicSetup={{ lineNumbers: true }}
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
