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
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">
          {achieved.toLocaleString('id-ID')} / {target.toLocaleString('id-ID')} pasang
        </span>
        {target > 0 && (
          <span className={pct >= 100 ? 'font-bold text-emerald-700' : 'text-slate-500'}>
            {pct >= 100 ? '✓ LUNAS' : `sisa ${sisa.toLocaleString('id-ID')}`}
          </span>
        )}
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
