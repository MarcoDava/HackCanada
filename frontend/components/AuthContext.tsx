"use client"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

interface User {
  id: string
  email: string
  name: string
  picture: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => null,
})

const API_URL = process.env.NEXT_PUBLIC_API_URL

function parseJwt(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now + bufferSeconds
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((accessToken: string, refreshToken: string, newUser: User) => {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
    if (newUser.id) {
      localStorage.setItem("user_id", newUser.id)
      localStorage.setItem("user_name", newUser.name)
    }
    setToken(accessToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_name")
    setToken(null)
    setUser(null)
    router.push("/login")
  }, [router])

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      logout()
      return null
    }

    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken
      })

      const { access_token, refresh_token: newRefreshToken } = res.data
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", newRefreshToken)
      setToken(access_token)
      return access_token
    } catch (error) {
      console.error("Token refresh failed:", error)
      logout()
      return null
    }
  }, [logout])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const currentToken = localStorage.getItem("access_token")
    
    if (!currentToken) {
      return null
    }

    if (!isTokenExpired(currentToken)) {
      return currentToken
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshPromiseRef.current = refreshAccessToken().finally(() => {
      refreshPromiseRef.current = null
    })

    return refreshPromiseRef.current
  }, [refreshAccessToken])

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      isLoading,
      login, 
      logout,
      getAccessToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthenticatedAxios() {
  const { getAccessToken, logout } = useAuth()

  const authAxios = useCallback(async () => {
    const token = await getAccessToken()
    
    const instance = axios.create({
      baseURL: API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return instance
  }, [getAccessToken, logout])

  return authAxios
}
