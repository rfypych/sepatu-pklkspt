import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function BigButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-emerald-600 text-white active:bg-emerald-700 disabled:bg-slate-300',
    secondary: 'bg-sky-600 text-white active:bg-sky-700 disabled:bg-slate-300',
    danger: 'bg-rose-600 text-white active:bg-rose-700 disabled:bg-slate-300',
    ghost: 'bg-white text-slate-700 border border-slate-300 active:bg-slate-100',
  }
  return (
    <button
      className={`rounded-xl px-4 py-3 font-semibold text-base transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  color,
}: {
  children: ReactNode
  className?: string
  color?: 'default' | 'slate' | 'emerald'
}) {
  const colorClass =
    color === 'slate'
      ? 'bg-slate-900 text-white border-slate-900'
      : color === 'emerald'
        ? 'bg-emerald-600 text-white border-emerald-600'
        : 'bg-white text-slate-900 border-slate-200'
  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${colorClass} ${className}`}>
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-600 mb-1">{children}</label>
  )
}

export function TextInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
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
      className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Spinner({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-700 text-sm">
      {message}
    </div>
  )
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">
      {message}
    </div>
  )
}
