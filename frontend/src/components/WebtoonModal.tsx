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
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0 }
}

const WebtoonModal = ({ webtoon, isOpen, onClose, onEdit }: WebtoonModalProps) => {
  const [imageError, setImageError] = useState(false)

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

  const ratingValue = Number.isFinite(webtoon?.rating ?? NaN) ? (webtoon?.rating as number) : 0
  const shouldRender = isOpen && Boolean(webtoon)

  return (
    <AnimatePresence>
      {shouldRender && webtoon && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl px-4 py-10 sm:px-6 lg:px-12"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card relative grid max-h-[90vh] w-full max-w-5xl grid-cols-1 overflow-hidden border border-accent/20 shadow-glow lg:grid-cols-[320px_1fr]"
            variants={dialog}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/40 bg-background/80 text-textLight/60 transition hover:text-white"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="relative h-72 w-full overflow-hidden border-b border-muted/40 lg:h-full lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
              <img
                src={!imageError ? webtoon.image_url : FALLBACK_IMAGE}
                alt={webtoon.title}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 p-6">
                <span className="inline-flex rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                  {webtoon.type}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-10 pt-8 sm:px-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-3xl font-semibold text-white lg:text-4xl">{webtoon.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-textLight/60">
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-accent">
                    Statut&nbsp;: {webtoon.status}
                  </span>
                  <span className="rounded-full border border-muted/50 px-3 py-1">Langue&nbsp;: {webtoon.language}</span>
                  <span className="rounded-full border border-muted/50 px-3 py-1">
                    Chapitre&nbsp;{webtoon.chapter}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <dl className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Note</dt>
                    <dd className="text-lg font-semibold text-accent">
                      {ratingValue.toFixed(1)} <span className="text-sm text-textLight/60">/ 5</span>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Dernier chapitre</dt>
                    <dd className="text-sm text-textLight/70">{webtoon.chapter}</dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Dernière lecture</dt>
                    <dd className="text-sm text-textLight/70">{formatDate(webtoon.last_read_date)}</dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-muted/40 bg-surface/70 px-4 py-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Lien officiel</span>
                    <motion.a
                      href={webtoon.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-white"
                      whileHover={{ x: 2 }}
                    >
                      {prettifyLink(webtoon.link)}
                      <ExternalLink size={16} />
                    </motion.a>
                  </div>
                  <button
                    type="button"
                    disabled={!onEdit}
                    onClick={() => onEdit?.(webtoon)}
                    className={clsx(
                      'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-glow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      onEdit
                        ? 'bg-gradient-to-r from-accent to-accentSoft text-white hover:brightness-105'
                        : 'cursor-not-allowed bg-muted/40 text-textLight/40'
                    )}
                  >
                    <PencilLine size={18} />
                    Mettre à jour
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-muted/40 bg-surface/70 px-5 py-4 text-sm text-textLight/70">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Commentaire</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                  {webtoon.comment?.trim() ? webtoon.comment : 'Aucun commentaire pour le moment.'}
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
