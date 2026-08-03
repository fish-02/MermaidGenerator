import type { ComponentType } from 'react'
import type { NodeShape } from '../types/graph'
import {
  ShapeCircleIcon,
  ShapeCylinderIcon,
  ShapeDiamondIcon,
  ShapeRectangleIcon,
  ShapeRoundedIcon,
  ShapeStadiumIcon,
  type IconProps,
} from '../components/icons'

export interface ShapeMeta {
  id: NodeShape
  label: string
  icon: ComponentType<IconProps>
  syntax: string
}

export const SHAPE_LIST: ShapeMeta[] = [
  { id: 'rectangle', label: '矩形', icon: ShapeRectangleIcon, syntax: 'A["文字"]' },
  { id: 'rounded', label: '圓角矩形', icon: ShapeRoundedIcon, syntax: 'A("文字")' },
  { id: 'circle', label: '圓形', icon: ShapeCircleIcon, syntax: 'A(("文字"))' },
  { id: 'diamond', label: '菱形（判斷）', icon: ShapeDiamondIcon, syntax: 'A{"文字"}' },
  { id: 'stadium', label: '膠囊形（開始／結束）', icon: ShapeStadiumIcon, syntax: 'A(["文字"])' },
  { id: 'cylinder', label: '資料庫圓柱', icon: ShapeCylinderIcon, syntax: 'A[("文字")]' },
]

export const SHAPE_META_BY_ID: Record<NodeShape, ShapeMeta> = Object.fromEntries(
  SHAPE_LIST.map((meta) => [meta.id, meta]),
) as Record<NodeShape, ShapeMeta>
