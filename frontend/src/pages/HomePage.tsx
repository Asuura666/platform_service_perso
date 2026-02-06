import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Flame, Sparkles, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLayout } from '@/components/Layout'

const stats = [
  { label: 'Webtoons', value: '500+', icon: BookOpen },
  { label: 'Chapitres', value: '25K+', icon: TrendingUp },
  { label: 'Utilisateurs', value: '1.2K', icon: Zap }
]

const heroHighlights = [
  {
    title: 'Library Glow',
    description: 'Une sélection automatique des webtoons que vous suivez avec notifications de sortie.',
    icon: BookOpen,
    color: 'from-orange-500 to-amber-500'
  },
  {
    title: 'Radar Sportif',
    description: 'Classement dynamique des webtoons sportifs les plus lus du moment.',
    icon: Trophy,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Découvertes',
    description: 'Algorithme de recommandation basé sur vos commentaires et vos notes.',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500'
  }
]

const categoryTiles = [
  {
    label: 'Webtoon Book',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    description: 'Votre collection complète, vos notes personnelles et vos chapitres favoris.',
    gradient: 'from-accent/80 via-accent/40 to-transparent',
    link: '/webtoons'
  },
  {
    label: 'Sport',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
    description: 'Suivez vos séries sportives intenses avec un suivi précis des sorties.',
    gradient: 'from-emerald-500/80 via-emerald-500/40 to-transparent',
    link: '/webtoons'
  },
  {
    label: 'Découverte',
    image: 'https://images.unsplash.com/photo-1522072782030-1980f516cc8b?auto=format&fit=crop&w=1200&q=80',
    description: 'Une sélection inspirée d\'AsuraScans pour ne rater aucun nouveau webtoon.',
    gradient: 'from-purple-500/80 via-purple-500/40 to-transparent',
    link: '/webtoons'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  }
}

const HomePage = () => {
  const { registerAddHandler } = useLayout()

  useEffect(() => {
    registerAddHandler(null)
  }, [registerAddHandler])

  return (
    <motion.div 
      className="flex flex-col gap-12 lg:gap-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-border/30 bg-panel/60 backdrop-blur-xl"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute -right-20 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-accentSoft/15 blur-[80px]" />
          <div className="absolute bottom-0 left-1/2 h-40 w-full -translate-x-1/2 bg-gradient-to-t from-accent/10 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-12">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Badge */}
              <motion.span 
                variants={itemVariants}
                className="badge-accent inline-flex"
              >
                <Flame size={12} className="animate-pulse" />
                Dashboard v2.0
              </motion.span>

              {/* Title */}
              <motion.h2 
                variants={itemVariants}
                className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
              >
                Bienvenue dans{' '}
                <span className="text-gradient">Webtoon Book</span>
              </motion.h2>

              {/* Description */}
              <motion.p 
                variants={itemVariants}
                className="max-w-xl text-base leading-relaxed text-textMuted sm:text-lg"
              >
                Une interface raffinée inspirée d'AsuraScans. Retrouvez vos lectures, 
                vos chapitres suivis et découvrez de nouvelles sorties.
              </motion.p>

              {/* Stats */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap gap-4 pt-2"
              >
                {stats.map((stat) => (
                  <div 
                    key={stat.label}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/60 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <stat.icon size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-textMuted">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div variants={itemVariants}>
                <Link 
                  to="/webtoons"
                  className="btn-primary mt-2 inline-flex"
                >
                  Explorer la collection
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Right - Features Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid gap-4"
            >
              {heroHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.title}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="glass-card flex items-start gap-4 rounded-2xl p-4 transition-all"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${highlight.color} text-white shadow-lg`}>
                    <highlight.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white">{highlight.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-textMuted">{highlight.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Category Section */}
      <section className="space-y-6">
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Catégories</h3>
            <p className="text-sm text-textMuted">Explorez par genre</p>
          </div>
          <Link 
            to="/webtoons"
            className="btn-secondary text-xs"
          >
            Voir tout
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {categoryTiles.map((category, index) => (
            <motion.article
              key={category.label}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative h-64 overflow-hidden rounded-3xl border border-border/30 shadow-card sm:h-72"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  loading="lazy"
                  src={category.image}
                  alt={category.label}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <span className="badge-muted mb-3 self-start text-[0.65rem]">
                  Aperçu
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  {category.label}
                </h3>
                <p className="mt-2 text-sm text-white/80 line-clamp-2">
                  {category.description}
                </p>
                <Link
                  to={category.link}
                  className="mt-4 inline-flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Explorer
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* Feature Banner */}
      <motion.section 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-r from-accent/10 via-accentSoft/5 to-transparent p-6 sm:p-8"
      >
        <div className="absolute right-0 top-1/2 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/20 blur-[60px]" />
        
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-accent">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                Mode Glow activé
              </h3>
              <p className="text-sm text-textMuted">
                Design sombre, lumineux et réactif — inspiré par AsuraComic
              </p>
            </div>
          </div>
          <Link 
            to="/info"
            className="btn-secondary whitespace-nowrap text-xs"
          >
            En savoir plus
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.section>
    </motion.div>
  )
}

export default HomePage
