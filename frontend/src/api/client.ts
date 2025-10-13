import axios from 'axios'

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

export default apiClient
