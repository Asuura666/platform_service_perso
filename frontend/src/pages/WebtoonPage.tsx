import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, LogIn, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import AddWebtoonModal from '@/components/AddWebtoonModal'
import { useLayout } from '@/components/Layout'
import WebtoonModal from '@/components/WebtoonModal'
import WebtoonCard from '@/components/WebtoonCard'
import { createWebtoon, deleteWebtoon, getWebtoons, updateWebtoon } from '@/api/webtoons'
import { useAuth } from '@/providers/AuthProvider'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'

const WebtoonPage = () => {
  const { searchValue, registerAddHandler, openAuthModal } = useLayout()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [webtoons, setWebtoons] = useState<Webtoon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedWebtoon, setSelectedWebtoon] = useState<Webtoon | null>(null)
  const [editingWebtoon, setEditingWebtoon] = useState<Webtoon | null>(null)

  const ensureAuthenticated = useCallback(() => {
    if (!isAuthenticated) {
      setError('Veuillez vous connecter pour gerer vos webtoons.')
      openAuthModal()
      return false
    }
    return true
  }, [isAuthenticated, openAuthModal])

  const fetchWebtoons = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWebtoons()
      setWebtoons(data)
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.status === 401
          ? 'Session expiree. Veuillez vous reconnecter.'
          : "Impossible de recuperer les webtoons depuis l'API."
      setError(message)
      if (message.includes('Session')) {
        openAuthModal()
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, openAuthModal])

  useEffect(() => {
    if (!isAuthenticated) {
      setWebtoons([])
      setLoading(false)
      return
    }
    fetchWebtoons()
  }, [fetchWebtoons, isAuthenticated])

  useEffect(() => {
    registerAddHandler(() => {
      if (!ensureAuthenticated()) return
      setEditingWebtoon(null)
      setIsAddModalOpen(true)
    })
    return () => registerAddHandler(null)
  }, [registerAddHandler, ensureAuthenticated])

  const filteredWebtoons = useMemo(() => {
    if (!searchValue.trim()) return webtoons
    const lower = searchValue.toLowerCase()
    return webtoons.filter((webtoon) =>
      [webtoon.title, webtoon.type, webtoon.status, webtoon.language].some((field) =>
        field.toLowerCase().includes(lower)
      )
    )
  }, [searchValue, webtoons])

  const handleCreate = async (payload: WebtoonPayload) => {
    if (!ensureAuthenticated()) return
    try {
      const created = await createWebtoon(payload)
      setWebtoons((prev) => [created, ...prev])
      setIsAddModalOpen(false)
    } catch (err) {
      console.error(err)
      setError("L'ajout a echoue. Verifiez les informations et reessayez.")
    }
  }

  const handleUpdate = async (webtoonId: number | undefined, payload: WebtoonPayload) => {
    if (!ensureAuthenticated() || !webtoonId) return
    try {
      const updated = await updateWebtoon(webtoonId, payload)
      setWebtoons((prev) => prev.map((item) => (item.id === webtoonId ? updated : item)))
      setEditingWebtoon(null)
      setIsAddModalOpen(false)
      setSelectedWebtoon((prev) => (prev && prev.id === webtoonId ? updated : prev))
    } catch (err) {
      console.error(err)
      setError('La mise a jour a echoue. Merci de reessayer.')
    }
  }

  const handleDelete = async (webtoon: Webtoon) => {
    if (!ensureAuthenticated()) return
    try {
      await deleteWebtoon(webtoon.id)
      setWebtoons((prev) => prev.filter((item) => item.id !== webtoon.id))
      setSelectedWebtoon((prev) => (prev && prev.id === webtoon.id ? null : prev))
    } catch (err) {
      console.error(err)
      setError('La suppression a echoue.')
    }
  }

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
            {searchValue ? `${filteredWebtoons.length} webtoon(s) trouve(s)` : 'Votre bibliotheque'}
          </h2>
        </div>
        <motion.button
          type="button"
          whileHover={{ rotate: 20 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchWebtoons}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-muted/60 bg-surface/70 text-textLight/60 transition hover:text-white"
          aria-label="Rafraichir"
        >
          <RefreshCw size={18} />
        </motion.button>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-muted/40 bg-panel/60">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : filteredWebtoons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-muted/40 bg-panel/70 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">Aucun webtoon trouve</p>
          <p className="max-w-md text-sm text-textLight/60">
            Ajustez votre recherche ou ajoutez un nouveau webtoon avec le bouton « Add Webtoon ».
          </p>
        </div>
      ) : (
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
                  onSelect={setSelectedWebtoon}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <WebtoonModal
        webtoon={selectedWebtoon}
        isOpen={Boolean(selectedWebtoon)}
        onClose={() => setSelectedWebtoon(null)}
        onEdit={(webtoon) => {
          openEditModal(webtoon)
          setSelectedWebtoon(null)
        }}
      />

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
