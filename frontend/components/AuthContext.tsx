"use client"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

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
  logout: () => void
  refreshSession: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
  refreshSession: async () => null,
})

const API_URL = process.env.NEXT_PUBLIC_API_URL

function clearStoredUser() {
  localStorage.removeItem("auth_user")
  localStorage.removeItem("user_id")
  localStorage.removeItem("user_name")
}

function persistUser(user: User) {
  localStorage.setItem("auth_user", JSON.stringify(user))
  localStorage.setItem("user_id", user.id)
  localStorage.setItem("user_name", user.name)
}

async function fetchCurrentUser(): Promise<User | null> {
  const res = await axios.get(`${API_URL}/auth/me`, { withCredentials: true })
  return res.data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    void axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => undefined)
    clearStoredUser()
    setUser(null)
    router.push("/login")
  }, [router])

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await fetchCurrentUser()
      if (currentUser) {
        persistUser(currentUser)
        setUser(currentUser)
        return currentUser
      }
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 401) {
        try {
          await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
          const refreshedUser = await fetchCurrentUser()
          if (refreshedUser) {
            persistUser(refreshedUser)
            setUser(refreshedUser)
            return refreshedUser
          }
        } catch {
          clearStoredUser()
          setUser(null)
          return null
        }
      } else {
        return null
      }
    }

    clearStoredUser()
    setUser(null)
    return null
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        clearStoredUser()
      }
    }

    void refreshSession().finally(() => {
      setIsLoading(false)
    })
  }, [refreshSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthenticatedAxios() {
  const { logout, refreshSession } = useAuth()

  const authAxios = useCallback(async () => {
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    })

    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            await refreshSession()
            return instance(originalRequest)
          } catch {
            logout()
          }
        }

        return Promise.reject(error)
      }
    )

    return instance
  }, [logout, refreshSession])

  return authAxios
}
