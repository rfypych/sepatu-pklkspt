import { formatAngka } from '../lib/constants'

/**
 * Progress PO. Dibuat besar & berwarna supaya jelas terlihat:
 * hijau = target sudah tercapai, biru = masih jalan, kuning = melebihi target.
 */
export default function PoProgress({
  target,
  achieved,
}: {
  target: number
  achieved: number
}) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0
  const sisa = Math.max(0, target - achieved)
  const selesai = target > 0 && achieved >= target

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-base font-extrabold tracking-tight text-slate-900">
          {formatAngka(achieved)} / {formatAngka(target)}
          <span className="ml-1 text-sm font-semibold text-slate-600">pasang</span>
        </span>
        {target > 0 && (
          <span
            className={`rounded-full border-2 px-2.5 py-0.5 text-sm font-bold ${
              selesai
                ? 'border-emerald-400 bg-emerald-100 text-emerald-900'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
          >
            {selesai ? '✓ Target tercapai' : `Sisa ${formatAngka(sisa)} pasang`}
          </span>
        )}
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full border-2 border-slate-300 bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress PO"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            selesai ? 'bg-emerald-600' : 'bg-blue-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {target > 0 && (
        <div className="text-sm font-bold text-slate-600">{pct}% dari target selesai</div>
      )}
    </div>
  )
}
