import type { ReactNode } from 'react'
import type { ViewMode } from '../lib/useViewMode'

export type { ViewMode }

/**
 * Pemilih tampilan. Diberi label jelas ("Tampilan") karena ikon/istilah
 * tanpa label membingungkan pengguna yang tidak terbiasa aplikasi.
 * Urutan: Tabel dulu (default), lalu Kartu.
 */
export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { id: ViewMode; label: string }[] = [
    { id: 'tabel', label: 'Tabel' },
    { id: 'kartu', label: 'Kartu' },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-slate-700">Tampilan:</span>
      <div
        className="flex shrink-0 gap-1 rounded-full border-2 border-slate-300 bg-slate-100 p-1"
        role="group"
        aria-label="Pilih tampilan data"
      >
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`min-h-10 rounded-full px-4 text-sm font-bold tracking-tight transition-colors ${
              value === o.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-200 active:bg-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Wadah tabel. Menampilkan petunjuk geser karena di HP tabel lebar
 * harus digeser ke samping — hal yang sering tidak disadari pengguna.
 */
export function Tabel({ children, hint = true }: { children: ReactNode; hint?: boolean }) {
  return (
    <div className="space-y-2">
      {hint && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 sm:hidden">
          <span aria-hidden="true">👉</span>
          Geser tabel ke kiri/kanan untuk melihat kolom lainnya.
        </p>
      )}
      <div className="scroll-shadow overflow-x-auto rounded-3xl border-2 border-slate-300 bg-white shadow-sm">
        <table className="w-full text-base">{children}</table>
      </div>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-slate-900 text-left text-white">{children}</tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white ${className}`}
    >
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
    <td
      colSpan={colSpan}
      className={`whitespace-nowrap border-t-2 border-slate-100 px-4 py-3.5 text-base font-semibold text-slate-800 ${className}`}
    >
      {children}
    </td>
  )
}

/**
 * Baris "label: nilai" untuk tampilan kartu di HP.
 * Lebih mudah dibaca daripada tabel bergeser.
 */
export function DataRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: ReactNode
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span
        className={`text-right ${
          strong ? 'text-lg font-extrabold text-slate-900' : 'text-base font-bold text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
