import { useSyncExternalStore } from 'react'
import { useUiStore } from '../store/uiStore'

const darkMediaQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribeToSystemTheme(callback: () => void): () => void {
  const mql = darkMediaQuery()
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeToSystemTheme,
    () => darkMediaQuery().matches,
    () => false,
  )
}

/** Resolves the 'system' theme preference against the live OS setting, for JS-driven theming (e.g. CodeMirror) that CSS variables can't reach. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useUiStore((state) => state.theme)
  const systemPrefersDark = useSystemPrefersDark()
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light'
  return theme
}
