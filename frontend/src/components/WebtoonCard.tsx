import { motion } from 'framer-motion'
import { ExternalLink, PencilLine, Trash2 } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { Webtoon } from '@/types/webtoon'
import { formatDate, prettifyLink, toStars } from '@/utils/format'

type WebtoonCardProps = {
  webtoon: Webtoon
  onSelect: (webtoon: Webtoon) => void
  onEdit?: (webtoon: Webtoon) => void
  onDelete?: (webtoon: Webtoon) => void
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80'

const cardVariants = {
  rest: { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' },
  hover: { scale: 1.03, boxShadow: '0px 18px 45px rgba(20, 35, 80, 0.45)' }
}

const WebtoonCardComponent = ({ webtoon, onSelect, onEdit, onDelete }: WebtoonCardProps) => {
  const [imageError, setImageError] = useState(false)
  const ratingValue = useMemo(() => (Number.isFinite(webtoon.rating) ? webtoon.rating : 0), [webtoon.rating])
  const stars = useMemo(() => toStars(ratingValue), [ratingValue])
  const ratingLabel = useMemo(() => ratingValue.toFixed(1), [ratingValue])

  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardVariants}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-muted/40 bg-panel/80 shadow-panel transition-all duration-300"
    >
      <button
        type="button"
        onClick={() => onSelect(webtoon)}
        className="relative h-48 w-full overflow-hidden"
        aria-label={`Ouvrir ${webtoon.title}`}
      >
        <div className="absolute inset-0 bg-gradient-glow opacity-70 transition-opacity group-hover:opacity-90" />
        <img
          src={!imageError ? webtoon.image_url : FALLBACK_IMAGE}
          onError={() => setImageError(true)}
          loading="lazy"
          alt={`Illustration du webtoon ${webtoon.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-accent">
          {webtoon.type}
        </span>
        <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-black/55 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white/80">
          {webtoon.status}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{webtoon.title}</h3>
          <motion.a
            href={webtoon.link}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.1 }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent transition hover:bg-accent/20"
          >
            <ExternalLink size={18} />
          </motion.a>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-textLight/50">
          <span>{webtoon.language}</span>
          <span className="h-1 w-1 rounded-full bg-textLight/40" />
          <span>Chapitre {webtoon.chapter}</span>
        </div>

        <div className="flex flex-col gap-2 text-sm text-textLight/70">
          <div className="flex items-center gap-1 text-accent">
            {stars.map((state, index) => (
              <span
                key={`${webtoon.id}-star-${index}`}
                className={clsx('text-lg', {
                  'text-accent': state !== 'empty',
                  'text-accent/30': state === 'empty'
                })}
              >
                {state === 'empty' ? 'o' : '*'}
              </span>
            ))}
            <span className="ml-2 text-xs font-semibold text-textLight/60">{ratingLabel}/5</span>
          </div>
          <div className="text-xs uppercase tracking-[0.35em] text-textLight/40">
            {prettifyLink(webtoon.link)}
          </div>
          <div className="text-xs text-textLight/50">
            Mise à jour : <span className="text-textLight/70">{formatDate(webtoon.updated_at ?? webtoon.last_read_date)}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(webtoon)}
            className="rounded-2xl border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Voir details
          </motion.button>
          <div className="flex items-center gap-2">
            {onEdit && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(webtoon)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/50 bg-surface/70 text-textLight/70 transition hover:text-white"
                aria-label="Modifier"
              >
                <PencilLine size={18} />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(webtoon)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/60 bg-surface/70 text-textLight/50 transition hover:border-red-500/60 hover:text-red-400"
                aria-label="Supprimer"
              >
                <Trash2 size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

const WebtoonCard = memo(WebtoonCardComponent, (prev, next) => {
  if (prev.onSelect !== next.onSelect || prev.onEdit !== next.onEdit || prev.onDelete !== next.onDelete) {
    return false
  }
  const prevWebtoon = prev.webtoon
  const nextWebtoon = next.webtoon
  return (
    prevWebtoon.id === nextWebtoon.id &&
    prevWebtoon.updated_at === nextWebtoon.updated_at &&
    prevWebtoon.chapter === nextWebtoon.chapter &&
    prevWebtoon.rating === nextWebtoon.rating &&
    prevWebtoon.image_url === nextWebtoon.image_url
  )
})

export default WebtoonCard
