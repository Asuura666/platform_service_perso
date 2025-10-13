import axios from 'axios'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10_000
})

export const getWebtoons = async () => {
  const { data } = await client.get<Webtoon[]>('/api/webtoons/')
  return data
}

export const createWebtoon = async (payload: WebtoonPayload) => {
  const { data } = await client.post<Webtoon>('/api/webtoons/', payload)
  return data
}

export const updateWebtoon = async (id: number, payload: WebtoonPayload) => {
  const { data } = await client.put<Webtoon>(`/api/webtoons/${id}/`, payload)
  return data
}

export const deleteWebtoon = async (id: number) => {
  await client.delete(`/api/webtoons/${id}/`)
}

export const webtoonApi = {
  getWebtoons,
  createWebtoon,
  updateWebtoon,
  deleteWebtoon
}
