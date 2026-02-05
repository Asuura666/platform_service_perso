import { useNavigate } from "react-router-dom"
import { motion } from 'framer-motion'
import { ExternalLink, Minus, PencilLine, Plus, Star, Trash2 } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { Webtoon } from '@/types/webtoon'

type WebtoonCardProps = {
  webtoon: Webtoon
  onEdit?: (webtoon: Webtoon) => void
  onDelete?: (webtoon: Webtoon) => void
  onChapterChange?: (webtoon: Webtoon, delta: number) => void
}

const FALLBACK = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80'

const WebtoonCardComponent = ({ webtoon, onEdit, onDelete, onChapterChange }: WebtoonCardProps) => {
  const [imgErr, setImgErr] = useState(false)
  const navigate = useNavigate()
  const rating = useMemo(() => (Number.isFinite(webtoon.rating) ? webtoon.rating : 0), [webtoon.rating])

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-muted/30 bg-panel shadow-card"
    >
      <button
        type="button"
        onClick={() => navigate(`/webtoons/${webtoon.id}`)}
        className="relative aspect-[2/3] w-full overflow-hidden"
      >
        <img
          src={!imgErr ? (webtoon.image_url || FALLBACK) : FALLBACK}
          onError={() => setImgErr(true)}
          loading="lazy"
          alt={webtoon.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
          {webtoon.type}
        </span>
        {rating > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold text-accentAmber">
            <Star size={9} fill="currentColor" />{rating.toFixed(1)}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[0.55rem] font-semibold ${
            webtoon.status === 'En cours' ? 'bg-green-500/20 text-green-400' :
            webtoon.status === 'Terminé' ? 'bg-zinc-500/20 text-zinc-400' :
            'bg-orange-500/20 text-orange-400'
          }`}>
            {webtoon.status}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">{webtoon.title}</h3>
        <div className="flex items-center justify-between text-xs text-textMuted">
          <span>{webtoon.language}</span>
          <div className="flex items-center gap-1">
            <span className="font-medium text-textLight">Ch. {webtoon.chapter}</span>
            {onChapterChange && (
              <div className="ml-1 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onChapterChange(webtoon, -1)}
                  disabled={webtoon.chapter <= 1}
                  className="flex h-6 w-6 items-center justify-center rounded bg-surface text-textMuted transition hover:text-white active:scale-90 disabled:opacity-30"
                >
                  <Minus size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onChapterChange(webtoon, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded bg-accent/15 text-accent transition hover:bg-accent/25 active:scale-90"
                >
                  <Plus size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          {webtoon.link && (
            <a
              href={webtoon.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-textMuted transition hover:text-accent"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(webtoon)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-textMuted transition hover:text-white"
            >
              <PencilLine size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(webtoon)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-textMuted transition hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

const WebtoonCard = memo(WebtoonCardComponent, (prev, next) => {
  if (prev.onEdit !== next.onEdit || prev.onDelete !== next.onDelete || prev.onChapterChange !== next.onChapterChange) return false
  const p = prev.webtoon, n = next.webtoon
  return p.id === n.id && p.updated_at === n.updated_at && p.chapter === n.chapter && p.rating === n.rating && p.image_url === n.image_url
})

export default WebtoonCard
