import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiLogin, apiMe, apiSwitchRole, prefetchCoreData } from '../lib/api'
import { getToken, setToken } from '../lib/config'
import type { UserProfile } from '../lib/types'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  switchRole: (role: 'admin' | 'mandor') => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const { token, user } = await apiLogin(username.trim(), password)
      setToken(token)
      setUser(user)
      prefetchCoreData(user.role)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      const isApk = typeof navigator !== 'undefined' && (navigator.userAgent.includes('SepatuMandorApp') || new URLSearchParams(window.location.search).get('auto') === 'mandor')
      if (isApk) {
        signIn('mandor', 'mandor123').finally(() => setLoading(false))
        return
      }
      setLoading(false)
      return
    }
    apiMe()
      .then(({ user }) => {
        setUser(user)
        prefetchCoreData(user.role)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [signIn])

  const signOut = useCallback(async () => {
    setToken(null)
    setUser(null)
  }, [])

  const switchRole = useCallback(async (role: 'admin' | 'mandor') => {
    try {
      const { token, user } = await apiSwitchRole(role)
      setToken(token)
      setUser(user)
      prefetchCoreData(user.role)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}