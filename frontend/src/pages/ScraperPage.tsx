import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCcw } from 'lucide-react'
import { launchScraper, getScrapeHistory, getScrapeStatus, type ScrapeJob } from '@/api/scraper'
import { useLayout } from '@/components/Layout'
import { useAuth } from '@/providers/AuthProvider'

const statusColors: Record<string, string> = {
  success: 'text-emerald-400',
  failed: 'text-red-400',
  running: 'text-accent',
  pending: 'text-textLight/60'
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={18} />
    case 'failed':
      return <AlertTriangle size={18} />
    case 'running':
      return <Loader2 size={18} className="animate-spin" />
    default:
      return <Clock size={18} />
  }
}

const ScraperPage = () => {
  const { openAuthModal } = useLayout()
  const { isAuthenticated, loading: authLoading, hasFeature } = useAuth()
  const [url, setUrl] = useState('')
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [currentJob, setCurrentJob] = useState<ScrapeJob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canUseScraper = hasFeature('scraper_access')

  const refreshHistory = async () => {
    if (!isAuthenticated || !canUseScraper) return
    try {
      const history = await getScrapeHistory()
      setJobs(history)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !canUseScraper) {
      setJobs([])
      return
    }
    refreshHistory()
  }, [isAuthenticated, canUseScraper])

  const pollStatus = async (jobId: number) => {
    let attempts = 0
    const maxAttempts = 30
    while (attempts < maxAttempts) {
      try {
        const job = await getScrapeStatus(jobId)
        setCurrentJob(job)
        setJobs((prev) => {
          const others = prev.filter((item) => item.id !== job.id)
          return [job, ...others].slice(0, 20)
        })
        if (job.status === 'success' || job.status === 'failed') {
          return
        }
      } catch (err) {
        console.error(err)
        return
      }
      attempts += 1
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAuthenticated) {
      openAuthModal()
      setError('Vous devez etre connecte pour lancer un scraping.')
      return
    }
    if (!canUseScraper) {
      setError("Votre compte n'a pas l'autorisation d'utiliser cette fonctionnalite.")
      return
    }
    if (!url.trim()) {
      setError("Merci de renseigner l'URL d'un webtoon.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const job = await launchScraper(url.trim())
      setCurrentJob(job)
      setJobs((prev) => [job, ...prev].slice(0, 20))
      setUrl('')
      pollStatus(job.id)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        openAuthModal()
        setError('Session expiree. Merci de vous reconnecter.')
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError("Impossible de lancer le scraping. Verifiez l'adresse et reessayez.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const currentStatus = useMemo(() => currentJob?.status ?? 'pending', [currentJob])

  if (authLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-muted/40 bg-panel/70">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="glass-card flex flex-col items-center gap-4 rounded-3xl border border-accent/20 px-6 py-12 text-center shadow-panel">
        <AlertTriangle size={28} className="text-accent" />
        <h2 className="text-2xl font-semibold text-white">Connectez-vous pour utiliser le scraper</h2>
        <p className="max-w-xl text-sm text-textLight/60">
          L&apos;outil de scraping necessite un compte authentifie. Connectez-vous pour lancer des imports et consulter
          votre historique.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Se connecter
        </button>
      </div>
    )
  }

  if (!canUseScraper) {
    return (
      <div className="flex flex-col gap-6 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-10 text-center text-sm text-yellow-100">
        <AlertTriangle size={26} className="mx-auto text-yellow-300" />
        <h2 className="text-2xl font-semibold text-white">Acces au scraper restreint</h2>
        <p>
          Votre compte ne dispose pas encore des droits necessaires pour utiliser cette fonctionnalite. Contactez un administrateur afin d&apos;obtenir l&apos;acces.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-card rounded-3xl border border-accent/20 p-6 shadow-panel lg:p-8">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold text-white">Lancer un scraping</h2>
          <p className="text-sm text-textLight/60">
            Collez l&apos;URL d&apos;un webtoon pour importer automatiquement les chapitres et images associes.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
            URL du webtoon
          </label>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <motion.button
              type="submit"
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.96 }}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Lancement...
                </>
              ) : (
                <>
                  <RefreshCcw size={18} />
                  Lancer le scraping
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={refreshHistory}
              className="rounded-2xl border border-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-textLight/50 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Actualiser
            </button>
          </div>
        </form>
      </section>

      {currentJob && (
        <section className="rounded-3xl border border-muted/40 bg-panel/80 p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-white">Tache courante</h3>
          <div className="mt-4 rounded-2xl border border-muted/40 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 text-sm font-semibold ${statusColors[currentStatus] ?? ''}`}>
                {statusIcon(currentStatus)}
                {currentStatus.toUpperCase()}
              </span>
              {currentJob.duration && <span className="text-xs text-textLight/50">{currentJob.duration}</span>}
            </div>
            <p className="mt-2 text-sm text-textLight/70">{currentJob.url}</p>
            {currentJob.webtoon_title && (
              <p className="mt-1 text-sm text-textLight/60">Webtoon importe : {currentJob.webtoon_title}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-textLight/50">
              <span>{currentJob.chapters_scraped} chapitres</span>
              <span>{currentJob.images_downloaded} images</span>
              {currentJob.media_root && <span>Dossier : {currentJob.media_root}</span>}
            </div>
            {currentJob.message && <p className="mt-3 text-xs text-textLight/60">{currentJob.message}</p>}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-muted/40 bg-panel/80 p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-white">Historique des scrapes</h3>
        <div className="mt-4 flex flex-col gap-3">
          {jobs.length === 0 && <p className="text-sm text-textLight/60">Aucun scraping execute pour le moment.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-muted/40 bg-surface/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-2 text-sm font-semibold ${statusColors[job.status] ?? ''}`}>
                  {statusIcon(job.status)}
                  {job.status.toUpperCase()}
                </span>
                <span className="text-xs text-textLight/50">{new Date(job.created_at).toLocaleString('fr-FR')}</span>
              </div>
              <p className="mt-2 text-sm text-textLight/70">{job.url}</p>
              {job.webtoon_title && (
                <p className="mt-1 text-sm text-textLight/60">Webtoon : {job.webtoon_title}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-textLight/50">
                <span>{job.chapters_scraped} chapitres</span>
                <span>{job.images_downloaded} images</span>
                {job.duration && <span>Duree : {job.duration}</span>}
              </div>
              {job.message && <p className="mt-2 text-xs text-textLight/60">{job.message}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ScraperPage
