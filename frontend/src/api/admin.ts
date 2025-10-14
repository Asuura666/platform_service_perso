import apiClient from './client'

export type AdminFeature = {
  id: number
  code: string
  name: string
  description: string
}

export type AdminUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  is_superuser: boolean
  features: string[]
}

export type CreateAdminUserPayload = {
  username: string
  email: string
  password: string
  role?: string
  is_active?: boolean
  is_superuser?: boolean
  features?: string[]
  first_name?: string
  last_name?: string
}

export type UpdateAdminUserPayload = Partial<Omit<CreateAdminUserPayload, 'username' | 'password'>> & {
  password?: string
  features?: string[]
}

export const fetchAdminFeatures = async () => {
  const { data } = await apiClient.get<AdminFeature[]>('/auth/admin/features/')
  return data
}

export const fetchAdminUsers = async () => {
  const { data } = await apiClient.get<AdminUser[]>('/auth/admin/users/')
  return data
}

export const createAdminUser = async (payload: CreateAdminUserPayload) => {
  const { data } = await apiClient.post<AdminUser>('/auth/admin/users/', payload)
  return data
}

export const updateAdminUser = async (userId: number, payload: UpdateAdminUserPayload) => {
  const { data } = await apiClient.patch<AdminUser>(`/auth/admin/users/${userId}/`, payload)
  return data
}
