import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BigButton, ErrorBox, FieldLabel, HintBox, TextInput } from '../../components/ui'
import { Eye, EyeOff, KeyRound, Lock, LogIn, User } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [lihatPassword, setLihatPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn(username.trim(), password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* ---------- Identitas aplikasi ---------- */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-slate-950 bg-slate-900 text-4xl shadow-md">
            👞
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
            Catatan Produksi & Upah
          </h1>
        </div>

        {/* ---------- Form masuk ---------- */}
        <div className="space-y-5 rounded-3xl border-2 border-slate-300 bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b-2 border-slate-100 pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Masuk</h2>
            <p className="mt-0.5 text-base font-medium text-slate-600">
              Ketik nama akun dan kata sandi Anda.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="username">Nama Akun</FieldLabel>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <TextInput
                  id="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  placeholder="contoh: mandor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-13"
                  required
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <TextInput
                  id="password"
                  type={lihatPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="ketik kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-13 pr-14"
                  required
                />
                {/* Tombol lihat sandi: penting agar pengguna bisa memastikan
                    yang diketik sudah benar (salah ketik adalah kendala utama). */}
                <button
                  type="button"
                  onClick={() => setLihatPassword((v) => !v)}
                  aria-label={lihatPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-600 active:bg-slate-200"
                >
                  {lihatPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-600">
                Ketuk ikon mata untuk melihat sandi yang Anda ketik.
              </p>
            </div>

            {error && <ErrorBox message={error} />}

            <BigButton type="submit" disabled={loading} variant="primary" size="lg" className="w-full">
              {loading ? (
                'Sedang memeriksa...'
              ) : (
                <>
                  <LogIn className="h-6 w-6" />
                  <span>MASUK</span>
                </>
              )}
            </BigButton>
          </form>
        </div>

        {/* Petunjuk akun contoh hanya untuk mode pengembangan — tidak ditampilkan
            di aplikasi yang sudah dipakai produksi agar kredensial tidak bocor. */}
        {import.meta.env.DEV && (
          <HintBox tone="blue">
            <span className="flex items-center gap-1.5 font-extrabold">
              <KeyRound className="h-4 w-4" />
              Akun uji (mode dev)
            </span>
            <div className="mt-1 font-medium">
              admin / admin123 · mandor / mandor123
            </div>
          </HintBox>
        )}

      </div>
    </div>
  )
}
