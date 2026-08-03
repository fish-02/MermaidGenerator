import { create } from 'zustand'
import { temporal } from 'zundo'
import { v4 as uuidv4 } from 'uuid'
import { createEmptyGraphModel, type EdgeStyle, type FlowDirection, type GraphModel, type NodeShape } from '../types/graph'
import { DEFAULT_DOCUMENT_NAME, loadPersistedDocument, schedulePersist } from './persistence'

const MERMAID_ID_PATTERN = /^[A-Za-z0-9_]+$/

export interface RenameIdResult {
  ok: boolean
  reason?: string
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface DocumentSnapshot {
  model: GraphModel
  documentName: string
  rawSource: string | null
}

const SHAPE_DEFAULT_LABEL: Record<NodeShape, string> = {
  rectangle: '矩形',
  rounded: '圓角矩形',
  circle: '圓形',
  diamond: '判斷',
  stadium: '開始/結束',
  cylinder: '資料庫',
}

function shortId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').slice(0, 8)}`
}

interface GraphStore {
  model: GraphModel
  documentName: string
  /** Non-null when the current document's diagram type has no canvas representation (spec §11). */
  rawSource: string | null
  /** One-shot snapshot of the document that was just replaced, for the "undo new document" affordance (spec §9.3). */
  previousDocumentSnapshot: DocumentSnapshot | null
  saveStatus: SaveStatus
  setModel: (model: GraphModel) => void
  setDocumentName: (name: string) => void
  updateRawSource: (source: string) => void
  /** Replaces the current document wholesale (new/blank, example, import, paste), keeping a one-shot undo snapshot. */
  openDocument: (doc: { model: GraphModel; documentName: string; rawSource?: string | null }) => void
  /** Restores the document that was replaced by the last openDocument() call, if it hasn't been consumed yet. */
  restorePreviousDocument: () => boolean
  addNode: (shape: NodeShape, position: { x: number; y: number }) => string
  updateNodeLabel: (id: string, label: string) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  applyNodePositions: (updates: { id: string; position: { x: number; y: number } }[]) => void
  updateNodeColor: (id: string, color: string | undefined) => void
  updateNodesColor: (ids: string[], color: string | undefined) => void
  updateNodeShape: (id: string, shape: NodeShape) => void
  renameNodeId: (id: string, nextId: string) => RenameIdResult
  removeNode: (id: string) => void
  removeNodes: (ids: string[]) => void
  duplicateNode: (id: string) => string | undefined
  addEdge: (source: string, target: string) => void
  removeEdge: (id: string) => void
  removeEdges: (ids: string[]) => void
  updateEdgeLabel: (id: string, label: string) => void
  updateEdgeStyle: (id: string, style: EdgeStyle) => void
  updateEdgesStyle: (ids: string[], style: EdgeStyle) => void
  groupNodes: (nodeIds: string[]) => string
  ungroupSubgraph: (subgraphId: string) => void
  updateSubgraphLabel: (id: string, label: string) => void
  renameSubgraphId: (id: string, nextId: string) => RenameIdResult
  setDirection: (direction: FlowDirection) => void
}

function dropEmptySubgraphs(model: GraphModel): GraphModel {
  const usedIds = new Set(model.nodes.map((node) => node.subgraphId).filter(Boolean))
  return { ...model, subgraphs: model.subgraphs.filter((sg) => usedIds.has(sg.id)) }
}

const persistedDocument = loadPersistedDocument()
const initialModel = persistedDocument?.model ?? createEmptyGraphModel()

/** Model reference set by openDocument()/restorePreviousDocument(); used to tell a document-replace
 *  apart from a content edit so the one-shot "undo new document" snapshot clears at the right time.
 *  Must be updated *before* set() runs, since zustand notifies subscribers synchronously. */
let openedDocumentModelRef: GraphModel = initialModel

export const useGraphStore = create<GraphStore>()(
  temporal(
    (set, get) => ({
      model: initialModel,
      documentName: persistedDocument?.documentName ?? DEFAULT_DOCUMENT_NAME,
      rawSource: persistedDocument?.rawSource ?? null,
      previousDocumentSnapshot: null,
      saveStatus: 'idle',

      setModel: (model) => set({ model }),
      setDocumentName: (name) => set({ documentName: name.trim() || DEFAULT_DOCUMENT_NAME }),
      updateRawSource: (source) => set({ rawSource: source }),

      openDocument: ({ model, documentName, rawSource = null }) => {
        const state = get()
        const snapshot: DocumentSnapshot = {
          model: state.model,
          documentName: state.documentName,
          rawSource: state.rawSource,
        }
        openedDocumentModelRef = model
        set({ model, documentName, rawSource, previousDocumentSnapshot: snapshot })
      },

      restorePreviousDocument: () => {
        const snapshot = get().previousDocumentSnapshot
        if (!snapshot) return false
        openedDocumentModelRef = snapshot.model
        set({ model: snapshot.model, documentName: snapshot.documentName, rawSource: snapshot.rawSource, previousDocumentSnapshot: null })
        return true
      },

      addNode: (shape, position) => {
        const id = shortId('node')
        set((state) => ({
          model: {
            ...state.model,
            nodes: [...state.model.nodes, { id, label: SHAPE_DEFAULT_LABEL[shape], shape, position }],
          },
        }))
        return id
      },

      updateNodeLabel: (id, label) => {
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => (node.id === id ? { ...node, label } : node)),
          },
        }))
      },

      updateNodePosition: (id, position) => {
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => (node.id === id ? { ...node, position } : node)),
          },
        }))
      },

      applyNodePositions: (updates) => {
        const positionById = new Map(updates.map((update) => [update.id, update.position]))
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => {
              const position = positionById.get(node.id)
              return position ? { ...node, position } : node
            }),
          },
        }))
      },

      updateNodeColor: (id, color) => {
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => (node.id === id ? { ...node, color } : node)),
          },
        }))
      },

      updateNodesColor: (ids, color) => {
        const idSet = new Set(ids)
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => (idSet.has(node.id) ? { ...node, color } : node)),
          },
        }))
      },

      updateNodeShape: (id, shape) => {
        set((state) => ({
          model: {
            ...state.model,
            nodes: state.model.nodes.map((node) => (node.id === id ? { ...node, shape } : node)),
          },
        }))
      },

      renameNodeId: (id, nextId) => {
        const trimmed = nextId.trim()
        if (trimmed === id) return { ok: true }
        if (!MERMAID_ID_PATTERN.test(trimmed)) {
          return { ok: false, reason: 'ID 僅能使用英數字與底線' }
        }
        const state = get()
        const taken =
          state.model.nodes.some((node) => node.id === trimmed) ||
          state.model.subgraphs.some((sg) => sg.id === trimmed)
        if (taken) {
          return { ok: false, reason: `ID「${trimmed}」已被使用` }
        }
        set((current) => ({
          model: {
            ...current.model,
            nodes: current.model.nodes.map((node) => (node.id === id ? { ...node, id: trimmed } : node)),
            edges: current.model.edges.map((edge) => ({
              ...edge,
              source: edge.source === id ? trimmed : edge.source,
              target: edge.target === id ? trimmed : edge.target,
            })),
          },
        }))
        return { ok: true }
      },

      removeNode: (id) => {
        set((state) => ({
          model: dropEmptySubgraphs({
            ...state.model,
            nodes: state.model.nodes.filter((node) => node.id !== id),
            edges: state.model.edges.filter((edge) => edge.source !== id && edge.target !== id),
          }),
        }))
      },

      removeNodes: (ids) => {
        const idSet = new Set(ids)
        set((state) => ({
          model: dropEmptySubgraphs({
            ...state.model,
            nodes: state.model.nodes.filter((node) => !idSet.has(node.id)),
            edges: state.model.edges.filter((edge) => !idSet.has(edge.source) && !idSet.has(edge.target)),
          }),
        }))
      },

      duplicateNode: (id) => {
        const source = get().model.nodes.find((node) => node.id === id)
        if (!source) return undefined
        const newId = shortId('node')
        set((state) => ({
          model: {
            ...state.model,
            nodes: [
              ...state.model.nodes,
              {
                ...source,
                id: newId,
                position: { x: source.position.x + 30, y: source.position.y + 30 },
              },
            ],
          },
        }))
        return newId
      },

      addEdge: (source, target) => {
        const id = shortId('edge')
        set((state) => ({
          model: {
            ...state.model,
            edges: [...state.model.edges, { id, source, target, style: 'solid' }],
          },
        }))
      },

      removeEdge: (id) => {
        set((state) => ({
          model: {
            ...state.model,
            edges: state.model.edges.filter((edge) => edge.id !== id),
          },
        }))
      },

      removeEdges: (ids) => {
        const idSet = new Set(ids)
        set((state) => ({
          model: {
            ...state.model,
            edges: state.model.edges.filter((edge) => !idSet.has(edge.id)),
          },
        }))
      },

      updateEdgeLabel: (id, label) => {
        set((state) => ({
          model: {
            ...state.model,
            edges: state.model.edges.map((edge) => (edge.id === id ? { ...edge, label } : edge)),
          },
        }))
      },

      updateEdgeStyle: (id, style) => {
        set((state) => ({
          model: {
            ...state.model,
            edges: state.model.edges.map((edge) => (edge.id === id ? { ...edge, style } : edge)),
          },
        }))
      },

      updateEdgesStyle: (ids, style) => {
        const idSet = new Set(ids)
        set((state) => ({
          model: {
            ...state.model,
            edges: state.model.edges.map((edge) => (idSet.has(edge.id) ? { ...edge, style } : edge)),
          },
        }))
      },

      groupNodes: (nodeIds) => {
        const idSet = new Set(nodeIds)
        const subgraphId = shortId('sg')
        set((state) => {
          const label = `群組 ${state.model.subgraphs.length + 1}`
          const nextModel: GraphModel = {
            ...state.model,
            subgraphs: [...state.model.subgraphs, { id: subgraphId, label }],
            nodes: state.model.nodes.map((node) => (idSet.has(node.id) ? { ...node, subgraphId } : node)),
          }
          return { model: dropEmptySubgraphs(nextModel) }
        })
        return subgraphId
      },

      ungroupSubgraph: (subgraphId) => {
        set((state) => ({
          model: {
            ...state.model,
            subgraphs: state.model.subgraphs.filter((sg) => sg.id !== subgraphId),
            nodes: state.model.nodes.map((node) =>
              node.subgraphId === subgraphId ? { ...node, subgraphId: undefined } : node,
            ),
          },
        }))
      },

      updateSubgraphLabel: (id, label) => {
        set((state) => ({
          model: {
            ...state.model,
            subgraphs: state.model.subgraphs.map((sg) => (sg.id === id ? { ...sg, label } : sg)),
          },
        }))
      },

      renameSubgraphId: (id, nextId) => {
        const trimmed = nextId.trim()
        if (trimmed === id) return { ok: true }
        if (!MERMAID_ID_PATTERN.test(trimmed)) {
          return { ok: false, reason: 'ID 僅能使用英數字與底線' }
        }
        const state = get()
        const taken =
          state.model.subgraphs.some((sg) => sg.id === trimmed) ||
          state.model.nodes.some((node) => node.id === trimmed)
        if (taken) {
          return { ok: false, reason: `ID「${trimmed}」已被使用` }
        }
        set((current) => ({
          model: {
            ...current.model,
            subgraphs: current.model.subgraphs.map((sg) => (sg.id === id ? { ...sg, id: trimmed } : sg)),
            nodes: current.model.nodes.map((node) =>
              node.subgraphId === id ? { ...node, subgraphId: trimmed } : node,
            ),
          },
        }))
        return { ok: true }
      },

      setDirection: (direction) => {
        set((state) => ({ model: { ...state.model, direction } }))
      },
    }),
    {
      partialize: (state) => ({ model: state.model }),
      limit: 50,
    },
  ),
)

let lastPersistedModel: GraphModel | null = null
let lastPersistedName: string | null = null
let lastPersistedRawSource: string | null = null
useGraphStore.subscribe((state) => {
  // A model reference change that isn't the one openDocument()/restorePreviousDocument() just installed
  // means the (new) document has actually been edited — the one-shot "undo new document" offer expires.
  if (state.previousDocumentSnapshot && state.model !== openedDocumentModelRef) {
    useGraphStore.setState({ previousDocumentSnapshot: null })
    return
  }

  if (
    state.model === lastPersistedModel &&
    state.documentName === lastPersistedName &&
    state.rawSource === lastPersistedRawSource
  ) {
    return
  }
  lastPersistedModel = state.model
  lastPersistedName = state.documentName
  lastPersistedRawSource = state.rawSource
  useGraphStore.setState({ saveStatus: 'saving' })
  schedulePersist({ model: state.model, documentName: state.documentName, rawSource: state.rawSource }, (result) => {
    useGraphStore.setState({ saveStatus: result })
  })
})
