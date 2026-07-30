import type { GraphModel } from '../types/graph'

export const sampleGraphModel: GraphModel = {
  direction: 'TD',
  nodes: [
    { id: 'start', label: '開始', shape: 'stadium', position: { x: 0, y: 0 } },
    { id: 'input', label: '輸入資料', shape: 'rectangle', position: { x: 0, y: 100 } },
    { id: 'decision', label: '資料是否正確？', shape: 'diamond', position: { x: 0, y: 200 } },
    { id: 'process', label: '處理資料', shape: 'rounded', position: { x: 0, y: 320 }, subgraphId: 'sg1' },
    { id: 'db', label: '寫入資料庫', shape: 'cylinder', position: { x: 0, y: 420 }, subgraphId: 'sg1' },
    { id: 'finish', label: '結束', shape: 'stadium', position: { x: 0, y: 540 } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'input', style: 'solid' },
    { id: 'e2', source: 'input', target: 'decision', style: 'solid' },
    { id: 'e3', source: 'decision', target: 'process', style: 'solid', label: '是' },
    { id: 'e4', source: 'decision', target: 'finish', style: 'dashed', label: '否' },
    { id: 'e5', source: 'process', target: 'db', style: 'solid' },
    { id: 'e6', source: 'db', target: 'finish', style: 'solid' },
  ],
  subgraphs: [{ id: 'sg1', label: '資料處理模組' }],
}
