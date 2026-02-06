import { motion } from 'framer-motion'
import { ExternalLink, PencilLine, Star, Trash2 } from 'lucide-react'
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
  rest: { 
    scale: 1, 
    y: 0,
  },
  hover: { 
    scale: 1.02, 
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
}

const imageVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
}

const overlayVariants = {
  rest: { opacity: 0 },
  hover: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

const WebtoonCardComponent = ({ webtoon, onSelect, onEdit, onDelete }: WebtoonCardProps) => {
  const [imageError, setImageError] = useState(false)
  const ratingValue = useMemo(() => (Number.isFinite(webtoon.rating) ? webtoon.rating : 0), [webtoon.rating])
  const stars = useMemo(() => toStars(ratingValue), [ratingValue])
  const ratingLabel = useMemo(() => ratingValue.toFixed(1), [ratingValue])

  const statusColors: Record<string, string> = {
    'ongoing': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'completed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'hiatus': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'dropped': 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const statusClass = statusColors[webtoon.status?.toLowerCase()] || 'bg-surface/80 text-textMuted border-border/50'

  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardVariants}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-panel/90 shadow-card backdrop-blur-sm"
    >
      {/* Image Container */}
      <button
        type="button"
        onClick={() => onSelect(webtoon)}
        className="relative h-52 w-full overflow-hidden"
        aria-label={`Ouvrir ${webtoon.title}`}
      >
        {/* Image */}
        <motion.img
          variants={imageVariants}
          src={!imageError ? webtoon.image_url : FALLBACK_IMAGE}
          onError={() => setImageError(true)}
          loading="lazy"
          alt={`Illustration du webtoon ${webtoon.title}`}
          className="h-full w-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
        
        {/* Hover Glow Effect */}
        <motion.div 
          variants={overlayVariants}
          className="absolute inset-0 bg-gradient-to-t from-accent/20 via-transparent to-transparent"
        />

        {/* Top Badges */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          <span className="badge-accent text-[0.65rem]">
            {webtoon.type}
          </span>
          <span className={clsx('badge text-[0.65rem]', statusClass)}>
            {webtoon.status}
          </span>
        </div>

        {/* Rating Badge - Bottom Right */}
        <motion.div 
          variants={overlayVariants}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-sm"
        >
          <Star size={14} className="fill-accent text-accent" />
          <span className="text-sm font-bold text-white">{ratingLabel}</span>
        </motion.div>
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title & Link */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-lg font-semibold text-white leading-tight">
            {webtoon.title}
          </h3>
          <motion.a
            href={webtoon.link}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-colors hover:bg-accent/20"
          >
            <ExternalLink size={16} />
          </motion.a>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-widest text-textMuted">
          <span>{webtoon.language}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Ch. {webtoon.chapter}</span>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {stars.map((state, index) => (
            <Star
              key={`${webtoon.id}-star-${index}`}
              size={14}
              className={clsx(
                'transition-colors',
                state === 'full' && 'fill-accent text-accent',
                state === 'half' && 'fill-accent/50 text-accent',
                state === 'empty' && 'text-border'
              )}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-textMuted">{ratingLabel}/5</span>
        </div>

        {/* Source & Date */}
        <div className="space-y-1 text-xs text-textMuted/70">
          <div className="truncate">{prettifyLink(webtoon.link)}</div>
          <div>
            Màj : <span className="text-textMuted">{formatDate(webtoon.updated_at ?? webtoon.last_read_date)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/30">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(webtoon)}
            className="btn-primary py-2 px-4 text-xs"
          >
            Voir détails
          </motion.button>
          
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(webtoon)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-surface/70 text-textMuted transition-all hover:border-accent/30 hover:text-accent"
                aria-label="Modifier"
              >
                <PencilLine size={15} />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(webtoon)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-surface/70 text-textMuted transition-all hover:border-danger/50 hover:text-danger"
                aria-label="Supprimer"
              >
                <Trash2 size={15} />
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
