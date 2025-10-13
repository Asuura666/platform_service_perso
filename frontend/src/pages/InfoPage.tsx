import { motion } from 'framer-motion'
import { Blocks, Code2, Palette, Rocket } from 'lucide-react'
import { useEffect } from 'react'
import { useLayout } from '@/components/Layout'

const stackItems = [
  {
    icon: Code2,
    title: 'React + TypeScript',
    description: 'Architecture modulaire avec React Router, composants fortement typés et état maîtrisé.'
  },
  {
    icon: Palette,
    title: 'TailwindCSS & Glow Design',
    description: 'Thème sombre, glassmorphism et effets glow inspirés du style AsuraComic.'
  },
  {
    icon: Blocks,
    title: 'Framer Motion',
    description: 'Animations fluides pour les cartes, la sidebar et les modales, avec transitions page.'
  },
  {
    icon: Rocket,
    title: 'API Django',
    description: 'Axios gère le CRUD via /api/webtoons/ pour synchroniser la bibliothèque.'
  }
]

const InfoPage = () => {
  const { registerAddHandler } = useLayout()

  useEffect(() => {
    registerAddHandler(null)
  }, [registerAddHandler])

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="glass-card relative overflow-hidden rounded-3xl border border-accent/20 p-8 shadow-panel">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -right-12 bottom-6 h-40 w-40 rounded-full bg-accentSoft/20 blur-3xl" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-semibold text-white">Vision du projet</h2>
          <p className="text-sm leading-relaxed text-textLight/70">
            Webtoon Book est pensé comme un tableau de bord immersif pour suivre ses webtoons avec un rendu proche de
            l&apos;esthétique AsuraComic. Chaque section reprend l&apos;ADN du site — sidebar lumineuse, cartes glow,
            transitions douces — tout en apportant des fonctionnalités adaptées au suivi de lecture.
          </p>
          <p className="text-sm leading-relaxed text-textLight/60">
            Le frontend communique avec une API Django (GET, POST, PUT, DELETE) pour gérer la bibliothèque. Les données
            incluent toutes les métadonnées utiles&nbsp;: type, langue, statut, note, dernier chapitre, date de lecture
            et commentaire personnalisé.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-muted/40 bg-panel/80 p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-white">Stack & design system</h3>
        <div className="grid gap-3">
          {stackItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex items-start gap-3 rounded-2xl border border-muted/40 bg-surface/80 px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-textLight/60">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default InfoPage
