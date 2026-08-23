import { useEffect, useState } from 'react'
import { simpanProduksiBatch, type SimpanBatchInput } from './api'

export interface OfflineBatchItem {
  offlineId: string
  timestamp: number
  tanggal: string
  shift: 1 | 2
  id_pekerja: number
  id_po: number | null
  nama_pekerja?: string
  nama_po?: string
  items: {
    id_sepatu: number
    nama_model?: string
    qtyPerUkuran: { id_ukuran: string; label_ukuran?: string; qty: number }[]
  }[]
}

const OFFLINE_QUEUE_KEY = 'siprodu_offline_queue'

export function getOfflineQueue(): OfflineBatchItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveOfflineQueue(queue: OfflineBatchItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new Event('offline-queue-updated'))
  } catch (err) {
    console.error('Gagal menyimpan offline queue:', err)
  }
}

export function addOfflineQueue(
  data: Omit<OfflineBatchItem, 'offlineId' | 'timestamp'>,
): OfflineBatchItem {
  const item: OfflineBatchItem = {
    ...data,
    offlineId: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  }
  const queue = getOfflineQueue()
  queue.push(item)
  saveOfflineQueue(queue)
  return item
}

export function removeOfflineQueue(offlineId: string): void {
  const queue = getOfflineQueue().filter((x) => x.offlineId !== offlineId)
  saveOfflineQueue(queue)
}

let isSyncingGlobal = false

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncingGlobal) return { synced: 0, failed: 0 }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  isSyncingGlobal = true
  window.dispatchEvent(new Event('offline-sync-start'))

  let synced = 0
  let failed = 0

  const remaining: OfflineBatchItem[] = []

  for (const item of queue) {
    try {
      const payload: SimpanBatchInput = {
        tanggal: item.tanggal,
        shift: item.shift,
        id_pekerja: item.id_pekerja,
        id_po: item.id_po,
        items: item.items.map((it) => ({
          id_sepatu: it.id_sepatu,
          qtyPerUkuran: it.qtyPerUkuran.map((d) => ({
            id_ukuran: String(d.id_ukuran),
            qty: Number(d.qty) || 0,
          })),
        })),
      }
      await simpanProduksiBatch(payload)
      synced++
    } catch (err) {
      console.warn(`Gagal menyinkronkan item offline ${item.offlineId}:`, err)
      remaining.push(item)
      failed++
    }
  }

  saveOfflineQueue(remaining)
  isSyncingGlobal = false
  window.dispatchEvent(new Event('offline-sync-end'))

  return { synced, failed }
}

// Auto-sync saat kembali online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void syncOfflineQueue()
  })
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [queueCount, setQueueCount] = useState(() => getOfflineQueue().length)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void syncOfflineQueue()
    }
    const handleOffline = () => setIsOnline(false)
    const handleQueueChange = () => setQueueCount(getOfflineQueue().length)
    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncEnd = () => {
      setIsSyncing(false)
      setQueueCount(getOfflineQueue().length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-queue-updated', handleQueueChange)
    window.addEventListener('offline-sync-start', handleSyncStart)
    window.addEventListener('offline-sync-end', handleSyncEnd)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-updated', handleQueueChange)
      window.removeEventListener('offline-sync-start', handleSyncStart)
      window.removeEventListener('offline-sync-end', handleSyncEnd)
    }
  }, [])

  return {
    isOnline,
    queueCount,
    isSyncing,
    syncNow: syncOfflineQueue,
  }
}
