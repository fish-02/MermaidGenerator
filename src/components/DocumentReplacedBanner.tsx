interface DocumentReplacedBannerProps {
  onRestore: () => void
  onDismiss: () => void
}

export function DocumentReplacedBanner({ onRestore, onDismiss }: DocumentReplacedBannerProps) {
  return (
    <div className="notice-banner notice-banner--info" role="status">
      <span className="notice-banner__message">已建立新文件。</span>
      <button type="button" className="notice-banner__action" onClick={onRestore}>
        復原上一份文件
      </button>
      <button type="button" className="notice-banner__dismiss" onClick={onDismiss} aria-label="關閉提示">
        ✕
      </button>
    </div>
  )
}
