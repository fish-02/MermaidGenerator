import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { NodeShape } from '../../types/graph'
import { useGraphStore } from '../../store/graphStore'
import { useUiStore } from '../../store/uiStore'

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
  const pendingFocusNodeId = useUiStore((state) => state.pendingFocusNodeId)
  const pendingFocusEdit = useUiStore((state) => state.pendingFocusEdit)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    // A freshly-created node's input can still lose the focus race to React Flow's own internal
    // layout/viewport settling (e.g. right after addNode, before the pan/zoom that keeps the new
    // node in view has finished) — a single synchronous focus() call isn't reliably enough here,
    // so retry across a few animation frames until it actually sticks.
    let cancelled = false
    let attempts = 0
    const tryFocus = () => {
      if (cancelled) return
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.select()
      attempts += 1
      if (document.activeElement !== el && attempts < 10) {
        requestAnimationFrame(tryFocus)
      }
    }
    tryFocus()
    return () => {
      cancelled = true
    }
  }, [editing])

  // This node may mount several async hops after the store flag was set (React Flow syncs its
  // internal node store from the `nodes` prop via its own effect, so a freshly-created node's
  // component can mount well after the triggering render). Rather than race a separate "clearer"
  // against that unpredictable delay, this effect is the sole consumer: whenever it does fire and
  // finds itself the target, it acts and immediately clears the flag itself — no ordering assumed.
  useEffect(() => {
    if (pendingFocusEdit && pendingFocusNodeId === id) {
      setDraft(data.label)
      setEditing(true)
      useUiStore.getState().setPendingFocus(null, false)
    }
    // Only react to this node becoming the pending target; data.label changes shouldn't retrigger edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFocusNodeId, pendingFocusEdit, id])

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
