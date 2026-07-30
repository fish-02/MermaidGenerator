import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { NodeShape } from '../../types/graph'
import { useGraphStore } from '../../store/graphStore'

export type ShapeNodeData = {
  label: string
  shape: NodeShape
  color?: string
}

export type ShapeNodeType = Node<ShapeNodeData, 'shapeNode'>

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left]

function diamondBackgroundImage(fill: string, stroke: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><polygon points='50,3 97,50 50,97 3,50' fill='${fill}' stroke='${stroke}' stroke-width='2.5'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function ShapeNode({ id, data, selected }: NodeProps<ShapeNodeType>) {
  const updateNodeLabel = useGraphStore((state) => state.updateNodeLabel)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== data.label) {
      updateNodeLabel(id, trimmed)
    } else {
      setDraft(data.label)
    }
  }

  const colorStyle: CSSProperties = data.color
    ? data.shape === 'diamond'
      ? { backgroundImage: diamondBackgroundImage(data.color, selected ? '#6a4cff' : '#b9b9c2') }
      : { backgroundColor: data.color }
    : {}

  return (
    <div
      className={`shape-node shape-node--${data.shape}${selected ? ' shape-node--selected' : ''}`}
      style={colorStyle}
      onDoubleClick={() => {
        setDraft(data.label)
        setEditing(true)
      }}
    >
      {HANDLE_POSITIONS.map((position) => (
        <Fragment key={position}>
          <Handle id={`target-${position}`} type="target" position={position} className="shape-node__handle" />
          <Handle id={`source-${position}`} type="source" position={position} className="shape-node__handle" />
        </Fragment>
      ))}

      <div className="shape-node__body">
        {editing ? (
          <input
            ref={inputRef}
            className="shape-node__input nodrag"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') {
                setDraft(data.label)
                setEditing(false)
              }
            }}
          />
        ) : (
          <span className="shape-node__label">{data.label}</span>
        )}
      </div>
    </div>
  )
}
