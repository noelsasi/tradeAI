import { IconCheck, IconClose } from '@/common/components/atoms/icons'
import { useToastStore } from '@/store/toast-store'

const KIND_STYLES = {
  success: { bg: '#0F1B2D', icon: IconCheck, iconColor: '#86EFAC' },
  error: { bg: '#7F1D1D', icon: IconClose, iconColor: '#FCA5A5' },
  info: { bg: '#1E3A5F', icon: IconCheck, iconColor: '#93C5FD' },
}

export function ToastRegion() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-[60]"
      style={{ pointerEvents: toasts.length ? 'auto' : 'none' }}
    >
      {toasts.map((toast) => {
        const { bg, icon: Icon, iconColor } = KIND_STYLES[toast.kind ?? 'success']
        return (
          <div
            key={toast.id}
            role="status"
            className="ta-fade flex items-center gap-3 rounded-xl font-semibold shadow-lg"
            style={{
              background: bg,
              color: '#fff',
              padding: '11px 14px',
              fontSize: 13.5,
              minWidth: 220,
              maxWidth: 360,
            }}
          >
            <span style={{ color: iconColor, display: 'flex' }}>
              <Icon size={16} strokeWidth={2.4} />
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex border-0 bg-transparent cursor-pointer p-0 ml-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              aria-label="Dismiss notification"
            >
              <IconClose size={14} strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
