import { useMessage } from 'naive-ui'

/**
 * Prototype-only feedback for features that are not wired to the backend yet.
 */
export function useFeatureNotice() {
  const message = useMessage()

  return (text: string) => {
    message.info(text)
  }
}
