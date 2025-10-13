import type { Webtoon, WebtoonPayload } from '@/types/webtoon'
import apiClient from './client'

export const getWebtoons = async () => {
  const { data } = await apiClient.get<Webtoon[]>('/webtoons/')
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
