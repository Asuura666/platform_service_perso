import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { Loader2, PlusCircle, Save, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'

type FieldErrors = Partial<Record<keyof WebtoonPayload, string>>

type AddWebtoonModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: WebtoonPayload, id?: number) => Promise<void> | void
  webtoon?: Webtoon | null
}

const types = ['Webtoon', 'Manhwa', 'Manhua', 'Action', 'Fantaisie', 'Romance', 'Sport', 'Thriller', 'Slice of life', 'Science-fiction', 'Autre']
const statuses = ['En cours', 'Terminé', 'Hiatus', 'À découvrir']
const languages = ['Français', 'Anglais', 'Coréen', 'Japonais', 'Chinois']

const emptyForm: WebtoonPayload = {
  title: '',
  type: types[0],
  language: languages[0],
  rating: 3.5,
  chapter: 1,
  link: '',
  status: statuses[0],
  last_read_date: null,
  comment: '',
  image_url: ''
}

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const dialog = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 }
}

const dialogDesktop = {
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 }
}

const AddWebtoonModal = ({ isOpen, onClose, onSubmit, webtoon }: AddWebtoonModalProps) => {
  const [form, setForm] = useState<WebtoonPayload>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setErrors({})
      setSubmitting(false)
      setForm((previous) => ({
        ...previous,
        ...(webtoon
          ? {
              title: webtoon.title,
              type: webtoon.type,
              language: webtoon.language,
              rating: Number.isFinite(webtoon.rating) ? webtoon.rating : 0,
              chapter: webtoon.chapter,
              link: webtoon.link,
              status: webtoon.status,
              last_read_date: webtoon.last_read_date,
              comment: webtoon.comment ?? '',
              image_url: webtoon.image_url
            }
          : emptyForm)
      }))
    } else {
      document.body.style.overflow = ''
      setForm(emptyForm)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, webtoon])

  const mode = useMemo(() => (webtoon ? 'edit' : 'create'), [webtoon])

  const validate = (values: WebtoonPayload): FieldErrors => {
    const nextErrors: FieldErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Le titre est requis.'
    if (values.rating < 0 || values.rating > 5) nextErrors.rating = 'Note entre 0 et 5.'
    if (!Number.isFinite(values.rating)) nextErrors.rating = 'La note doit être un nombre.'
    if (!Number.isFinite(values.chapter) || values.chapter <= 0) nextErrors.chapter = 'Chapitre requis.'
    return nextErrors
  }

  const handleChange = (field: keyof WebtoonPayload, value: string) => {
    setForm((prev) => {
      if (field === 'rating') return { ...prev, rating: Number(value) }
      if (field === 'chapter') return { ...prev, chapter: Number(value) }
      if (field === 'last_read_date') return { ...prev, last_read_date: value || null }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      await onSubmit(form, webtoon?.id)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xl sm:items-center sm:px-6 lg:px-12"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            className="glass-card relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-accent/20 sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl"
            variants={isMobile ? dialog : dialogDesktop}
            transition={isMobile ? { type: 'spring', stiffness: 300, damping: 30 } : { type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
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

            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-8 sm:pb-8 sm:pt-6">
              <header className="mb-4 sm:mb-6">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-accent/70 sm:text-xs">
                  {mode === 'create' ? 'Ajouter un webtoon' : 'Modifier le webtoon'}
                </span>
                <h2 className="mt-1 text-xl font-semibold text-white sm:mt-2 sm:text-2xl md:text-3xl">
                  {mode === 'create' ? 'Nouvelle entrée' : `${webtoon?.title}`}
                </h2>
                <p className="mt-1 text-xs text-textLight/60 sm:text-sm">
                  Complétez les informations pour votre bibliothèque.
                </p>
              </header>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Titre</label>
                  <input
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    placeholder="Titre du webtoon"
                    className={clsx(
                      'rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3',
                      errors.title && 'border-red-500/60'
                    )}
                  />
                  {errors.title && <span className="text-xs text-red-400/90">{errors.title}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Lien</label>
                  <input
                    value={form.link}
                    onChange={(event) => handleChange('link', event.target.value)}
                    placeholder="https://..."
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Image URL</label>
                  <input
                    value={form.image_url}
                    onChange={(event) => handleChange('image_url', event.target.value)}
                    placeholder="https://..."
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Type</label>
                  <select
                    value={form.type}
                    onChange={(event) => handleChange('type', event.target.value)}
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  >
                    {types.map((t) => (
                      <option key={t} value={t} className="bg-background text-textLight">{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Langue</label>
                  <select
                    value={form.language}
                    onChange={(event) => handleChange('language', event.target.value)}
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l} className="bg-background text-textLight">{l}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Statut</label>
                  <select
                    value={form.status}
                    onChange={(event) => handleChange('status', event.target.value)}
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="bg-background text-textLight">{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Chapitre</label>
                  <input
                    type="number"
                    min={1}
                    value={form.chapter}
                    onChange={(event) => handleChange('chapter', event.target.value)}
                    className={clsx(
                      'rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3',
                      errors.chapter && 'border-red-500/60'
                    )}
                  />
                  {errors.chapter && <span className="text-xs text-red-400/90">{errors.chapter}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Note (/5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    value={form.rating}
                    onChange={(event) => handleChange('rating', event.target.value)}
                    className={clsx(
                      'rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3',
                      errors.rating && 'border-red-500/60'
                    )}
                  />
                  {errors.rating && <span className="text-xs text-red-400/90">{errors.rating}</span>}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Date de lecture</label>
                  <input
                    type="date"
                    value={form.last_read_date ? new Date(form.last_read_date).toISOString().substring(0, 10) : ''}
                    onChange={(event) => handleChange('last_read_date', event.target.value)}
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 sm:gap-2">
                  <label className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-textLight/40 sm:text-xs">Commentaire</label>
                  <textarea
                    value={form.comment ?? ''}
                    onChange={(event) => handleChange('comment', event.target.value)}
                    rows={3}
                    placeholder="Vos notes de lecture..."
                    className="rounded-2xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none sm:px-4 sm:py-3"
                  />
                </div>
              </div>
            </div>

            {/* Fixed bottom buttons */}
            <div className="flex flex-col-reverse gap-2 border-t border-muted/30 bg-background/80 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-8 sm:py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-muted/60 px-4 py-2.5 text-sm font-semibold text-textLight/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 sm:py-3"
              >
                Annuler
              </button>
              <motion.button
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                type="submit"
                disabled={submitting}
                className={clsx(
                  'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-2.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:py-3',
                  submitting && 'cursor-not-allowed opacity-60'
                )}
              >
                {submitting ? (
                  <><Loader2 className="animate-spin" size={18} /> Enregistrement...</>
                ) : mode === 'create' ? (
                  <><PlusCircle size={18} /> Ajouter</>
                ) : (
                  <><Save size={18} /> Mettre à jour</>
                )}
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddWebtoonModal
