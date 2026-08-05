import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/api'
import type { UserProfile } from '../lib/types'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let aktif = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (aktif && data.session?.user) {
        try {
          const profil = await getProfile(data.session.user.id)
          setUser(profil)
        } catch {
          await supabase.auth.signOut()
        }
      }
      if (aktif) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!aktif) return
      if (session?.user) {
        getProfile(session.user.id)
          .then((p) => {
            if (aktif) setUser(p)
          })
          .catch(() => {})
      } else {
        setUser(null)
      }
      if (!session) setLoading(false)
    })

    return () => {
      aktif = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error || !data.user) return { error: error?.message ?? 'Gagal masuk' }
    try {
      const profil = await getProfile(data.user.id)
      setUser(profil)
      return { error: null }
    } catch {
      await supabase.auth.signOut()
      return { error: 'Akun belum terdaftar di tabel users. Hubungi admin.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
