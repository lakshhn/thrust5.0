import { Wifi, WifiOff, Clock, Loader2 } from 'lucide-react'

/**
 * LiveStatusPill — connection state indicator
 * Four states: connecting, connected, reconnecting, stale
 * Uses both color AND icon (colorblind-safe)
 */
export default function LiveStatusPill({ status = 'connected', lastUpdated }) {
  const config = {
    connecting: {
      pillClass: 'live-pill-reconnecting',
      dotClass: 'live-dot live-dot-reconnect',
      Icon: Loader2,
      label: 'LOADING',
      ariaLabel: 'Connecting — fetching live data',
      spin: true,
    },
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

  const { pillClass, dotClass, Icon, label, ariaLabel, spin } = config[status] || config.connected

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
        <Icon size={11} strokeWidth={2.5} aria-hidden="true" className={spin ? 'animate-spin' : ''} />
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
