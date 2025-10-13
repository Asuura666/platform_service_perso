import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AddWebtoonModal from '@/components/AddWebtoonModal'
import { useLayout } from '@/components/Layout'
import WebtoonModal from '@/components/WebtoonModal'
import WebtoonCard from '@/components/WebtoonCard'
import { createWebtoon, deleteWebtoon, getWebtoons, updateWebtoon } from '@/api/webtoons'
import type { Webtoon, WebtoonPayload } from '@/types/webtoon'

const fallbackWebtoons: Webtoon[] = [
  {
    id: -1,
    title: 'Solo Leveling — Legacy',
    type: 'Action',
    language: 'Français',
    rating: 4.8,
    chapter: 192,
    link: 'https://asuracomic.net/',
    status: 'En cours',
    last_read_date: '2024-11-02',
    comment: 'Arc actuel explosif, combats fluides et ambiance Asura.',
    image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    updated_at: '2024-11-15'
  },
  {
    id: -2,
    title: 'Blue Lock: Striker Storm',
    type: 'Sport',
    language: 'Français',
    rating: 4.6,
    chapter: 280,
    link: 'https://asuracomic.net/',
    status: 'En cours',
    last_read_date: '2024-11-10',
    comment: 'Les rivalités se renforcent, parfait pour la section Sport.',
    image_url: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=900&q=80',
    updated_at: '2024-11-12'
  },
  {
    id: -3,
    title: 'Ethereal World Advent',
    type: 'Fantaisie',
    language: 'Anglais',
    rating: 4.4,
    chapter: 88,
    link: 'https://asuracomic.net/',
    status: 'Hiatus',
    last_read_date: '2024-10-30',
    comment: 'Univers immersif avec glow bleu caractéristique.',
    image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    updated_at: '2024-11-01'
  }
]

const WebtoonPage = () => {
  const { searchValue, registerAddHandler } = useLayout()
  const [webtoons, setWebtoons] = useState<Webtoon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedWebtoon, setSelectedWebtoon] = useState<Webtoon | null>(null)
  const [editingWebtoon, setEditingWebtoon] = useState<Webtoon | null>(null)

  const fetchWebtoons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getWebtoons()
      setWebtoons(data)
    } catch (err) {
      console.error(err)
      setError(
        "Impossible de récupérer les webtoons depuis l'API. Un jeu de données de démonstration est utilisé pour l'interface."
      )
      setWebtoons(fallbackWebtoons)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebtoons()
  }, [fetchWebtoons])

  useEffect(() => {
    registerAddHandler(() => {
      setEditingWebtoon(null)
      setIsAddModalOpen(true)
    })
    return () => registerAddHandler(null)
  }, [registerAddHandler])

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
    try {
      const created =
        webtoons[0]?.id < 0
          ? { ...payload, id: Math.floor(Math.random() * -1000), updated_at: new Date().toISOString() }
          : await createWebtoon(payload)
      setWebtoons((prev) => [created as Webtoon, ...prev.filter((item) => item.id >= 0 || created.id !== item.id)])
      setIsAddModalOpen(false)
    } catch (err) {
      console.error(err)
      setError("L'ajout a échoué. Vérifiez les informations et réessayez.")
    }
  }

  const handleUpdate = async (webtoonId: number | undefined, payload: WebtoonPayload) => {
    if (!webtoonId) return
    try {
      const updated =
        webtoonId < 0
          ? { ...payload, id: webtoonId, updated_at: new Date().toISOString() }
          : await updateWebtoon(webtoonId, payload)
      setWebtoons((prev) =>
        prev.map((item) => (item.id === webtoonId ? { ...item, ...updated } : item))
      )
      setEditingWebtoon(null)
      setIsAddModalOpen(false)
      setSelectedWebtoon((prev) => (prev && prev.id === webtoonId ? { ...prev, ...updated } : prev))
    } catch (err) {
      console.error(err)
      setError('La mise à jour a échoué. Merci de réessayer.')
    }
  }

  const handleDelete = async (webtoon: Webtoon) => {
    try {
      if (webtoon.id >= 0) {
        await deleteWebtoon(webtoon.id)
      }
      setWebtoons((prev) => prev.filter((item) => item.id !== webtoon.id))
      setSelectedWebtoon((prev) => (prev && prev.id === webtoon.id ? null : prev))
    } catch (err) {
      console.error(err)
      setError('La suppression a échoué.')
    }
  }

  const openEditModal = (webtoon: Webtoon) => {
    setEditingWebtoon(webtoon)
    setIsAddModalOpen(true)
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
          <p className="text-sm uppercase tracking-[0.35em] text-textLight/40">Résultats</p>
          <h2 className="text-2xl font-semibold text-white">
            {searchValue ? `${filteredWebtoons.length} webtoon(s) trouvé(s)` : 'Votre bibliothèque'}
          </h2>
        </div>
        <motion.button
          type="button"
          whileHover={{ rotate: 20 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchWebtoons}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-muted/60 bg-surface/70 text-textLight/60 transition hover:text-white"
          aria-label="Rafraîchir"
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
          <p className="text-lg font-semibold text-white">Aucun webtoon trouvé</p>
          <p className="max-w-md text-sm text-textLight/60">
            Ajustez votre recherche ou ajoutez un nouveau webtoon avec le bouton “Add Webtoon”.
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
