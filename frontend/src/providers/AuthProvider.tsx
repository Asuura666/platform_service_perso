import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import apiClient, { setAuthToken } from '@/api/client'
import { getProfile, loginRequest, refreshTokenRequest, registerRequest, type UserProfile } from '@/api/auth'

type AuthContextValue = {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (payload: { username: string; password: string }) => Promise<void>
  register: (payload: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACCESS_KEY = 'webtoon-book-access-token'
const REFRESH_KEY = 'webtoon-book-refresh-token'

const readToken = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    console.error('Unable to read token from storage', error)
    return null
  }
}

const writeToken = (key: string, value: string | null) => {
  try {
    if (value) {
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('Unable to persist token', error)
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTokenRef = useRef<string | null>(null)

  const clearSession = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    refreshTokenRef.current = null
    setAuthToken(null)
    writeToken(ACCESS_KEY, null)
    writeToken(REFRESH_KEY, null)
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Unable to fetch profile', error)
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    const storedAccess = readToken(ACCESS_KEY)
    const storedRefresh = readToken(REFRESH_KEY)
    if (storedAccess) {
      setAuthToken(storedAccess)
      setAccessToken(storedAccess)
      refreshTokenRef.current = storedRefresh
      fetchProfile().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status
        if (status === 401) {
          const currentRefresh = refreshTokenRef.current
          if (currentRefresh) {
            try {
              const tokens = await refreshTokenRequest(currentRefresh)
              setAuthToken(tokens.access)
              setAccessToken(tokens.access)
              refreshTokenRef.current = tokens.refresh
              writeToken(ACCESS_KEY, tokens.access)
              writeToken(REFRESH_KEY, tokens.refresh)
              error.config.headers.Authorization = `Bearer ${tokens.access}`
              return apiClient.request(error.config)
            } catch (refreshError) {
              clearSession()
            }
          } else {
            clearSession()
          }
        }
        return Promise.reject(error)
      }
    )
    return () => {
      apiClient.interceptors.response.eject(interceptor)
    }
  }, [clearSession])

  const login = useCallback(
    async (payload: { username: string; password: string }) => {
      const tokens = await loginRequest(payload)
      setAuthToken(tokens.access)
      setAccessToken(tokens.access)
      refreshTokenRef.current = tokens.refresh
      writeToken(ACCESS_KEY, tokens.access)
      writeToken(REFRESH_KEY, tokens.refresh)
      await fetchProfile()
    },
    [fetchProfile]
  )

  const register = useCallback(
    async (payload: { username: string; email: string; password: string }) => {
      await registerRequest(payload)
      await login({ username: payload.username, password: payload.password })
    },
    [login]
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      loading,
      login,
      register,
      logout
    }),
    [user, accessToken, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
