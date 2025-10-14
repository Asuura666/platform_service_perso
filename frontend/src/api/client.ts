import axios from 'axios'
import type { AxiosError } from 'axios'
import { notifyError } from '@/utils/notificationBus'

const baseURL = (() => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
  return fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv
})()

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10_000
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string; error?: string }>) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    if (status && status !== 401) {
      const payload = error.response?.data
      const message =
        payload?.detail ?? payload?.message ?? payload?.error ?? error.message ?? 'Une erreur reseau est survenue.'
      notifyError(message)
    } else if (!status) {
      notifyError('Serveur injoignable. Verifiez votre connexion.')
    }

    return Promise.reject(error)
  }
)

export default apiClient
