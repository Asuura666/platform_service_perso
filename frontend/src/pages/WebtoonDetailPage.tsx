import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  Globe,
  Loader2,
  MessageSquare,
  PencilLine,
  Star,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '@/api/client'
import { useAuth } from '@/providers/AuthProvider'
import { formatDate, prettifyLink } from '@/utils/format'
import { notifyError, notifySuccess } from '@/utils/notificationBus'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'
import AddWebtoonModal from '@/components/AddWebtoonModal'
import { deleteWebtoon, updateWebtoon } from '@/api/webtoons'

const WebtoonDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, hasFeature } = useAuth()
  const [webtoon, setWebtoon] = useState<Webtoon | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchWebtoon = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get<Webtoon>(`/webtoons/${id}/`)
      setWebtoon(data)
    } catch {
      setError('Impossible de charger ce webtoon.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchWebtoon()
  }, [fetchWebtoon])

  const handleUpdate = async (_id: number | undefined, payload: WebtoonPayload) => {
    if (!webtoon) return
    try {
      const updated = await updateWebtoon(webtoon.id, payload)
      setWebtoon(updated)
      setIsEditOpen(false)
      notifySuccess('Webtoon mis à jour.')
    } catch {
      notifyError('Erreur lors de la mise à jour.')
    }
  }

  const handleDelete = async () => {
    if (!webtoon || deleting) return
    if (!window.confirm(`Supprimer "${webtoon.title}" ?`)) return
    setDeleting(true)
    try {
      await deleteWebtoon(webtoon.id)
      notifySuccess('Webtoon supprimé.')
      navigate('/webtoons', { replace: true })
    } catch {
      notifyError('Erreur lors de la suppression.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-muted/40 bg-panel/70">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (error || !webtoon) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-12 text-center">
        <AlertTriangle size={28} className="text-yellow-300" />
        <p className="text-lg font-semibold text-white">{error ?? 'Webtoon introuvable'}</p>
        <button
          onClick={() => navigate('/webtoons')}
          className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/25"
        >
          Retour à la bibliothèque
        </button>
      </div>
    )
  }

  const rating = Number.isFinite(webtoon.rating) ? webtoon.rating : 0
  const FALLBACK = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/webtoons')}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-textLight/60 transition hover:text-white"
      >
        <ArrowLeft size={16} /> Bibliothèque
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-accent/20 bg-panel/80 shadow-panel"
      >
        <div className="relative h-48 w-full overflow-hidden sm:h-64 lg:h-80">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />
          <img
            src={webtoon.image_url || FALLBACK}
            alt={webtoon.title}
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
                {webtoon.type}
              </span>
              <span className="rounded-full bg-black/50 border border-muted/50 px-3 py-1 text-xs font-semibold text-white/80">
                {webtoon.status}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">{webtoon.title}</h1>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-textLight/40">
                <Star size={14} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest sm:text-xs">Note</span>
              </div>
              <span className="text-xl font-semibold text-accent">{rating.toFixed(1)}<span className="text-sm text-textLight/50">/5</span></span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-textLight/40">
                <BookOpen size={14} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest sm:text-xs">Chapitre</span>
              </div>
              <span className="text-xl font-semibold text-white">{webtoon.chapter}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-textLight/40">
                <Globe size={14} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest sm:text-xs">Langue</span>
              </div>
              <span className="text-sm font-semibold text-white">{webtoon.language}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-muted/40 bg-surface/70 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-textLight/40">
                <Calendar size={14} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest sm:text-xs">Dernière lecture</span>
              </div>
              <span className="text-sm font-semibold text-white">{formatDate(webtoon.last_read_date)}</span>
            </div>
          </div>

          {/* Link */}
          {webtoon.link && (
            <a
              href={webtoon.link}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
            >
              <ExternalLink size={16} />
              {prettifyLink(webtoon.link)}
            </a>
          )}

          {/* Comment */}
          <div className="mt-4 rounded-2xl border border-muted/40 bg-surface/70 p-4">
            <div className="flex items-center gap-2 text-textLight/40 mb-2">
              <MessageSquare size={14} />
              <span className="text-xs font-semibold uppercase tracking-widest">Commentaire</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-textLight/70">
              {webtoon.comment?.trim() || 'Aucun commentaire.'}
            </p>
          </div>

          {/* Actions */}
          {isAuthenticated && hasFeature('webtoon_management') && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <PencilLine size={16} /> Modifier
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 size={16} /> {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-textLight/40">
            <span>Créé le {formatDate(webtoon.created_at)}</span>
            <span>Mis à jour le {formatDate(webtoon.updated_at)}</span>
          </div>
        </div>
      </motion.div>

      <AddWebtoonModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(payload) => handleUpdate(webtoon.id, payload)}
        webtoon={webtoon}
      />
    </div>
  )
}

export default WebtoonDetailPage
