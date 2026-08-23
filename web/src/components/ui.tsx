import type { ButtonHTMLAttributes, ReactNode } from 'react'

/* ==========================================================================
   KOMPONEN UI DASAR
   Sasaran pengguna: bapak-bapak di pabrik yang tidak terbiasa aplikasi HP.
   Aturan desain:
   - Semua tombol minimal 56px tinggi (mudah diketuk jari besar).
   - Teks minimal 16-17px, label penting 18px+.
   - Kontras tinggi (tulisan gelap di latar terang, atau putih di latar penuh).
   - Satu warna = satu makna: HIJAU simpan/aman, MERAH hapus/bahaya,
     BIRU informasi/navigasi, KUNING peringatan.
   ========================================================================== */

// ---------------- TOMBOL ----------------
export function BigButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tonal' | 'blue' | 'dark' | 'danger' | 'ghost' | 'pill'
  size?: 'sm' | 'md' | 'lg'
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300',
    secondary:
      'bg-blue-700 text-white border-blue-800 hover:bg-blue-800 active:bg-blue-900 disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300',
    tonal:
      'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200 active:bg-emerald-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
    blue:
      'bg-sky-700 text-white border-sky-800 hover:bg-sky-800 active:bg-sky-900 disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300',
    dark:
      'bg-slate-900 text-white border-slate-950 hover:bg-slate-800 active:bg-black disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300',
    danger:
      'bg-rose-700 text-white border-rose-800 hover:bg-rose-800 active:bg-rose-900 disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300',
    ghost:
      'bg-white text-slate-900 border-slate-400 hover:bg-slate-100 active:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200',
    pill:
      'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-500',
  }

  const sizes: Record<string, string> = {
    sm: 'min-h-11 px-4 py-2 text-sm',
    md: 'min-h-14 px-5 py-3 text-base',
    lg: 'min-h-16 px-6 py-4 text-lg',
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-bold tracking-tight shadow-sm transition-colors duration-100 active:translate-y-px disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0 ${sizes[size]} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ---------------- KARTU ----------------
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
      ? 'bg-slate-900 text-white border-slate-950'
      : color === 'emerald'
        ? 'bg-emerald-700 text-white border-emerald-900'
        : color === 'blue'
          ? 'bg-blue-700 text-white border-blue-900'
          : color === 'amber'
            ? 'bg-amber-50 text-amber-950 border-amber-300'
            : color === 'subtle'
              ? 'bg-slate-100 text-slate-900 border-slate-200'
              : 'bg-white text-slate-900 border-slate-300'

  return (
    <div className={`rounded-3xl border-2 p-4 sm:p-5 shadow-sm ${colorClass} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Kartu langkah bernomor. Dipakai untuk memandu urutan pengisian
 * ("1. Pilih shift", "2. Pilih PO", "3. Isi jumlah") supaya pengguna
 * tidak bingung harus mulai dari mana.
 */
export function StepCard({
  step,
  title,
  hint,
  done = false,
  action,
  children,
  className = '',
}: {
  step: number | string
  title: string
  hint?: string
  done?: boolean
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl border-2 bg-white shadow-sm ${
        done ? 'border-emerald-400' : 'border-slate-300'
      } ${className}`}
    >
      <header className="flex items-start gap-3 border-b-2 border-slate-100 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-extrabold ${
            done
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : 'border-slate-800 bg-slate-900 text-white'
          }`}
          aria-hidden="true"
        >
          {done ? '✓' : step}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-sm font-medium text-slate-600">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children && <div className="p-4">{children}</div>}
    </section>
  )
}

/** Judul halaman yang konsisten di semua menu. */
export function PageTitle({
  title,
  subtitle,
  icon,
  badge,
  right,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-800 bg-slate-900 text-white">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {badge && <div className="mb-1">{badge}</div>}
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm font-medium leading-snug text-slate-600">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/** Kartu angka besar (total pasang, total gaji). Angka dibuat sebesar mungkin. */
export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = 'blue',
  icon,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  tone?: 'blue' | 'emerald' | 'slate' | 'amber'
  icon?: ReactNode
}) {
  const tones: Record<string, string> = {
    blue: 'border-blue-300 bg-blue-50 text-blue-950',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    slate: 'border-slate-300 bg-slate-100 text-slate-900',
    amber: 'border-amber-300 bg-amber-50 text-amber-950',
  }
  const iconTones: Record<string, string> = {
    blue: 'bg-blue-700 text-white',
    emerald: 'bg-emerald-700 text-white',
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-500 text-amber-950',
  }
  return (
    <div className={`rounded-3xl border-2 p-4 shadow-sm sm:p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="text-sm font-bold uppercase leading-tight tracking-wide opacity-90">
          {label}
        </div>
      </div>
      <div className="mt-1.5 text-3xl font-extrabold leading-none tracking-tight break-words sm:text-4xl">
        {value}
        {unit && <span className="ml-1 text-base font-bold opacity-70">{unit}</span>}
      </div>
      {hint && <div className="mt-1.5 text-sm font-semibold opacity-80">{hint}</div>}
    </div>
  )
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-base font-bold leading-tight tracking-tight text-slate-900"
    >
      {children}
    </label>
  )
}

// ---------------- INPUT ----------------
const INPUT_BASE =
  'w-full min-h-14 rounded-2xl border-2 border-slate-400 bg-white px-4 py-3 text-lg font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/15 disabled:bg-slate-100 disabled:text-slate-500 transition-colors'

export function TextInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${INPUT_BASE} ${className}`} {...props} />
}

export function SelectInput({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${INPUT_BASE} appearance-none pr-10 ${className}`} {...props}>
      {children}
    </select>
  )
}

/**
 * Input angka besar dengan tombol - dan +.
 * Mengetik angka kecil di HP sulit bagi pengguna lanjut usia, jadi selalu
 * sediakan tombol tambah/kurang berukuran besar.
 */
export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99999,
  className = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  className?: string
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const filled = value > 0
  return (
    <div
      className={`rounded-2xl border-2 p-2 text-center transition-colors ${
        filled ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'
      } ${className}`}
    >
      <div className="text-sm font-extrabold tracking-tight text-slate-700">{label}</div>
      <div className="mt-1.5 flex items-stretch gap-1">
        <button
          type="button"
          aria-label={`Kurangi ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-100 text-xl font-extrabold text-slate-800 active:bg-slate-300"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          aria-label={label}
          placeholder="0"
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? 0 : clamp(Math.floor(Number(raw) || 0)))
          }}
          className="h-11 w-full min-w-0 rounded-xl border-2 border-slate-300 bg-white text-center text-xl font-extrabold text-slate-900 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="button"
          aria-label={`Tambah ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-300 bg-emerald-100 text-xl font-extrabold text-emerald-900 active:bg-emerald-300"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function Spinner({ label = 'Mohon tunggu, data sedang dimuat...' }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-slate-700"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />
      <span className="text-base font-bold tracking-tight">{label}</span>
    </div>
  )
}

// ---------------- PESAN / NOTIFIKASI ----------------
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-rose-400 bg-rose-50 p-4 text-rose-950 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-700 text-lg text-white">
          !
        </span>
        <div className="flex-1">
          <div className="text-base font-extrabold">Ada masalah</div>
          <div className="mt-0.5 text-base font-medium leading-snug">{message}</div>
        </div>
      </div>
      {onRetry && (
        <BigButton variant="ghost" size="sm" className="mt-3 w-full" onClick={onRetry}>
          Coba Lagi
        </BigButton>
      )}
    </div>
  )
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-4 text-emerald-950 shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg text-white">
        ✓
      </span>
      <div className="flex-1">
        <div className="text-base font-extrabold">Berhasil</div>
        <div className="mt-0.5 text-base font-medium leading-snug">{message}</div>
      </div>
    </div>
  )
}

/** Kotak petunjuk/tips berwarna kuning — dipakai untuk mengarahkan pengguna. */
export function HintBox({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'blue' }) {
  const cls =
    tone === 'blue'
      ? 'border-blue-300 bg-blue-50 text-blue-950'
      : 'border-amber-400 bg-amber-50 text-amber-950'
  return (
    <div className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 ${cls}`}>
      <span className="text-xl leading-none" aria-hidden="true">
        💡
      </span>
      <div className="flex-1 text-base font-semibold leading-snug">{children}</div>
    </div>
  )
}

/** Tampilan "belum ada data" yang selalu memberi tahu langkah berikutnya. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-400 bg-white p-8 text-center shadow-sm">
      {icon && (
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-lg font-extrabold text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-base font-medium leading-snug text-slate-600">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

// ---------------- BADGE / CHIP ----------------
export function PillBadge({
  children,
  color = 'neutral',
  className = '',
}: {
  children: ReactNode
  color?: 'neutral' | 'emerald' | 'blue' | 'amber' | 'rose' | 'dark' | 'indigo'
  className?: string
}) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-900 border-slate-400',
    emerald: 'bg-emerald-100 text-emerald-950 border-emerald-400',
    blue: 'bg-blue-100 text-blue-950 border-blue-400',
    amber: 'bg-amber-100 text-amber-950 border-amber-400',
    rose: 'bg-rose-100 text-rose-950 border-rose-400',
    dark: 'bg-slate-900 text-white border-slate-950',
    indigo: 'bg-indigo-100 text-indigo-950 border-indigo-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm font-bold tracking-tight ${styles[color]} ${className}`}
    >
      {children}
    </span>
  )
}

// ---------------- SKELETON ----------------
export function Skeleton({
  className = '',
  rounded = 'rounded-2xl',
}: {
  className?: string
  rounded?: string
}) {
  return <div className={`animate-pulse bg-slate-200 ${rounded} ${className}`} aria-hidden="true" />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-9 w-40" />
      <Skeleton className="h-4 w-52" />
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
    <div
      className={`overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex gap-4 border-b-2 border-slate-200 bg-slate-100 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y-2 divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function InlineLoadingBadge({ label = 'Menyinkronkan...' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" />
      {label}
    </span>
  )
}

// ---------------- DIALOG ----------------
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
      className="hs-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`hs-pop-in w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-3xl border-2 border-slate-300 bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-3">
            <h2 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 text-lg font-extrabold text-slate-700 active:bg-slate-300"
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
  title = 'Konfirmasi',
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
      className="hs-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="hs-pop-in w-full max-w-md space-y-4 rounded-t-3xl border-2 border-slate-300 bg-white p-5 text-center shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl ${
            isDestructive
              ? 'border-rose-300 bg-rose-100 text-rose-700'
              : 'border-amber-300 bg-amber-100 text-amber-700'
          }`}
          aria-hidden="true"
        >
          {isDestructive ? '🗑️' : '❓'}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900">
            {title}
          </h3>
          <p className="text-base font-medium leading-relaxed text-slate-700">{message}</p>
        </div>
        {/* Tombol disusun vertikal: pilihan aman (Batal) di bawah supaya tidak
            tertekan sembarangan, dan masing-masing lebar penuh agar mudah dituju. */}
        <div className="space-y-2.5 pt-1">
          <BigButton
            variant={isDestructive ? 'danger' : 'primary'}
            className="w-full"
            onClick={onConfirm}
          >
            {confirmLabel}
          </BigButton>
          <BigButton variant="ghost" className="w-full" onClick={onCancel}>
            {cancelLabel}
          </BigButton>
        </div>
      </div>
    </div>
  )
}

export function ExportSuccessModal({
  isOpen,
  onClose,
  filename,
  onShare,
}: {
  isOpen: boolean
  onClose: () => void
  filename: string
  onShare?: () => void
}) {
  if (!isOpen) return null
  return (
    <div
      className="hs-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="hs-pop-in w-full max-w-md space-y-4 rounded-t-3xl border-2 border-slate-300 bg-white p-5 text-center shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-emerald-300 bg-emerald-100 text-3xl">
          ✅
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900">
            File Excel Berhasil Disimpan
          </h3>
          <div className="inline-block break-all rounded-xl border-2 border-slate-300 bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900">
            {filename}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-left">
          <div className="text-base font-extrabold text-emerald-950">Di mana filenya?</div>
          <p className="text-base font-medium leading-snug text-slate-800">
            File ada di folder <b>Download (Unduhan)</b> di HP Anda.
          </p>
          <p className="border-t-2 border-emerald-200 pt-2 text-sm font-medium leading-snug text-slate-700">
            Bisa langsung dikirim ke grup WhatsApp lewat tombol di bawah.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          {onShare && (
            <BigButton variant="primary" className="w-full" onClick={onShare}>
              Kirim / Bagikan File
            </BigButton>
          )}
          <BigButton variant="ghost" className="w-full" onClick={onClose}>
            Tutup
          </BigButton>
        </div>
      </div>
    </div>
  )
}
