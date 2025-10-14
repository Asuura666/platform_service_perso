import apiClient from './client'

export type ScrapeJob = {
  id: number
  url: string
  status: string
  message: string
  webtoon: number | null
  webtoon_title: string | null
  chapters_scraped: number
  images_downloaded: number
  media_root: string
  task_id: string
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
  duration: string | null
}

export const launchScraper = async (url: string) => {
  const { data } = await apiClient.post<ScrapeJob>('/scraper/', { url })
  return data
}

export const getScrapeStatus = async (id: number) => {
  const { data } = await apiClient.get<ScrapeJob>(`/scraper/status/${id}/`)
  return data
}

export const getScrapeHistory = async () => {
  const { data } = await apiClient.get<ScrapeJob[]>('/scraper/history/')
  return data
}
