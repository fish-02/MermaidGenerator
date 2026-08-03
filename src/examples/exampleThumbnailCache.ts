import { renderMermaidToSvg } from '../mermaid/render'

const cache = new Map<string, Promise<string>>()

/** Renders (and memoizes) an example's SVG thumbnail so re-opening the gallery is instant. */
export function getExampleThumbnail(id: string, code: string): Promise<string> {
  let promise = cache.get(id)
  if (!promise) {
    promise = renderMermaidToSvg(code)
    cache.set(id, promise)
  }
  return promise
}
