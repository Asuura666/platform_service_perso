import { motion } from 'framer-motion'
import { BookOpen, Flame, Sparkles, Trophy } from 'lucide-react'
import { useEffect } from 'react'
import { useLayout } from '@/components/Layout'

const heroHighlights = [
  {
    title: 'Library Glow',
    description: 'Une sélection automatique des webtoons que vous suivez avec notifications de sortie.',
    icon: BookOpen
  },
  {
    title: 'Radar Sportif',
    description: 'Classement dynamique des webtoons sportifs les plus lus du moment.',
    icon: Trophy
  },
  {
    title: 'Découvertes',
    description: 'Algorithme de recommandation basé sur vos commentaires et vos notes.',
    icon: Sparkles
  }
]

const categoryTiles = [
  {
    label: 'Webtoon Book',
    image:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    description: 'Votre collection complète, vos notes personnelles et vos chapitres favoris.',
    gradient: 'from-accent/60 via-accentSoft/50 to-transparent'
  },
  {
    label: 'Sport',
    image:
      'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
    description: 'Suivez vos séries sportives intenses avec un suivi précis des sorties.',
    gradient: 'from-emerald-500/60 via-emerald-400/40 to-transparent'
  },
  {
    label: 'Découverte',
    image:
      'https://images.unsplash.com/photo-1522072782030-1980f516cc8b?auto=format&fit=crop&w=1200&q=80',
    description: 'Une sélection inspirée d’AsuraScans pour ne rater aucun nouveau webtoon.',
    gradient: 'from-purple-500/60 via-purple-400/40 to-transparent'
  }
]

const highlightVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1 + 0.2, duration: 0.4 }
  })
}

const HomePage = () => {
  const { registerAddHandler } = useLayout()

  useEffect(() => {
    registerAddHandler(null)
  }, [registerAddHandler])

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-panel via-surface to-background p-8 shadow-panel lg:p-12">
        <div className="absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-accentSoft/30 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-accent">
              Dashboard
            </span>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Bienvenue dans <span className="text-accent">Webtoon Book</span> — une interface raffinée inspirée
              d&apos;AsuraScans.
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-textLight/70">
              Retrouvez vos lectures, vos chapitres suivis et découvrez de nouvelles sorties grâce aux sections
              dynamiques. Chaque carte réagit au survol avec un léger glow, pour un rendu moderne et immersif.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {heroHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.title}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={highlightVariants}
                  className="glass-card flex items-start gap-3 rounded-2xl border border-accent/10 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20 text-accent">
                    <highlight.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{highlight.title}</p>
                    <p className="text-xs leading-relaxed text-textLight/60">{highlight.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative hidden h-full rounded-3xl border border-accent/30 bg-gradient-to-br from-surface via-panel to-background p-6 shadow-panel lg:flex"
          >
            <div className="absolute inset-10 rounded-3xl border border-accent/30" />
            <div className="relative flex flex-col gap-4">
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-accent">
                Glow Mode
              </span>
              <h3 className="text-2xl font-semibold text-white">Design sombre, lumineux et réactif.</h3>
              <p className="text-sm text-textLight/60">
                Une grille fluide de cartes réactives, le tout animé avec Framer Motion pour des transitions
                élégantes.
              </p>
              <div className="mt-auto flex items-center gap-3 text-xs text-textLight/40">
                <Flame size={18} className="text-accent" />
                Inspiré par l&apos;esthétique d&apos;AsuraComic.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categoryTiles.map((category, index) => (
          <motion.article
            key={category.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-muted/40 bg-panel/80 shadow-panel"
          >
            <div className="absolute inset-0">
              <img loading="lazy"
                src={category.image}
                alt={category.label}
                className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`} />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
                  Aperçu
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-white">{category.label}</h3>
                <p className="mt-3 text-sm text-white/75">{category.description}</p>
              </div>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 self-start rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Explorer
              </button>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  )
}

export default HomePage
