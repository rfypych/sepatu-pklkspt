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

const USER_KEY = 'sp_user'

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user: UserProfile | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser())
  const [loading, setLoading] = useState(() => !getToken() && !getStoredUser())

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const { token, user } = await apiLogin(username.trim(), password)
      setToken(token)
      setStoredUser(user)
      setUser(user)
      prefetchCoreData(user.role)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    const cachedUser = getStoredUser()

    if (!token) {
      const isApk =
        typeof navigator !== 'undefined' &&
        (navigator.userAgent.includes('SepatuMandorApp') ||
          new URLSearchParams(window.location.search).get('auto') === 'mandor')
      if (isApk) {
        signIn('mandor', 'mandor123').finally(() => setLoading(false))
        return
      }
      setLoading(false)
      return
    }

    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
    }

    apiMe()
      .then(({ user }) => {
        setUser(user)
        setStoredUser(user)
        prefetchCoreData(user.role)
      })
      .catch((err) => {
        const errMsg = (err as Error).message || ''
        // Hanya hapus sesi jika token benar-benar kadaluarsa / tidak valid dari server (401)
        if (
          errMsg.includes('401') ||
          errMsg.toLowerCase().includes('unauthorized') ||
          errMsg.toLowerCase().includes('jwt') ||
          errMsg.toLowerCase().includes('token tidak valid')
        ) {
          setToken(null)
          setStoredUser(null)
          setUser(null)
        }
        // Jika hanya network error / offline: tetap pertahankan sesi login di HP!
      })
      .finally(() => setLoading(false))
  }, [signIn])

  const signOut = useCallback(async () => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }, [])

  const switchRole = useCallback(async (role: 'admin' | 'mandor') => {
    try {
      const { token, user } = await apiSwitchRole(role)
      setToken(token)
      setStoredUser(user)
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