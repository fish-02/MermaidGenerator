import { useEffect, useState } from 'react'
import { renderMermaidToSvg } from './render'

export interface PreviewRenderResult {
  svg: string
  error: string | null
}

export function usePreviewRender(code: string): PreviewRenderResult {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    renderMermaidToSvg(code)
      .then((result) => {
        if (cancelled) return
        setSvg(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [code])

  return { svg, error }
}
