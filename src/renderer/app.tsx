import { useState } from 'react'
import './style.css'
import type { IpcResponse, PingResult } from '../shared/ipc'

const format_response = (response: IpcResponse): string => {
  return JSON.stringify(response, null, 2)
}

export const App = () => {
  const [last_response, set_last_response] = useState<string>('まだ呼び出していません。')

  const handle_ping_click = async (): Promise<void> => {
    const response = await window.kotoba.invoke('app:ping', {
      message: 'こんにちは'
    })

    set_last_response(format_response(response as IpcResponse<PingResult>))
  }

  const handle_blocked_click = async (): Promise<void> => {
    const response = await window.kotoba.invoke('app:not-allowed', {
      message: 'blocked'
    })

    set_last_response(format_response(response))
  }

  return (
    <main className="container">
      <h1>Kotoba MVP Shell</h1>
      <p>IPC のホワイトリストとパラメータ検証を確認できます。</p>
      <div className="button_row">
        <button type="button" onClick={handle_ping_click}>
          許可済み IPC を呼び出す
        </button>
        <button type="button" onClick={handle_blocked_click}>
          非許可 IPC を呼び出す
        </button>
      </div>
      <section>
        <h2>レスポンス</h2>
        <pre>{last_response}</pre>
      </section>
    </main>
  )
}
