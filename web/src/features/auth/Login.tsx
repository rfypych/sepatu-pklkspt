import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BigButton, ErrorBox, FieldLabel, TextInput } from '../../components/ui'
import { ArrowRight, KeyRound, Lock, LogIn, User } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn(username, password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-3xl shadow-lg border-2 border-slate-800">
            👞
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Sistem Produksi & Upah
          </h1>
          <p className="mt-1 text-sm font-bold text-emerald-700 bg-emerald-100 inline-block px-3 py-1 rounded-full border border-emerald-200">
            Sistem Manajemen Produksi & Upah
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-800">Silakan Masuk</h2>
            <p className="text-xs text-slate-500">Masukkan nama akun dan kata sandi Anda</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <FieldLabel>NAMA AKUN (USERNAME)</FieldLabel>
              <div className="relative">
                <TextInput
                  autoCapitalize="none"
                  autoComplete="username"
                  placeholder="Ketik username (cth: mandor / admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11 py-3.5 text-base font-bold"
                  required
                />
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div>
              <FieldLabel>KATA SANDI (PASSWORD)</FieldLabel>
              <div className="relative">
                <TextInput
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ketik password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 py-3.5 text-base font-bold"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <BigButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-4 text-lg font-black tracking-wide"
            >
              {loading ? (
                'SEDANG MEMERIKSA...'
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>MASUK SEKARANG</span>
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </BigButton>
          </form>
        </div>

        {/* Petunjuk Akun Bantuan */}
        <div className="mt-4 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 text-xs text-sky-950 shadow-xs">
          <div className="font-bold flex items-center gap-1.5 text-sky-900 mb-1">
            <KeyRound className="h-4 w-4" />
            <span>Petunjuk Akun Default:</span>
          </div>
          <div className="flex justify-between gap-2 mt-1">
            <div><b>Admin</b>: username <code className="bg-sky-200/80 px-1.5 py-0.5 rounded font-bold">admin</code> / pass <code className="bg-sky-200/80 px-1.5 py-0.5 rounded font-bold">admin123</code></div>
            <div><b>Mandor</b>: username <code className="bg-sky-200/80 px-1.5 py-0.5 rounded font-bold">mandor</code> / pass <code className="bg-sky-200/80 px-1.5 py-0.5 rounded font-bold">mandor123</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}
