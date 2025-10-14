import apiClient from './client'

type AuthResponse = {
  access: string
  refresh: string
}

type Credentials = {
  username: string
  password: string
}

type RegisterPayload = Credentials & {
  email: string
}

export const loginRequest = async (credentials: Credentials) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login/', credentials)
  return data
}

export const registerRequest = async (payload: RegisterPayload) => {
  await apiClient.post('/auth/register/', payload)
}

export const refreshTokenRequest = async (refresh: string) => {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh/', { refresh })
  return data
}

export type UserProfile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_superuser: boolean
  features: string[]
}

export const getProfile = async () => {
  const { data } = await apiClient.get<UserProfile>('/auth/me/')
  return data
}
