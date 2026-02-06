import { motion, type Variants } from 'framer-motion'
import { ArrowRight, BookOpen, Eye, Flame, Search, Sparkles, Star, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLayout } from '@/components/Layout'
import { useAuth } from '@/providers/AuthProvider'

// Sample catalog data - in production, this would come from a public API endpoint
const featuredWebtoons = [
  {
    id: 1,
    title: 'Solo Leveling',
    type: 'Action',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    description: 'Un chasseur de rang E devient le plus puissant après avoir survécu à un donjon mystérieux.',
    chapters: 179,
    status: 'Terminé'
  },
  {
    id: 2,
    title: 'Tower of God',
    type: 'Fantasy',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    description: 'Un garçon entre dans une tour mystérieuse pour retrouver son amie d\'enfance.',
    chapters: 550,
    status: 'En cours'
  },
  {
    id: 3,
    title: 'The Beginning After The End',
    type: 'Fantasy',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    description: 'Un roi réincarné dans un monde de magie tente de protéger ceux qu\'il aime.',
    chapters: 180,
    status: 'En cours'
  },
  {
    id: 4,
    title: 'Omniscient Reader',
    type: 'Action',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
    description: 'Le seul lecteur d\'un roman apocalyptique se retrouve dans son histoire.',
    chapters: 165,
    status: 'En cours'
  },
  {
    id: 5,
    title: 'Eleceed',
    type: 'Action',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    description: 'Un adolescent découvre ses pouvoirs avec l\'aide d\'un chat pas comme les autres.',
    chapters: 280,
    status: 'En cours'
  },
  {
    id: 6,
    title: 'Wind Breaker',
    type: 'Sport',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=600&q=80',
    description: 'Un lycéen asocial découvre sa passion pour le cyclisme et la compétition.',
    chapters: 450,
    status: 'En cours'
  }
]

const categories = [
  { name: 'Action', count: 156, color: 'from-red-500 to-orange-500' },
  { name: 'Fantasy', count: 203, color: 'from-purple-500 to-pink-500' },
  { name: 'Romance', count: 178, color: 'from-pink-500 to-rose-500' },
  { name: 'Sport', count: 45, color: 'from-emerald-500 to-teal-500' },
  { name: 'Comédie', count: 89, color: 'from-yellow-500 to-amber-500' },
  { name: 'Drame', count: 67, color: 'from-blue-500 to-indigo-500' }
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const CatalogPage = () => {
  const { openAuthModal } = useLayout()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWebtoons = featuredWebtoons.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      className="flex flex-col gap-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-border/30 bg-panel/60 backdrop-blur-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute -right-20 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-purple-500/15 blur-[80px]" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="badge-accent inline-flex mb-3">
                <Flame size={12} className="animate-pulse" />
                Catalogue Public
              </span>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Découvrez les meilleurs <span className="text-gradient">Webtoons</span>
              </h1>
              <p className="mt-2 max-w-xl text-textMuted">
                Explorez notre sélection de webtoons populaires. Créez un compte pour suivre votre progression et gérer votre bibliothèque personnelle.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                placeholder="Rechercher un webtoon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border/40 bg-surface/60 py-3 pl-11 pr-4 text-sm text-white placeholder-textMuted transition focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section variants={itemVariants}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">Catégories</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <motion.button
              key={cat.name}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-border/30 bg-gradient-to-br ${cat.color} p-4 text-white shadow-lg transition`}
            >
              <span className="font-semibold">{cat.name}</span>
              <span className="text-xs opacity-80">{cat.count} titres</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Featured Webtoons */}
      <motion.section variants={itemVariants}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-accent" />
            <h2 className="font-display text-xl font-bold text-white">Webtoons Populaires</h2>
          </div>
          <span className="text-sm text-textMuted">{filteredWebtoons.length} résultats</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWebtoons.map((webtoon) => (
            <motion.article
              key={webtoon.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-border/30 bg-panel/80 shadow-card"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={webtoon.image}
                  alt={webtoon.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Status Badge */}
                <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  webtoon.status === 'En cours' 
                    ? 'bg-emerald-500/90 text-white' 
                    : 'bg-accent/90 text-white'
                }`}>
                  {webtoon.status}
                </span>

                {/* Rating */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{webtoon.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-white line-clamp-1">
                    {webtoon.title}
                  </h3>
                  <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
                    {webtoon.type}
                  </span>
                </div>
                
                <p className="mb-3 text-sm text-textMuted line-clamp-2">
                  {webtoon.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-textMuted">
                    <BookOpen size={14} />
                    <span>{webtoon.chapters} chapitres</span>
                  </div>
                  
                  {isAuthenticated ? (
                    <Link
                      to="/webtoons"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                    >
                      <Eye size={14} />
                      Ajouter
                    </Link>
                  ) : (
                    <button
                      onClick={openAuthModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                    >
                      <Eye size={14} />
                      Suivre
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/15 via-purple-500/10 to-accent/15 p-6 sm:p-8"
        >
          <div className="absolute right-0 top-1/2 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/20 blur-[60px]" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-accent">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Créez votre bibliothèque personnelle
                </h3>
                <p className="text-sm text-textMuted">
                  Suivez vos lectures, notez vos webtoons préférés et ne ratez aucune sortie
                </p>
              </div>
            </div>
            <button
              onClick={openAuthModal}
              className="btn-primary whitespace-nowrap"
            >
              Créer un compte gratuit
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}

export default CatalogPage
