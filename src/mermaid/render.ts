import mermaid from 'mermaid'

let initialized = false
let renderCounter = 0

function ensureInitialized() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })
  initialized = true
}

export async function renderMermaidToSvg(code: string): Promise<string> {
  ensureInitialized()
  renderCounter += 1
  const { svg } = await mermaid.render(`mermaid-render-${renderCounter}`, code)
  return svg
}
