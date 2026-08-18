import type { ButtonHTMLAttributes, ReactNode } from 'react'

// ---------------- M3 BUTTONS ----------------
export function BigButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tonal' | 'blue' | 'dark' | 'danger' | 'ghost' | 'pill'
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm border border-emerald-600/30',
    secondary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm border border-blue-600/30',
    tonal:
      'bg-emerald-100/90 text-emerald-950 hover:bg-emerald-200 active:bg-emerald-300 disabled:bg-slate-100 disabled:text-slate-400 border border-emerald-200/60',
    blue:
      'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm border border-sky-600/30',
    dark:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-black disabled:bg-slate-200 disabled:text-slate-400 shadow-sm border border-slate-900/40',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm border border-rose-600/30',
    ghost:
      'bg-white text-slate-800 border border-slate-300/80 hover:bg-slate-50 active:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-2xs',
    pill:
      'bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 shadow-sm border border-emerald-600/30',
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm sm:text-base font-black tracking-tight transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ---------------- M3 CARDS ----------------
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
      ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
      : color === 'emerald'
        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
        : color === 'blue'
          ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
          : color === 'amber'
            ? 'bg-amber-50 text-amber-950 border-amber-200/80 shadow-2xs'
            : color === 'subtle'
              ? 'bg-[#F0F4F9] text-slate-900 border-transparent'
              : 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'

  return (
    <div className={`rounded-3xl p-4.5 sm:p-5 transition-all ${colorClass} ${className}`}>
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
      {children}
    </label>
  )
}

// ---------------- M3 INPUTS ----------------
export function TextInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all ${className}`}
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
      className={`w-full rounded-2xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base font-bold text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all ${className}`}
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
    <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm font-bold text-rose-950 shadow-2xs">
      <span className="shrink-0 text-xl">⚠️</span>
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  )
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs sm:text-sm font-bold text-emerald-950 shadow-2xs">
      <span className="shrink-0 text-xl">✅</span>
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  )
}

// ---------------- M3 TONAL BADGES / CHIPS ----------------
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
    neutral: 'bg-slate-100 text-slate-800 border-slate-200/80',
    emerald: 'bg-emerald-100/90 text-emerald-900 border-emerald-200/80 font-bold',
    blue: 'bg-blue-100/90 text-blue-900 border-blue-200/80 font-bold',
    amber: 'bg-amber-100/90 text-amber-950 border-amber-200/80 font-bold',
    rose: 'bg-rose-100/90 text-rose-900 border-rose-200/80 font-bold',
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
  rounded = 'rounded-2xl',
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
    <div className={`rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
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
    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="border-b border-slate-200 bg-slate-50/80 p-4 flex gap-4">
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 animate-pulse">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
      {label}
    </span>
  )
}

// ---------------- M3 DIALOG & MODALS ----------------
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  isDestructive = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/90 text-center space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-2xl border border-amber-200">
          ⚠️
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-slate-300 bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-full py-3 text-sm font-black text-white shadow-sm transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExportSuccessModal({
  isOpen,
  onClose,
  filename,
}: {
  isOpen: boolean
  onClose: () => void
  filename: string
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/90 text-center space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 text-3xl border border-emerald-200 shadow-2xs">
          📊
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900">File Excel Berhasil Disimpan!</h3>
          <div className="inline-block rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-800 break-all mt-1">
            📁 {filename}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-left text-xs font-semibold text-emerald-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <span>📍 Lokasi File:</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            File tersimpan di <b>Folder Download (Unduhan)</b> HP Anda.
          </p>
          <p className="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-emerald-200/60">
            💡 Bisa dibuka dengan aplikasi <b>Excel / WPS Office</b> atau langsung dikirimkan lewat WhatsApp.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-slate-900 hover:bg-slate-800 active:bg-black py-3.5 text-sm font-black text-white shadow-sm transition-colors"
        >
          Siap, Mengerti
        </button>
      </div>
    </div>
  )
}

