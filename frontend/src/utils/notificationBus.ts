export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export type NotificationPayload = {
  id?: string
  title?: string
  message: string
  type?: NotificationType
  duration?: number
}

type Listener = (payload: NotificationPayload) => void

const listeners = new Set<Listener>()

export const notify = (payload: NotificationPayload) => {
  listeners.forEach((listener) => listener(payload))
}

export const subscribeNotifications = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const buildNotifier = (type: NotificationType) => (message: string, options: Omit<NotificationPayload, 'type' | 'message'> = {}) =>
  notify({ type, message, ...options })

export const notifySuccess = buildNotifier('success')
export const notifyError = buildNotifier('error')
export const notifyInfo = buildNotifier('info')
export const notifyWarning = buildNotifier('warning')
