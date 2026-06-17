'use client'

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleLogin: (token: string, userData: any) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Helper to normalize user data from backend
  const normalizeUser = (userData: any): User | null => {
    if (!userData) return null
    return {
      ...userData,
      // Map snake_case from DB to camelCase for Frontend
      emailVerified: userData.emailVerified ?? userData.email_verified ?? false
    }
  }

  const checkAuth = useCallback(async () => {
    const token = Cookies.get('token')

    if (!token) {
      setLoading(false)
      setInitialized(true)
      return
    }

    try {
      const res = await api.get('/auth/me')
      setUser(normalizeUser(res.data.user)) // Use helper
    } catch {
      Cookies.remove('token')
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    Cookies.set('token', res.data.token, { expires: 7 })
    setUser(normalizeUser(res.data.user)) // Use helper
  }

  const register = async (email: string, password: string, name: string) => {
    await api.post('/auth/register', { email, password, name })
  }

  const googleLogin = (token: string, userData: any) => {
    Cookies.set('token', token, { expires: 7 })
    setUser(normalizeUser(userData)) // Use helper
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, initialized, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
