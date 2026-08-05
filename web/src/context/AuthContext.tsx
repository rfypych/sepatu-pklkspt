import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiLogin, apiMe } from '../lib/api'
import { getToken, setToken } from '../lib/config'
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
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    apiMe()
      .then(({ user }) => {
        setUser(user)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const { token, user } = await apiLogin(username.trim(), password)
      setToken(token)
      setUser(user)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [])

  const signOut = useCallback(async () => {
    setToken(null)
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