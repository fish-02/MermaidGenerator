import { useSyncExternalStore } from 'react'

export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

function computeBreakpoint(width: number): Breakpoint {
  if (width >= 1200) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

/** Space-driven breakpoint (not device/orientation): desktop >=1200px, tablet 768-1199px, mobile <768px. */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(
    subscribe,
    () => computeBreakpoint(window.innerWidth),
    () => 'desktop',
  )
}

/** Below this width the header sheds secondary actions into the more-menu and truncates the filename. */
const NARROW_HEADER_WIDTH = 480

export function useNarrowHeader(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth < NARROW_HEADER_WIDTH,
    () => false,
  )
}
