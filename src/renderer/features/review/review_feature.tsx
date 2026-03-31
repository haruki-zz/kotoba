import { useCallback, useEffect, useState } from 'react'

import { ReviewPage } from '@/renderer/features/review/review_page'
import {
  IPC_CHANNELS,
  type IpcResponse,
  type ReviewGradeResult,
  type ReviewQueueResult,
  type ReviewQueueWordItem,
} from '@/shared/ipc'

export const ReviewFeature = () => {
  const [due_words, set_due_words] = useState<ReviewQueueWordItem[]>([])
  const [due_count, set_due_count] = useState<number>(0)
  const [completed_today_count, set_completed_today_count] = useState<number>(0)
  const [status_message, set_status_message] = useState<string>('')
  const [error_message, set_error_message] = useState<string>('')
  const [is_loading, set_is_loading] = useState<boolean>(false)
  const [grading_word_id, set_grading_word_id] = useState<string | null>(null)

  const load_review_queue = useCallback(async (): Promise<void> => {
    set_is_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.REVIEW_QUEUE
    )) as IpcResponse<ReviewQueueResult>

    set_is_loading(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_due_words(response.data.due_words)
    set_due_count(response.data.due_count)
    set_completed_today_count(response.data.completed_today_count)
    set_error_message('')
  }, [])

  useEffect(() => {
    set_status_message('')
    set_error_message('')
    void load_review_queue()
  }, [load_review_queue])

  const handle_review_grade = async (grade: number): Promise<void> => {
    const current_review_word = due_words[0]
    if (!current_review_word) {
      return
    }

    set_grading_word_id(current_review_word.id)
    set_status_message('')
    set_error_message('')

    const response = (await window.kotoba.invoke(IPC_CHANNELS.REVIEW_GRADE, {
      word_id: current_review_word.id,
      grade,
    })) as IpcResponse<ReviewGradeResult>

    set_grading_word_id(null)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_status_message(response.data.message_ja)
    await load_review_queue()
  }

  return (
    <ReviewPage
      completed_today_count={completed_today_count}
      current_review_word={due_words[0] ?? null}
      due_count={due_count}
      error_message={error_message}
      grading_word_id={grading_word_id}
      is_loading={is_loading}
      on_grade={handle_review_grade}
      status_message={status_message}
    />
  )
}
