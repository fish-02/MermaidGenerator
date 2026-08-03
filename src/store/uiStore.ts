import { create } from 'zustand'
import type { NodeShape } from '../types/graph'

export type ThemePreference = 'system' | 'light' | 'dark'
export type Density = 'comfortable' | 'compact'
export type MotionPreference = 'system' | 'reduced'
export type WorkspaceMode = 'canvas' | 'code' | 'compare'
export type PaletteView = 'grid' | 'list'
export type MobileTab = 'canvas' | 'code' | 'preview'

const STORAGE_KEY = 'mermaidgenerator:ui'
const RECENT_SHAPES_LIMIT = 6
export const RAIL_WIDTH_MIN = 220
export const RAIL_WIDTH_MAX = 420
export const RAIL_SECTION_RATIO_MIN = 0.2
export const RAIL_SECTION_RATIO_MAX = 0.8
export const MOBILE_SHEET_HEIGHT_MIN = 160
export const MOBILE_SHEET_HEIGHT_MAX = 560

interface PersistedUiState {
  theme: ThemePreference
  density: Density
  motion: MotionPreference
  workspaceMode: WorkspaceMode
  leftRailCollapsed: boolean
  leftRailWidth: number
  leftRailSectionRatio: number
  createSectionCollapsed: boolean
  propertiesSectionCollapsed: boolean
  paletteView: PaletteView
  recentShapes: NodeShape[]
  mobileTab: MobileTab
  mobileSheetHeight: number
  onboardingDismissed: boolean
}

const DEFAULT_UI_STATE: PersistedUiState = {
  theme: 'system',
  density: 'comfortable',
  motion: 'system',
  workspaceMode: 'canvas',
  leftRailCollapsed: false,
  leftRailWidth: 280,
  leftRailSectionRatio: 0.45,
  createSectionCollapsed: false,
  propertiesSectionCollapsed: false,
  paletteView: 'grid',
  recentShapes: [],
  mobileTab: 'canvas',
  mobileSheetHeight: 320,
  onboardingDismissed: false,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function loadPersistedUiState(): PersistedUiState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UI_STATE
    const parsed = JSON.parse(raw) as Partial<PersistedUiState>
    return { ...DEFAULT_UI_STATE, ...parsed }
  } catch {
    return DEFAULT_UI_STATE
  }
}

function persist(state: PersistedUiState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded); silently skip.
  }
}

function applyThemeAttributes(theme: ThemePreference, density: Density, motion: MotionPreference): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-density', density)
  if (motion === 'reduced') root.setAttribute('data-motion', 'reduced')
  else root.removeAttribute('data-motion')
}

interface UiStore extends PersistedUiState {
  commandPaletteOpen: boolean
  pendingFocusNodeId: string | null
  pendingFocusEdit: boolean
  pendingSelectSubgraphId: string | null
  railOverlayOpen: boolean
  setTheme: (theme: ThemePreference) => void
  setDensity: (density: Density) => void
  setMotion: (motion: MotionPreference) => void
  setWorkspaceMode: (mode: WorkspaceMode) => void
  setCommandPaletteOpen: (open: boolean) => void
  setLeftRailCollapsed: (collapsed: boolean) => void
  setLeftRailWidth: (width: number) => void
  setLeftRailSectionRatio: (ratio: number) => void
  setCreateSectionCollapsed: (collapsed: boolean) => void
  setPropertiesSectionCollapsed: (collapsed: boolean) => void
  setPaletteView: (view: PaletteView) => void
  pushRecentShape: (shape: NodeShape) => void
  setPendingFocus: (id: string | null, edit?: boolean) => void
  setPendingSelectSubgraphId: (id: string | null) => void
  setMobileTab: (tab: MobileTab) => void
  setMobileSheetHeight: (height: number) => void
  setRailOverlayOpen: (open: boolean) => void
  setOnboardingDismissed: (dismissed: boolean) => void
}

const initial = loadPersistedUiState()
applyThemeAttributes(initial.theme, initial.density, initial.motion)

function extractPersisted(state: PersistedUiState): PersistedUiState {
  const {
    theme,
    density,
    motion,
    workspaceMode,
    leftRailCollapsed,
    leftRailWidth,
    leftRailSectionRatio,
    createSectionCollapsed,
    propertiesSectionCollapsed,
    paletteView,
    recentShapes,
    mobileTab,
    mobileSheetHeight,
    onboardingDismissed,
  } = state
  return {
    theme,
    density,
    motion,
    workspaceMode,
    leftRailCollapsed,
    leftRailWidth,
    leftRailSectionRatio,
    createSectionCollapsed,
    propertiesSectionCollapsed,
    paletteView,
    recentShapes,
    mobileTab,
    mobileSheetHeight,
    onboardingDismissed,
  }
}

export const useUiStore = create<UiStore>()((set, get) => ({
  ...initial,
  commandPaletteOpen: false,
  pendingFocusNodeId: null,
  pendingFocusEdit: false,
  pendingSelectSubgraphId: null,
  railOverlayOpen: false,

  setTheme: (theme) => {
    set({ theme })
    applyThemeAttributes(theme, get().density, get().motion)
    persist(extractPersisted(get()))
  },

  setDensity: (density) => {
    set({ density })
    applyThemeAttributes(get().theme, density, get().motion)
    persist(extractPersisted(get()))
  },

  setMotion: (motion) => {
    set({ motion })
    applyThemeAttributes(get().theme, get().density, motion)
    persist(extractPersisted(get()))
  },

  setWorkspaceMode: (workspaceMode) => {
    set({ workspaceMode })
    persist(extractPersisted(get()))
  },

  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  setLeftRailCollapsed: (leftRailCollapsed) => {
    set({ leftRailCollapsed })
    persist(extractPersisted(get()))
  },

  setLeftRailWidth: (width) => {
    const leftRailWidth = clamp(Math.round(width), RAIL_WIDTH_MIN, RAIL_WIDTH_MAX)
    set({ leftRailWidth })
    persist(extractPersisted(get()))
  },

  setLeftRailSectionRatio: (ratio) => {
    const leftRailSectionRatio = clamp(ratio, RAIL_SECTION_RATIO_MIN, RAIL_SECTION_RATIO_MAX)
    set({ leftRailSectionRatio })
    persist(extractPersisted(get()))
  },

  setCreateSectionCollapsed: (createSectionCollapsed) => {
    set({ createSectionCollapsed })
    persist(extractPersisted(get()))
  },

  setPropertiesSectionCollapsed: (propertiesSectionCollapsed) => {
    set({ propertiesSectionCollapsed })
    persist(extractPersisted(get()))
  },

  setPaletteView: (paletteView) => {
    set({ paletteView })
    persist(extractPersisted(get()))
  },

  pushRecentShape: (shape) => {
    const next = [shape, ...get().recentShapes.filter((existing) => existing !== shape)].slice(
      0,
      RECENT_SHAPES_LIMIT,
    )
    set({ recentShapes: next })
    persist(extractPersisted(get()))
  },

  setPendingFocus: (pendingFocusNodeId, edit = false) => set({ pendingFocusNodeId, pendingFocusEdit: edit }),
  setPendingSelectSubgraphId: (pendingSelectSubgraphId) => set({ pendingSelectSubgraphId }),

  setMobileTab: (mobileTab) => {
    set({ mobileTab })
    persist(extractPersisted(get()))
  },

  setMobileSheetHeight: (height) => {
    const mobileSheetHeight = clamp(Math.round(height), MOBILE_SHEET_HEIGHT_MIN, MOBILE_SHEET_HEIGHT_MAX)
    set({ mobileSheetHeight })
    persist(extractPersisted(get()))
  },

  setRailOverlayOpen: (railOverlayOpen) => set({ railOverlayOpen }),

  setOnboardingDismissed: (onboardingDismissed) => {
    set({ onboardingDismissed })
    persist(extractPersisted(get()))
  },
}))
