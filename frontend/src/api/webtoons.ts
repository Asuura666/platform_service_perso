import type { Webtoon, WebtoonPayload } from '@/types/webtoon'
import apiClient from './client'

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const getWebtoons = async (params?: { page?: number }, config?: { signal?: AbortSignal }) => {
  const { data } = await apiClient.get<PaginatedResponse<Webtoon>>('/webtoons/', {
    params,
    signal: config?.signal
  })
  return data
}

export const createWebtoon = async (payload: WebtoonPayload) => {
  const { data } = await apiClient.post<Webtoon>('/webtoons/', payload)
  return data
}

export const updateWebtoon = async (id: number, payload: WebtoonPayload) => {
  const { data } = await apiClient.put<Webtoon>(`/webtoons/${id}/`, payload)
  return data
}

export const deleteWebtoon = async (id: number) => {
  await apiClient.delete(`/webtoons/${id}/`)
}

export const webtoonApi = {
  getWebtoons,
  createWebtoon,
  updateWebtoon,
  deleteWebtoon
}
