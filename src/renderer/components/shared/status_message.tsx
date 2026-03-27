import { Alert, AlertDescription, AlertTitle } from '@/renderer/components/ui/alert'

type StatusMessageKind = 'info' | 'success' | 'warning' | 'error'

type StatusMessageProps = {
  message: string
  kind?: StatusMessageKind
  title?: string
  role?: 'status' | 'alert'
}

const kind_to_variant = {
  info: 'default',
  success: 'success',
  warning: 'warning',
  error: 'destructive',
} as const

const kind_to_title = {
  info: 'お知らせ',
  success: '完了',
  warning: '確認',
  error: 'エラー',
} as const

export const StatusMessage = ({ message, kind = 'info', title, role }: StatusMessageProps) => (
  <Alert role={role ?? (kind === 'error' ? 'alert' : 'status')} variant={kind_to_variant[kind]}>
    <AlertTitle>{title ?? kind_to_title[kind]}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)
