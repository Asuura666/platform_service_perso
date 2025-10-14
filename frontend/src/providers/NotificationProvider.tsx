import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { subscribeNotifications, type NotificationPayload, type NotificationType } from '@/utils/notificationBus'

type Notification = Required<Pick<NotificationPayload, 'id' | 'message'>> &
  Omit<NotificationPayload, 'id'> & { type: NotificationType }

type NotificationContextValue = {
  push: (payload: NotificationPayload) => string
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

const iconByType: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timers = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    const timerId = timers.current[id]
    if (timerId) {
      window.clearTimeout(timerId)
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (payload: NotificationPayload) => {
      const id = payload.id ?? generateId()
      const type = payload.type ?? 'info'

      setNotifications((prev) => {
        const next = prev.filter((item) => item.id !== id)
        next.push({ ...payload, id, type, message: payload.message })
        return next
      })

      const duration = payload.duration ?? 4000
      if (duration > 0) {
        timers.current[id] = window.setTimeout(() => dismiss(id), duration)
      }

      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const unsubscribe = subscribeNotifications(push)
    return () => unsubscribe()
  }, [push])

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((timerId) => window.clearTimeout(timerId))
      timers.current = {}
    },
    [],
  )

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      push,
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const NotificationViewport = ({
  notifications,
  onDismiss,
}: {
  notifications: Notification[]
  onDismiss: (id: string) => void
}) => (
  <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end">
    <AnimatePresence>
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
)

const NotificationToast = ({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: (id: string) => void
}) => {
  const Icon = iconByType[notification.type]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border px-4 py-3 shadow-glow backdrop-blur',
        {
          'border-emerald-500/40 bg-emerald-600/15 text-emerald-100': notification.type === 'success',
          'border-sky-500/40 bg-sky-600/15 text-sky-100': notification.type === 'info',
          'border-amber-500/40 bg-amber-600/15 text-amber-100': notification.type === 'warning',
          'border-red-500/40 bg-red-600/15 text-red-100': notification.type === 'error',
        },
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          <Icon size={18} />
        </span>
        <div className="flex-1">
          {notification.title && <p className="text-sm font-semibold">{notification.title}</p>}
          <p className="text-sm leading-snug">{notification.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="rounded-full p-1 text-current transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Fermer la notification"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}
