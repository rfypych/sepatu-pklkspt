import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function BigButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'blue' | 'dark' | 'danger' | 'ghost' | 'pill'
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md border border-emerald-700',
    secondary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md border border-blue-700',
    blue:
      'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md border border-sky-700',
    dark:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-black disabled:bg-slate-200 disabled:text-slate-400 shadow-md border border-slate-950',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md border border-rose-700',
    ghost:
      'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-xs',
    pill:
      'bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 shadow-md border border-emerald-700',
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold tracking-tight transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  color = 'default',
}: {
  children: ReactNode
  className?: string
  color?: 'default' | 'dark' | 'slate' | 'emerald' | 'blue' | 'amber' | 'subtle'
}) {
  const colorClass =
    color === 'dark' || color === 'slate'
      ? 'bg-slate-900 text-white border-slate-800 shadow-lg'
      : color === 'emerald'
        ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
        : color === 'blue'
          ? 'bg-blue-700 text-white border-blue-800 shadow-md'
          : color === 'amber'
            ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-xs'
            : color === 'subtle'
              ? 'bg-slate-100 text-slate-900 border-slate-200'
              : 'bg-white text-slate-900 border-2 border-slate-200/90 shadow-sm'

  return (
    <div className={`rounded-2xl border p-4 transition-all ${colorClass} ${className}`}>
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-slate-800 tracking-tight">
      {children}
    </label>
  )
}

export function TextInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-colors ${className}`}
      {...props}
    />
  )
}

export function SelectInput({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Spinner({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
      <span className="text-sm font-bold tracking-tight text-slate-700">{label}</span>
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900 shadow-xs">
      <span className="shrink-0 text-xl">⚠️</span>
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  )
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 shadow-xs">
      <span className="shrink-0 text-xl">✅</span>
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  )
}

export function PillBadge({
  children,
  color = 'neutral',
  className = '',
}: {
  children: ReactNode
  color?: 'neutral' | 'emerald' | 'blue' | 'amber' | 'rose' | 'dark'
  className?: string
}) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-800 border-slate-300',
    emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    blue: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    amber: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
    rose: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    dark: 'bg-slate-900 text-white border-slate-950 font-bold',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-tight ${styles[color]} ${className}`}
    >
      {children}
    </span>
  )
}

// ---------------- SKELETON LOADERS ----------------
export function Skeleton({
  className = '',
  rounded = 'rounded-xl',
}: {
  className?: string
  rounded?: string
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${rounded} ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
  className = '',
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="border-b border-slate-200 bg-slate-50/80 p-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 p-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4.5 flex-1 ${c === 0 ? 'w-1/3' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function InlineLoadingBadge({ label = 'Menyinkronkan...' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 animate-pulse">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
      {label}
    </span>
  )
}

