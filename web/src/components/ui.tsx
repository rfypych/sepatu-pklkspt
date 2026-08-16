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
