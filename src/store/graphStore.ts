import { create } from 'zustand'
import { temporal } from 'zundo'
import { v4 as uuidv4 } from 'uuid'
import type { GraphModel, NodeShape } from '../types/graph'
import { sampleGraphModel } from './sampleGraph'
import { loadPersistedModel, schedulePersist } from './persistence'

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
  setModel: (model: GraphModel) => void
  addNode: (shape: NodeShape, position: { x: number; y: number }) => string
  updateNodeLabel: (id: string, label: string) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  applyNodePositions: (updates: { id: string; position: { x: number; y: number } }[]) => void
  updateNodeColor: (id: string, color: string | undefined) => void
  updateNodesColor: (ids: string[], color: string | undefined) => void
  removeNode: (id: string) => void
  removeNodes: (ids: string[]) => void
  duplicateNode: (id: string) => string | undefined
  addEdge: (source: string, target: string) => void
  removeEdge: (id: string) => void
  groupNodes: (nodeIds: string[]) => string
  ungroupSubgraph: (subgraphId: string) => void
  updateSubgraphLabel: (id: string, label: string) => void
}

function dropEmptySubgraphs(model: GraphModel): GraphModel {
  const usedIds = new Set(model.nodes.map((node) => node.subgraphId).filter(Boolean))
  return { ...model, subgraphs: model.subgraphs.filter((sg) => usedIds.has(sg.id)) }
}

export const useGraphStore = create<GraphStore>()(
  temporal(
    (set, get) => ({
      model: loadPersistedModel() ?? sampleGraphModel,

      setModel: (model) => set({ model }),

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
    }),
    {
      partialize: (state) => ({ model: state.model }),
      limit: 50,
    },
  ),
)

let lastPersistedModel: GraphModel | null = null
useGraphStore.subscribe((state) => {
  if (state.model === lastPersistedModel) return
  lastPersistedModel = state.model
  schedulePersist(state.model)
})
