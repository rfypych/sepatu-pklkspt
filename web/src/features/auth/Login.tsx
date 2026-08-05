import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/env'
import { BigButton, ErrorBox, FieldLabel, TextInput } from '../../components/ui'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn(email.trim(), password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            👟
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sistem Produksi & Upah</h1>
          <p className="text-sm text-slate-500">Pabrik Sepatu</p>
        </div>

        {!isSupabaseConfigured ? (
          <ErrorBox message="Supabase belum dikonfigurasi. Salin web/.env.example ke web/.env lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY." />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <TextInput
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <ErrorBox message={error} />}
            <BigButton type="submit" disabled={loading} className="w-full py-4 text-lg">
              {loading ? 'Masuk...' : 'MASUK'}
            </BigButton>
          </form>
        )}
      </div>
    </div>
  )
}
