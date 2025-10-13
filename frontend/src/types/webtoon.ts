export type Webtoon = {
  id: number
  title: string
  type: string
  language: string
  rating: number
  chapter: number
  link: string
  status: string
  last_read_date: string | null
  comment: string | null
  image_url: string
  updated_at?: string | null
  created_at?: string | null
}

export type WebtoonPayload = Omit<Webtoon, 'id' | 'created_at' | 'updated_at'>
