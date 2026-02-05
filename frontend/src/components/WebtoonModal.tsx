import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { ExternalLink, PencilLine, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Webtoon } from '@/types/webtoon'
import { formatDate, prettifyLink } from '@/utils/format'

type WebtoonModalProps = {
  webtoon: Webtoon | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (webtoon: Webtoon) => void
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const dialog = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 }
}

const dialogDesktop = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0 }
}

const WebtoonModal = ({ webtoon, isOpen, onClose, onEdit }: WebtoonModalProps) => {
  const [imageError, setImageError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) setImageError(false)
  }, [isOpen, webtoon?.id])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const ratingValue = Number.isFinite(webtoon?.rating ?? NaN) ? (webtoon?.rating as number) : 0
  const shouldRender = isOpen && Boolean(webtoon)

  return (
    <AnimatePresence>
      {shouldRender && webtoon && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-2xl sm:items-center sm:px-6 lg:px-12"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card scrollbar-thin relative grid max-h-[100dvh] w-full grid-cols-1 overflow-hidden rounded-t-3xl border border-accent/20 sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl lg:grid-cols-[320px_1fr]"
            variants={isMobile ? dialog : dialogDesktop}
            transition={isMobile ? { type: 'spring', stiffness: 300, damping: 30 } : { type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile drag indicator */}
            <div className="flex justify-center py-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-muted/60" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/40 bg-background/80 text-textLight/60 transition hover:text-white sm:right-4 sm:top-4"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="relative h-48 w-full overflow-hidden border-b border-muted/40 sm:h-72 lg:h-full lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
              <img loading="lazy"
                src={!imageError ? webtoon.image_url : FALLBACK_IMAGE}
                alt={webtoon.title}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                <span className="inline-flex rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                  {webtoon.type}
                </span>
              </div>
            </div>

            <div className="scrollbar-thin flex flex-col gap-4 overflow-y-auto px-4 pb-8 pt-4 sm:gap-6 sm:px-8 sm:pb-10 sm:pt-8" style={{ maxHeight: 'calc(100dvh - 13rem)' }}>
              <div className="flex flex-col gap-2 sm:gap-3">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">{webtoon.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-textLight/60 sm:gap-3 sm:text-sm">
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent sm:px-3">
                    {webtoon.status}
                  </span>
                  <span className="rounded-full border border-muted/50 px-2.5 py-1 sm:px-3">{webtoon.language}</span>
                  <span className="rounded-full border border-muted/50 px-2.5 py-1 sm:px-3">
                    Ch.&nbsp;{webtoon.chapter}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <dl className="space-y-2 text-sm sm:space-y-3">
                  <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 px-3 py-2.5 sm:px-4 sm:py-3">
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Note</dt>
                    <dd className="text-lg font-semibold text-accent">
                      {ratingValue.toFixed(1)} <span className="text-sm text-textLight/60">/ 5</span>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 px-3 py-2.5 sm:px-4 sm:py-3">
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Dernière lecture</dt>
                    <dd className="text-sm text-textLight/70">{formatDate(webtoon.last_read_date)}</dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-muted/40 bg-surface/70 px-3 py-3 sm:px-4 sm:py-4">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Lien</span>
                    <motion.a
                      href={webtoon.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-white sm:mt-2 sm:text-sm"
                      whileHover={{ x: 2 }}
                    >
                      <span className="truncate">{prettifyLink(webtoon.link)}</span>
                      <ExternalLink size={14} className="flex-shrink-0" />
                    </motion.a>
                  </div>
                  <button
                    type="button"
                    disabled={!onEdit}
                    onClick={() => onEdit?.(webtoon)}
                    className={clsx(
                      'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:py-3',
                      onEdit
                        ? 'bg-gradient-to-r from-accent to-accentSoft text-white hover:brightness-105'
                        : 'cursor-not-allowed bg-muted/40 text-textLight/40'
                    )}
                  >
                    <PencilLine size={18} />
                    Modifier
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-muted/40 bg-surface/70 px-4 py-3 text-sm text-textLight/70 sm:px-5 sm:py-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Commentaire</p>
                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed sm:mt-2 sm:text-sm">
                  {webtoon.comment?.trim() ? webtoon.comment : 'Aucun commentaire.'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WebtoonModal
