import type { ReactNode } from 'react'

export type ViewMode = 'kartu' | 'tabel'

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { id: ViewMode; label: string }[] = [
    { id: 'tabel', label: 'Tabel' },
    { id: 'kartu', label: 'Kartu' },
  ]
  return (
    <div className="flex shrink-0 gap-1 rounded-full bg-slate-200/80 p-1 border border-slate-300/60 shadow-2xs">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3.5 py-1 text-xs font-bold tracking-tight transition-all ${
            value === o.id
              ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 active:bg-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Tabel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200/90 bg-white shadow-xs">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200 bg-neutral-900 text-left text-white">{children}</tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300 ${className}`}>
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className={`whitespace-nowrap border-t border-neutral-100 px-4 py-3 text-neutral-800 ${className}`}>
      {children}
    </td>
  )
}
