import { useEffect } from 'react'

import { Button } from '@/renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirm_label: string
  cancel_label?: string
  confirm_disabled?: boolean
  on_confirm: () => Promise<void>
  on_cancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirm_label,
  cancel_label = 'キャンセル',
  confirm_disabled = false,
  on_confirm,
  on_cancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (open === false) {
      return
    }

    const handle_keydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && confirm_disabled === false) {
        on_cancel()
      }
    }

    window.addEventListener('keydown', handle_keydown)
    return () => {
      window.removeEventListener('keydown', handle_keydown)
    }
  }, [confirm_disabled, on_cancel, open])

  if (open === false) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-md"
        role="alertdialog"
      >
        <Card className="border-border/90 bg-card shadow-xl">
          <CardHeader>
            <CardTitle id="confirm-dialog-title">{title}</CardTitle>
            <CardDescription id="confirm-dialog-description">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0" />
          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={confirm_disabled}
              onClick={on_cancel}
              type="button"
              variant="secondary"
            >
              {cancel_label}
            </Button>
            <Button
              disabled={confirm_disabled}
              onClick={() => {
                void on_confirm()
              }}
              type="button"
              variant="destructive"
            >
              {confirm_label}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
