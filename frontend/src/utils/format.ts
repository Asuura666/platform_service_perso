const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

export const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export const clampRating = (rating: number) => {
  if (Number.isNaN(rating)) return 0
  return Math.min(5, Math.max(0, Number.parseFloat(rating.toString())))
}

export const toStars = (rating: number) => {
  const value = clampRating(rating)
  return Array.from({ length: 5 }).map((_, index) => {
    if (index + 1 <= Math.floor(value)) return 'full'
    if (index < value) return 'half'
    return 'empty'
  })
}

export const prettifyLink = (url: string) => {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch (error) {
    return url
  }
}
