import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface DialogProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  className?: string
  children: ReactNode
}

export function Dialog({ open, onClose, ariaLabel, className, children }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, containerRef, onClose)

  if (!open) return null

  return (
    <div className="dialog-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={containerRef}
        className={`dialog${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  )
}
