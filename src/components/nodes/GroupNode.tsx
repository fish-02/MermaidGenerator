import { useEffect, useRef, useState } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { useGraphStore } from '../../store/graphStore'

export type GroupNodeData = {
  label: string
}

export type GroupNodeType = Node<GroupNodeData, 'groupNode'>

const DOUBLE_CLICK_WINDOW_MS = 400

export function GroupNode({ id, data }: NodeProps<GroupNodeType>) {
  const updateSubgraphLabel = useGraphStore((state) => state.updateSubgraphLabel)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastClickAtRef = useRef(0)

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
      updateSubgraphLabel(id, trimmed)
    } else {
      setDraft(data.label)
    }
  }

  const handleClick = () => {
    const now = Date.now()
    // React Flow's node wrapper stops native dblclick from bubbling to onDoubleClick,
    // so double-clicks are detected manually from two clicks within a short window.
    if (now - lastClickAtRef.current < DOUBLE_CLICK_WINDOW_MS) {
      setDraft(data.label)
      setEditing(true)
      lastClickAtRef.current = 0
    } else {
      lastClickAtRef.current = now
    }
  }

  return (
    <div className="group-node">
      <div className="group-node__label nodrag" onClick={handleClick}>
        {editing ? (
          <input
            ref={inputRef}
            className="group-node__input"
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
          data.label
        )}
      </div>
    </div>
  )
}
