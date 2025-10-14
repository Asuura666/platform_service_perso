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

const types = ['Action', 'Fantaisie', 'Romance', 'Sport', 'Thriller', 'Slice of life', 'Science-fiction', 'Autre']
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
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 }
}

const AddWebtoonModal = ({ isOpen, onClose, onSubmit, webtoon }: AddWebtoonModalProps) => {
  const [form, setForm] = useState<WebtoonPayload>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
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
      setForm(emptyForm)
    }
  }, [isOpen, webtoon])

  const mode = useMemo(() => (webtoon ? 'edit' : 'create'), [webtoon])

  const validate = (values: WebtoonPayload): FieldErrors => {
    const nextErrors: FieldErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Le titre est requis.'
    if (values.rating < 0 || values.rating > 5) nextErrors.rating = 'La note doit être comprise entre 0 et 5.'
    if (!Number.isFinite(values.rating)) nextErrors.rating = 'La note doit être un nombre.'
    if (!Number.isFinite(values.chapter) || values.chapter <= 0) nextErrors.chapter = 'Merci de préciser le chapitre.'
    return nextErrors
  }

  const handleChange = (field: keyof WebtoonPayload, value: string) => {
    setForm((prev) => {
      if (field === 'rating') {
        return { ...prev, rating: Number(value) }
      }
      if (field === 'chapter') {
        return { ...prev, chapter: Number(value) }
      }
      if (field === 'last_read_date') {
        return { ...prev, last_read_date: value || null }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(form, webtoon?.id)
    } finally {
      setSubmitting(false)
    }
  }

  const shouldRender = isOpen

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl px-4 py-10 sm:px-6 lg:px-12"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            className="glass-card relative w-full max-w-3xl overflow-hidden border border-accent/20 px-6 py-8 shadow-glow sm:px-8"
            variants={dialog}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
          >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/40 bg-background/80 text-textLight/60 transition hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
          <header className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-accent/70">
              {mode === 'create' ? 'Ajouter un webtoon' : 'Modifier le webtoon'}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {mode === 'create' ? 'Nouvelle entrée' : `Mettre à jour ${webtoon?.title}`}
            </h2>
            <p className="text-sm text-textLight/60">
              Complétez les informations essentielles pour enrichir votre bibliothèque Webtoon Book.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Titre</label>
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="Titre du webtoon"
                className={clsx(
                  'rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none',
                  errors.title && 'border-red-500/60'
                )}
              />
              {errors.title && <span className="text-xs text-red-400/90">{errors.title}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
                Lien (optionnel)
              </label>
              <input
                value={form.link}
                onChange={(event) => handleChange('link', event.target.value)}
                placeholder="https://..."
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
              <span className="text-xs text-textLight/40">Laissez vide si vous n&apos;avez pas de lien direct.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
                URL de l&apos;image (optionnelle)
              </label>
              <input
                value={form.image_url}
                onChange={(event) => handleChange('image_url', event.target.value)}
                placeholder="https://..."
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
              <span className="text-xs text-textLight/40">Saisissez une image de couverture si vous en avez une.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Type</label>
              <select
                value={form.type}
                onChange={(event) => handleChange('type', event.target.value)}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              >
                {types.map((typeOption) => (
                  <option key={typeOption} value={typeOption} className="bg-background text-textLight">
                    {typeOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Langue</label>
              <select
                value={form.language}
                onChange={(event) => handleChange('language', event.target.value)}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              >
                {languages.map((languageOption) => (
                  <option key={languageOption} value={languageOption} className="bg-background text-textLight">
                    {languageOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Statut</label>
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              >
                {statuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption} className="bg-background text-textLight">
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Chapitre</label>
              <input
                type="number"
                min={1}
                value={form.chapter}
                onChange={(event) => handleChange('chapter', event.target.value)}
                className={clsx(
                  'rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none',
                  errors.chapter && 'border-red-500/60'
                )}
              />
              {errors.chapter && <span className="text-xs text-red-400/90">{errors.chapter}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Note (/5)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={form.rating}
                onChange={(event) => handleChange('rating', event.target.value)}
                className={clsx(
                  'rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none',
                  errors.rating && 'border-red-500/60'
                )}
              />
              {errors.rating && <span className="text-xs text-red-400/90">{errors.rating}</span>}
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
                Date de lecture
              </label>
              <input
                type="date"
                value={form.last_read_date ? new Date(form.last_read_date).toISOString().substring(0, 10) : ''}
                onChange={(event) => handleChange('last_read_date', event.target.value)}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
                Commentaire
              </label>
              <textarea
                value={form.comment ?? ''}
                onChange={(event) => handleChange('comment', event.target.value)}
                rows={4}
                placeholder="Vos notes de lecture, ressentis, suivi..."
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-muted/60 px-5 py-3 text-sm font-semibold text-textLight/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Annuler
            </button>
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              type="submit"
              disabled={submitting}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-6 py-3 text-sm font-semibold text-white shadow-glow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                submitting && 'cursor-not-allowed opacity-60'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Enregistrement...
                </>
              ) : mode === 'create' ? (
                <>
                  <PlusCircle size={18} />
                  Ajouter
                </>
              ) : (
                <>
                  <Save size={18} />
                  Mettre à jour
                </>
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
