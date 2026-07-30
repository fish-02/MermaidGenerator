import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearPersistedModel } from '../store/persistence'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('未預期的錯誤：', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetData = () => {
    clearPersistedModel()
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="app-crash">
        <div className="app-crash__card">
          <h1 className="app-crash__title">畫面發生未預期的錯誤</h1>
          <p className="app-crash__message">
            很抱歉，MermaidGenerator 遇到問題無法繼續顯示。可以先嘗試重新整理；如果重新整理後仍然發生，可能是暫存的圖表資料造成的，可以改用下方按鈕清除本機暫存後重新開始（會遺失目前未匯出的圖表）。
          </p>
          <p className="app-crash__detail">{this.state.error.message}</p>
          <div className="app-crash__actions">
            <button type="button" onClick={this.handleReload}>
              重新整理
            </button>
            <button type="button" onClick={this.handleResetData}>
              清除本機暫存並重新開始
            </button>
          </div>
        </div>
      </div>
    )
  }
}
