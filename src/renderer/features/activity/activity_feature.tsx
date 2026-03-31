import { useCallback, useEffect, useState } from 'react'

import { ActivityPage } from '@/renderer/features/activity/activity_page'
import { IPC_CHANNELS, type ActivityHeatmapResult, type IpcResponse } from '@/shared/ipc'

export const ActivityFeature = () => {
  const [heatmap, set_heatmap] = useState<ActivityHeatmapResult | null>(null)
  const [error_message, set_error_message] = useState<string>('')
  const [is_loading, set_is_loading] = useState<boolean>(false)

  const load_activity_heatmap = useCallback(async (): Promise<void> => {
    set_is_loading(true)

    const response = (await window.kotoba.invoke(
      IPC_CHANNELS.ACTIVITY_HEATMAP
    )) as IpcResponse<ActivityHeatmapResult>

    set_is_loading(false)
    if (response.ok === false) {
      set_error_message(response.error.message)
      return
    }

    set_heatmap(response.data)
    set_error_message('')
  }, [])

  useEffect(() => {
    set_error_message('')
    void load_activity_heatmap()
  }, [load_activity_heatmap])

  return <ActivityPage error_message={error_message} heatmap={heatmap} is_loading={is_loading} />
}
