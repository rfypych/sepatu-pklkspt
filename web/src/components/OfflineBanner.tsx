import { useOfflineStatus } from '../lib/offline'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function OfflineBanner() {
  const { isOnline, queueCount, isSyncing, syncNow } = useOfflineStatus()

  if (isOnline && queueCount === 0) {
    return null
  }

  return (
    <aside
      aria-label="Status koneksi dan sinkronisasi"
      className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
        !isOnline
          ? 'border-amber-500 bg-amber-400 text-slate-950'
          : 'border-blue-400 bg-blue-50 text-blue-950'
      }`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="h-5 w-5 shrink-0 text-slate-950" />
              <span>
                <b>Sedang Offline:</b> Internet terputus. Data input tetap aman tersimpan di HP.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-700" />
              <span>
                Internet terhubung. Ada <b>{queueCount} data di HP</b> yang siap disinkronkan.
              </span>
            </>
          )}
        </div>

        {queueCount > 0 && isOnline && (
          <button
            onClick={() => void syncNow()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-blue-900 bg-blue-800 px-3.5 py-1.5 text-xs font-black text-white hover:bg-blue-900 active:bg-black disabled:bg-slate-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim Sekarang'}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
