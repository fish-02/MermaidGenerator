import { useUiStore, type ThemePreference, type Density } from '../store/uiStore'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '系統' },
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
]

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: '舒適' },
  { value: 'compact', label: '緊湊' },
]

/** Temporary placement for P0 verification — relocates into the toolbar's 更多選單 in P1. */
export function ThemeDensityToggle() {
  const theme = useUiStore((state) => state.theme)
  const density = useUiStore((state) => state.density)
  const setTheme = useUiStore((state) => state.setTheme)
  const setDensity = useUiStore((state) => state.setDensity)

  return (
    <div className="theme-density-toggle" role="group" aria-label="外觀設定">
      <div className="theme-density-toggle__group" role="radiogroup" aria-label="主題">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            className="theme-density-toggle__button"
            data-active={theme === option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="theme-density-toggle__group" role="radiogroup" aria-label="密度">
        {DENSITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={density === option.value}
            className="theme-density-toggle__button"
            data-active={density === option.value}
            onClick={() => setDensity(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
