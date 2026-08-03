import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function BrandIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7.2 7.3 10 16M16.8 7.3 14 16" />
    </svg>
  )
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 0 12h-1" />
    </svg>
  )
}

export function RedoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 7l5 5-5 5" />
      <path d="M20 12H10a6 6 0 0 0 0 12h1" />
    </svg>
  )
}

export function ImportIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  )
}

export function ExportIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15V3" />
      <path d="M7 8l5-5 5 5" />
      <path d="M4 21h16" />
    </svg>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function CanvasModeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <circle cx="16" cy="14" r="1.6" />
      <path d="M10.2 11l4.6 2" />
    </svg>
  )
}

export function CodeModeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 8l-4 4 4 4" />
      <path d="M15 8l4 4-4 4" />
    </svg>
  )
}

export function PreviewModeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

export function CompareModeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
    </svg>
  )
}

export function SaveOkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5l5 5L20 7" />
    </svg>
  )
}

export function SaveErrorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.2" fill="currentColor" />
    </svg>
  )
}

export function ShapeRectangleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="6" width="17" height="12" rx="0.5" />
    </svg>
  )
}

export function ShapeRoundedIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="6" width="17" height="12" rx="4" />
    </svg>
  )
}

export function ShapeCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  )
}

export function ShapeDiamondIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="12,3.5 20.5,12 12,20.5 3.5,12" />
    </svg>
  )
}

export function ShapeStadiumIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
    </svg>
  )
}

export function ShapeCylinderIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5v11c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5v-11Z" />
      <path d="M4 6.5C4 7.9 7.6 9 12 9s8-1.1 8-2.5" />
    </svg>
  )
}

export function GridViewIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  )
}

export function ListViewIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-5-5" />
    </svg>
  )
}

export function NewDocumentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M12 12v6M9 15h6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
