const PNG_EXPORT_SCALE = 2

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function exportMmd(code: string, filename = 'diagram.mmd'): void {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function exportJson(json: string, filename = 'diagram.json'): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  triggerDownload(blob, filename)
}

function withBackground(svgText: string, background: string | null): string {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svgEl = doc.documentElement
  if (background) {
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', '0')
    rect.setAttribute('y', '0')
    rect.setAttribute('width', '100%')
    rect.setAttribute('height', '100%')
    rect.setAttribute('fill', background)
    svgEl.insertBefore(rect, svgEl.firstChild)
  }
  return new XMLSerializer().serializeToString(svgEl)
}

function parseSvgSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svgEl = doc.documentElement
  const viewBox = svgEl.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number)
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] }
    }
  }
  const width = Number.parseFloat(svgEl.getAttribute('width') ?? '')
  const height = Number.parseFloat(svgEl.getAttribute('height') ?? '')
  return { width: width || 800, height: height || 600 }
}

export function exportSvg(svgText: string, transparent: boolean, filename = 'diagram.svg'): void {
  const finalSvg = withBackground(svgText, transparent ? null : '#ffffff')
  const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' })
  triggerDownload(blob, filename)
}

export async function exportPng(svgText: string, transparent: boolean, filename = 'diagram.png'): Promise<void> {
  const finalSvg = withBackground(svgText, transparent ? null : '#ffffff')
  const { width, height } = parseSvgSize(finalSvg)

  // Mermaid SVGs use <foreignObject> for labels; loading them via a blob: URL taints
  // the canvas in Chromium. A data: URI does not, so it's used here instead.
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(finalSvg)}`

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('SVG 圖片載入失敗'))
    img.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * PNG_EXPORT_SCALE)
  canvas.height = Math.round(height * PNG_EXPORT_SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('無法建立畫布內容')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 匯出失敗')
  triggerDownload(blob, filename)
}
