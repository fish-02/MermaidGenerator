import { useEffect } from 'react'

/** Lets a file be dropped anywhere on the window to trigger import (spec §11), without
 *  interfering with the shape-palette's internal drag-and-drop (which carries no File). */
export function useFileDrop(onDropFile: (file: File) => void): void {
  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
    const handleDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      event.preventDefault()
      onDropFile(file)
    }
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onDropFile])
}
