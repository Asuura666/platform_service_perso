import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, LogIn, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios, { AxiosError } from 'axios'
import AddWebtoonModal from '@/components/AddWebtoonModal'
import { useLayout } from '@/components/Layout'
import WebtoonCard from '@/components/WebtoonCard'
import WebtoonGridSkeleton from '@/components/skeletons/WebtoonGridSkeleton'
import { createWebtoon, deleteWebtoon, getWebtoons, updateWebtoon } from '@/api/webtoons'
import { useAuth } from '@/providers/AuthProvider'
import { useDebounce } from '@/hooks/useDebounce'
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from '@/utils/notificationBus'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'

const WEBTOON_CACHE_TTL = 60_000
type WebtoonCacheEntry = {
  timestamp: number
  webtoons: Webtoon[]
  totalCount: number
  hasMore: boolean
  currentPage: number
}

const webtoonCache = new Map<number, WebtoonCacheEntry>()

const getCachedWebtoons = (userId: number | undefined) => {
  if (!userId) return null
  const entry = webtoonCache.get(userId)
  if (!entry) return null
  if (Date.now() - entry.timestamp > WEBTOON_CACHE_TTL) {
    webtoonCache.delete(userId)
    return null
  }
  return entry
}

const setCachedWebtoons = (userId: number | undefined, payload: Partial<WebtoonCacheEntry>) => {
  if (!userId) return
  const existing = webtoonCache.get(userId) ?? {
    timestamp: 0,
    webtoons: [],
    totalCount: 0,
    hasMore: false,
    currentPage: 1
  }
  webtoonCache.set(userId, {
    ...existing,
    ...payload,
    timestamp: Date.now()
  })
}

const invalidateCachedWebtoons = (userId: number | undefined) => {
  if (!userId) return
  webtoonCache.delete(userId)
}

const mergeWebtoonLists = (current: Webtoon[], incoming: Webtoon[]) => {
  if (!current.length) return incoming
  if (!incoming.length) return current

  const incomingById = new Map(incoming.map((item) => [item.id, item]))
  const updated = current.map((item) => incomingById.get(item.id) ?? item)
  const existingIds = new Set(updated.map((item) => item.id))
  incoming.forEach((item) => {
    if (!existingIds.has(item.id)) {
      updated.push(item)
    }
  })
  return updated
}

const WebtoonPage = () => {
  const { searchValue, registerAddHandler, openAuthModal } = useLayout()
  const debouncedSearch = useDebounce(searchValue, 400)
  const { isAuthenticated, loading: authLoading, hasFeature, user } = useAuth()
  const [webtoons, setWebtoons] = useState<Webtoon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingWebtoon, setEditingWebtoon] = useState<Webtoon | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const canManageWebtoons = hasFeature('webtoon_management')
  const webtoonsRef = useRef<Webtoon[]>([])
  const activeRequestRef = useRef<AbortController | null>(null)

  const ensureAuthenticated = useCallback(() => {
    if (!isAuthenticated) {
      setError('Veuillez vous connecter pour gerer vos webtoons.')
      notifyWarning('Connectez-vous pour gerer vos webtoons.')
      openAuthModal()
      return false
    }
    if (!canManageWebtoons) {
      setError("Votre compte n'a pas l'autorisation de gerer les webtoons.")
      notifyWarning("Vous n'avez pas les droits necessaires pour gerer les webtoons.")
      return false
    }
    return true
  }, [isAuthenticated, canManageWebtoons, openAuthModal])

  const fetchWebtoons = useCallback(
    async (
      {
        page = 1,
        append = false,
        background = false,
        merge = background
      }: { page?: number; append?: boolean; background?: boolean; merge?: boolean } = {}
    ) => {
      if (!isAuthenticated || !canManageWebtoons || !user?.id) return
      setError(null)

      if (!background) {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }
      }

      const controller = new AbortController()
      if (!append) {
        activeRequestRef.current?.abort()
      }
      activeRequestRef.current = controller

      try {
        const data = await getWebtoons({ page, search: debouncedSearch.trim() || undefined }, { signal: controller.signal })
        const incoming = data.results
        const merged = append
          ? mergeWebtoonLists(webtoonsRef.current, incoming)
          : merge
            ? mergeWebtoonLists(webtoonsRef.current, incoming)
            : incoming

        webtoonsRef.current = merged
        setWebtoons(merged)
        setTotalCount(data.count)
        setHasMore(Boolean(data.next))
        if (!background || append) {
          setCurrentPage(page)
        }

        setCachedWebtoons(user.id, {
          webtoons: merged,
          totalCount: data.count,
          hasMore: Boolean(data.next),
          ...(!background || append ? { currentPage: page } : {})
        })
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }
        let message = "Impossible de recuperer les webtoons depuis l'API."
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            message = 'Session expiree. Veuillez vous reconnecter.'
            openAuthModal()
          } else if (err.response?.status === 403) {
            message = "Acces refuse pour la gestion des webtoons."
          }
        }
        setError(message)
        notifyError(message)
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null
        }
        if (!background) {
          if (append) {
            setLoadingMore(false)
          } else {
            setLoading(false)
          }
        } else if (append) {
          setLoadingMore(false)
        }
      }
    },
    [isAuthenticated, canManageWebtoons, openAuthModal, user?.id, debouncedSearch]
  )

  useEffect(() => {
    if (!isAuthenticated || !canManageWebtoons || !user?.id) {
      activeRequestRef.current?.abort()
      setWebtoons([])
      webtoonsRef.current = []
      setTotalCount(0)
      setHasMore(false)
      setCurrentPage(1)
      setLoading(false)
      setLoadingMore(false)
      if (user?.id) {
        invalidateCachedWebtoons(user.id)
      } else {
        webtoonCache.clear()
      }
      return () => undefined
    }

    const cached = getCachedWebtoons(user.id)
    if (cached) {
      setWebtoons(cached.webtoons)
      webtoonsRef.current = cached.webtoons
      setTotalCount(cached.totalCount)
      setHasMore(cached.hasMore)
      setCurrentPage(cached.currentPage)
      setLoading(false)
      setLoadingMore(false)
      fetchWebtoons({ page: cached.currentPage, background: true, merge: true })
    } else {
      fetchWebtoons({ page: 1 })
    }

    return () => {
      activeRequestRef.current?.abort()
    }
  }, [fetchWebtoons, isAuthenticated, canManageWebtoons, user?.id])

  useEffect(() => {
    if (!canManageWebtoons) {
      registerAddHandler(null)
      return
    }
    registerAddHandler(() => {
      if (!ensureAuthenticated()) return
      setEditingWebtoon(null)
      setIsAddModalOpen(true)
    })
    return () => registerAddHandler(null)
  }, [registerAddHandler, ensureAuthenticated, canManageWebtoons])

  const filteredWebtoons = useMemo(() => {
    // Search is now server-side
    if (!searchValue.trim()) return webtoons
    const lower = searchValue.toLowerCase()
    return webtoons.filter((webtoon) =>
      [webtoon.title, webtoon.type, webtoon.status, webtoon.language].some((field) =>
        field.toLowerCase().includes(lower)
      )
    )
  }, [searchValue, webtoons])

  useEffect(() => {
    webtoonsRef.current = webtoons
  }, [webtoons])

  const handleCreate = async (payload: WebtoonPayload) => {
    if (!ensureAuthenticated()) return
    try {
      const created = await createWebtoon(payload)
      const nextList = [created, ...webtoonsRef.current]
      webtoonsRef.current = nextList
      setWebtoons(nextList)
      setIsAddModalOpen(false)
      const nextTotal = totalCount + 1
      setTotalCount(nextTotal)
      setCurrentPage(1)
      setCachedWebtoons(user?.id, {
        webtoons: nextList,
        totalCount: nextTotal,
        hasMore,
        currentPage: 1
      })
      notifySuccess('Webtoon ajoute avec succes.')
      fetchWebtoons({ page: 1, background: true, merge: true })
    } catch (err) {
      console.error(err)
      setError("L'ajout a echoue. Verifiez les informations et reessayez.")
      notifyError("L'ajout a echoue. Veuillez reessayer.")
    }
  }

  const handleUpdate = async (webtoonId: number | undefined, payload: WebtoonPayload) => {
    if (!ensureAuthenticated() || !webtoonId) return
    try {
      const updated = await updateWebtoon(webtoonId, payload)
      const nextList = webtoonsRef.current.map((item) => (item.id === webtoonId ? updated : item))
      webtoonsRef.current = nextList
      setWebtoons(nextList)
      setEditingWebtoon(null)
      setIsAddModalOpen(false)
      setCachedWebtoons(user?.id, { webtoons: nextList })
      notifySuccess('Webtoon mis a jour.')
      fetchWebtoons({ page: currentPage, background: true, merge: true })
    } catch (err) {
      console.error(err)
      setError('La mise a jour a echoue. Merci de reessayer.')
      notifyError('La mise a jour a echoue.')
    }
  }

  const handleDelete = async (webtoon: Webtoon) => {
    if (!ensureAuthenticated()) return
    try {
      await deleteWebtoon(webtoon.id)
      const nextList = webtoonsRef.current.filter((item) => item.id !== webtoon.id)
      webtoonsRef.current = nextList
      setWebtoons(nextList)
      const nextTotal = Math.max(0, totalCount - 1)
      setTotalCount(nextTotal)
      const targetPage = nextList.length === 0 && currentPage > 1 ? currentPage - 1 : currentPage
      setCachedWebtoons(user?.id, {
        webtoons: nextList,
        totalCount: nextTotal,
        hasMore: nextList.length > 0 ? hasMore : false
      })
      if (nextList.length === 0) {
        setHasMore(false)
        if (currentPage > 1) {
          setCurrentPage(targetPage)
          setCachedWebtoons(user?.id, { currentPage: targetPage })
        }
      }
      notifyInfo('Webtoon supprime.')
      fetchWebtoons({ page: targetPage, background: true, merge: true })
    } catch (err) {
      console.error(err)
      setError('La suppression a echoue.')
      notifyError('La suppression a echoue.')
    }
  }

  const handleChapterChange = useCallback(async (webtoon: Webtoon, delta: number) => {
    if (!ensureAuthenticated()) return
    const newChapter = Math.max(1, webtoon.chapter + delta)
    if (newChapter === webtoon.chapter) return
    try {
      const updated = await updateWebtoon(webtoon.id, { ...webtoon, chapter: newChapter })
      const nextList = webtoonsRef.current.map((item) => (item.id === webtoon.id ? updated : item))
      webtoonsRef.current = nextList
      setWebtoons(nextList)
      setCachedWebtoons(user?.id, { webtoons: nextList })
    } catch {
      notifyError('Erreur lors de la mise à jour du chapitre.')
    }
  }, [ensureAuthenticated, user?.id])

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    fetchWebtoons({ page: currentPage + 1, append: true })
  }, [loadingMore, hasMore, currentPage, fetchWebtoons])

  const handleRefresh = useCallback(() => {
    if (!user?.id) return
    invalidateCachedWebtoons(user.id)
    webtoonsRef.current = []
    setCurrentPage(1)
    fetchWebtoons({ page: 1, append: false, background: false, merge: false })
  }, [fetchWebtoons, user?.id])

  const openEditModal = (webtoon: Webtoon) => {
    if (!ensureAuthenticated()) return
    setEditingWebtoon(webtoon)
    setIsAddModalOpen(true)
  }

  if (authLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-muted/40 bg-panel/70">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-8">
        {error && (
          <div className="flex items-center gap-3 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl border border-accent/20 px-6 py-12 text-center shadow-panel">
          <LogIn size={28} className="text-accent" />
          <h2 className="text-2xl font-semibold text-white">Connectez-vous pour acceder a votre Webtoon Book</h2>
          <p className="max-w-xl text-sm text-textLight/60">
            L'API protege les donnees avec des jetons JWT. Creez un compte puis connectez-vous pour consulter, ajouter
            et mettre a jour vos webtoons personnels.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Se connecter / Creer un compte
          </button>
        </div>
      </div>
    )
  }

  if (!canManageWebtoons) {
    return (
      <div className="flex flex-col gap-6 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-10 text-center text-sm text-yellow-100">
        <AlertTriangle size={24} className="mx-auto text-yellow-300" />
        <h2 className="text-2xl font-semibold text-white">Acces limite</h2>
        <p>
          Votre compte n&apos;a pas encore l&apos;autorisation de gerer la bibliotheque de webtoons. Contactez un administrateur pour obtenir cet acces.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="flex items-center gap-3 rounded-3xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-textLight/40">Resultats</p>
          <h2 className="text-2xl font-semibold text-white">
            {searchValue
              ? `${filteredWebtoons.length} webtoon(s) trouve(s)`
              : `${totalCount} webtoon(s) enregistres`}
          </h2>
        </div>
        <motion.button
          type="button"
          whileHover={{ rotate: 20 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-muted/60 bg-surface/70 text-textLight/60 transition hover:text-white"
          aria-label="Rafraichir"
        >
          <RefreshCw size={18} />
        </motion.button>
      </div>

      {loading ? (
        <WebtoonGridSkeleton />
      ) : filteredWebtoons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-muted/40 bg-panel/70 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">Aucun webtoon trouve</p>
          <p className="max-w-md text-sm text-textLight/60">
            Ajustez votre recherche ou ajoutez un nouveau webtoon avec le bouton " Add Webtoon ".
          </p>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence>
              {filteredWebtoons.map((webtoon, index) => (
                <motion.div
                  key={webtoon.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <WebtoonCard
                    webtoon={webtoon}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onChapterChange={handleChapterChange}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {hasMore && (
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={loadingMore}
                onClick={handleLoadMore}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/15 px-5 py-3 text-sm font-semibold text-accent shadow-glow transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? <Loader2 size={18} className="animate-spin" /> : null}
                {loadingMore ? 'Chargement...' : 'Charger plus de webtoons'}
              </motion.button>
            </div>
          )}
        </>
      )}
<AddWebtoonModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingWebtoon(null)
        }}
        onSubmit={(payload) => (editingWebtoon ? handleUpdate(editingWebtoon.id, payload) : handleCreate(payload))}
        webtoon={editingWebtoon ?? undefined}
      />
    </div>
  )
}

export default WebtoonPage
