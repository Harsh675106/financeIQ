import axios from 'axios'
import Cookies from 'js-cookie'

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
const API_URL =
  configuredApiUrl && configuredApiUrl.length > 0
    ? configuredApiUrl.replace(/\/+$/, '')
    : process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api'
      : ''

if (process.env.NODE_ENV === 'production' && !configuredApiUrl) {
  console.error('Missing NEXT_PUBLIC_API_URL in production build. Set it in Vercel project environment variables.')
}

export const api = axios.create({
  baseURL: API_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ---------- REQUEST INTERCEPTOR ---------- */
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ---------- RESPONSE INTERCEPTOR ---------- */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ ONLY remove token
    // ❌ DO NOT redirect or reload page here
    if (error.response?.status === 401) {
      Cookies.remove('token')
    }

    return Promise.reject(error)
  }
)
