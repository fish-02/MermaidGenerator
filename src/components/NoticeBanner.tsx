interface NoticeBannerProps {
  type: 'warning' | 'error'
  message: string
  onDismiss: () => void
}

export function NoticeBanner({ type, message, onDismiss }: NoticeBannerProps) {
  return (
    <div className={`notice-banner notice-banner--${type}`} role="alert">
      <span className="notice-banner__message">{message}</span>
      <button type="button" className="notice-banner__dismiss" onClick={onDismiss} aria-label="關閉提示">
        ✕
      </button>
    </div>
  )
}
