export type ViewMode = 'kartu' | 'tabel'

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { id: ViewMode; label: string }[] = [
    { id: 'kartu', label: '▤ Kartu' },
    { id: 'tabel', label: '☷ Tabel' },
  ]
  return (
    <div className="flex shrink-0 gap-1 rounded-xl bg-slate-200 p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            value === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 active:bg-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-slate-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-slate-900 text-left text-white">{children}</tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-3 py-2 text-xs font-semibold ${className}`}>{children}</th>
}

export function Td({
  children,
  className = '',
  colSpan,
}: {
  children?: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className={`whitespace-nowrap px-3 py-2 border-t border-slate-100 ${className}`}>
      {children}
    </td>
  )
}
