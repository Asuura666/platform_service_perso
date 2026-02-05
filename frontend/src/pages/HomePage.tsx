import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, LogIn, Play, Star, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useLayout } from '@/components/Layout'
import apiClient from '@/api/client'
import type { Webtoon } from '@/types/webtoon'

type Section = { title: string; icon: React.ReactNode; webtoons: Webtoon[] }

const FALLBACK = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80'

const HeroSlide = ({ webtoon, onNavigate }: { webtoon: Webtoon; onNavigate: (id: number) => void }) => (
  <div className="relative h-[60vh] min-h-[360px] w-full overflow-hidden sm:h-[55vh]">
    <img
      src={webtoon.image_url || FALLBACK}
      alt={webtoon.title}
      className="absolute inset-0 h-full w-full object-cover"
      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-12">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded bg-accent px-2 py-0.5 font-semibold text-white">{webtoon.type}</span>
        <span className="text-textMuted">{webtoon.language}</span>
        <span className="text-textMuted">•</span>
        <span className="text-textMuted">Ch. {webtoon.chapter}</span>
        {webtoon.rating > 0 && (
          <>
            <span className="text-textMuted">•</span>
            <span className="flex items-center gap-1 text-accentAmber"><Star size={12} fill="currentColor" />{webtoon.rating.toFixed(1)}</span>
          </>
        )}
      </div>
      <h1 className="mt-2 max-w-xl text-2xl font-bold text-white sm:text-4xl lg:text-5xl">{webtoon.title}</h1>
      {webtoon.comment && (
        <p className="mt-2 line-clamp-2 max-w-lg text-sm text-textLight/70">{webtoon.comment}</p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => onNavigate(webtoon.id)}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 active:scale-95"
        >
          <Play size={16} fill="currentColor" /> Continuer Ch.{webtoon.chapter}
        </button>
        {webtoon.link && (
          <a
            href={webtoon.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Lire en ligne
          </a>
        )}
      </div>
    </div>
  </div>
)

const Carousel = ({ title, icon, webtoons, onNavigate }: Section & { onNavigate: (id: number) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (webtoons.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon} {title}
        </h2>
        <span className="text-xs text-textMuted">{webtoons.length} titres</span>
      </div>
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-10"
      >
        {webtoons.map((w) => (
          <motion.button
            key={w.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate(w.id)}
            className="group relative flex-shrink-0 overflow-hidden rounded-lg"
            style={{ width: 140 }}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface">
              <img
                src={w.image_url || FALLBACK}
                alt={w.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-card opacity-0 transition-opacity group-hover:opacity-100" />
              {w.rating > 0 && (
                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold text-accentAmber">
                  <Star size={9} fill="currentColor" />{w.rating.toFixed(1)}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                <span className="text-[0.6rem] font-medium text-accent">Ch. {w.chapter}</span>
              </div>
            </div>
            <p className="mt-1.5 line-clamp-2 text-left text-xs font-medium text-textLight/80">{w.title}</p>
          </motion.button>
        ))}
      </div>
    </section>
  )
}

const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, hasFeature } = useAuth()
  const { registerAddHandler, openAuthModal } = useLayout()
  const [hero, setHero] = useState<Webtoon | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { registerAddHandler(null) }, [registerAddHandler])

  const goTo = useCallback((id: number) => navigate(`/webtoons/${id}`), [navigate])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !hasFeature('webtoon_management')) return
    let cancelled = false

    const load = async () => {
      try {
        const [reading, topRated, completed] = await Promise.all([
          apiClient.get('/webtoons/', { params: { search: 'En cours', ordering: '-updated_at', page_size: 20 } }),
          apiClient.get('/webtoons/', { params: { ordering: '-rating', page_size: 20 } }),
          apiClient.get('/webtoons/', { params: { search: 'Terminé', ordering: '-updated_at', page_size: 20 } }),
        ])
        if (cancelled) return

        const readingList: Webtoon[] = reading.data.results ?? []
        const topList: Webtoon[] = topRated.data.results ?? []
        const completedList: Webtoon[] = completed.data.results ?? []

        // Pick a random hero from top rated that has an image
        const heroPool = topList.filter(w => w.image_url)
        setHero(heroPool.length > 0 ? heroPool[Math.floor(Math.random() * Math.min(5, heroPool.length))] : readingList[0] ?? null)

        setSections([
          { title: 'En cours de lecture', icon: <BookOpen size={20} className="text-accent" />, webtoons: readingList },
          { title: 'Les mieux notés', icon: <Star size={20} className="text-accentAmber" />, webtoons: topList.filter(w => w.rating > 0) },
          { title: 'Terminés', icon: <TrendingUp size={20} className="text-green-400" />, webtoons: completedList },
        ])
        setLoaded(true)
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [authLoading, isAuthenticated, hasFeature])

  if (authLoading) return null

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
          <BookOpen size={36} className="text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Webtoon Book</h1>
        <p className="max-w-md text-textMuted">
          Suivez vos lectures de manhwa, manhua et manga. Votre bibliothèque personnelle, accessible partout.
        </p>
        <button
          onClick={openAuthModal}
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent/90"
        >
          <LogIn size={18} /> Se connecter
        </button>
      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-6 flex flex-col gap-6 pb-8 sm:-mx-6 lg:-mx-10">
      {hero && <HeroSlide webtoon={hero} onNavigate={goTo} />}
      {sections.map((s) => (
        <Carousel key={s.title} {...s} onNavigate={goTo} />
      ))}
      {loaded && sections.every(s => s.webtoons.length === 0) && (
        <div className="px-4 py-12 text-center">
          <p className="text-lg font-semibold text-white">Votre bibliothèque est vide</p>
          <p className="mt-1 text-sm text-textMuted">Ajoutez des webtoons depuis la page Bibliothèque.</p>
          <button
            onClick={() => navigate('/webtoons')}
            className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Aller à la bibliothèque <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
