import { formatAngka } from '../lib/constants'

export default function PoProgress({
  target,
  achieved,
}: {
  target: number
  achieved: number
}) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0
  const sisa = Math.max(0, target - achieved)
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tracking-tight text-neutral-800">
          {formatAngka(achieved)} / {formatAngka(target)} <span className="text-[11px] font-normal text-neutral-500">pasang</span>
        </span>
        {target > 0 && (
          <span className={pct >= 100 ? 'font-bold text-emerald-700' : 'text-neutral-500 font-medium'}>
            {pct >= 100 ? '✓ Target Tercapai' : `Sisa ${formatAngka(sisa)} psg`}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            pct >= 100 ? 'bg-emerald-600' : 'bg-neutral-900'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
