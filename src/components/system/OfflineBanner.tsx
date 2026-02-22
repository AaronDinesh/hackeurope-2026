import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-1/2 z-40 -translate-x-1/2 rounded-b-3xl bg-danger px-6 py-2 text-sm font-semibold text-white shadow-lg">
      You are offline. Changes will resume when connection returns.
    </div>
  )
}
