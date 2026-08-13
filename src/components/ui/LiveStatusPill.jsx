import { Wifi, WifiOff, Clock } from 'lucide-react'

/**
 * LiveStatusPill — connection state indicator
 * Operational signal, must be noticeable from a distance (Design Doc §5.4)
 * Three states: connected, reconnecting, stale
 * Uses both color AND icon (colorblind-safe, Design Doc §7)
 */
export default function LiveStatusPill({ status = 'connected', lastUpdated }) {
  const config = {
    connected: {
      pillClass: 'live-pill-connected',
      dotClass: 'live-dot live-dot-pulse',
      Icon: Wifi,
      label: 'LIVE',
      ariaLabel: 'Connected — receiving live updates',
    },
    reconnecting: {
      pillClass: 'live-pill-reconnecting',
      dotClass: 'live-dot live-dot-reconnect',
      Icon: WifiOff,
      label: 'RECONNECTING',
      ariaLabel: 'Reconnecting — attempting to restore live connection',
    },
    stale: {
      pillClass: 'live-pill-stale',
      dotClass: 'live-dot',
      Icon: Clock,
      label: 'STALE',
      ariaLabel: 'Connection lost — showing last known data',
    },
  }

  const { pillClass, dotClass, Icon, label, ariaLabel } = config[status] || config.connected

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date(lastUpdated))
    : null

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite" aria-label={ariaLabel}>
      {/* Status pill */}
      <div className={`live-pill ${pillClass}`}>
        <span className={dotClass} aria-hidden="true" />
        <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
        <span>{label}</span>
      </div>

      {/* Last updated timestamp */}
      {formattedTime && (
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-faint)' }}
          aria-label={`Last updated at ${formattedTime}`}
        >
          Updated {formattedTime}
        </span>
      )}
    </div>
  )
}
