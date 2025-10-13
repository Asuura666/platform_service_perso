import { motion } from 'framer-motion'
import { Construction, Sparkles, Timer } from 'lucide-react'
import { useEffect } from 'react'
import { useLayout } from '@/components/Layout'

const upcomingFeatures = [
  {
    title: 'Synchronisation multi-profils',
    description: 'Partagez votre bibliothèque avec vos amis et suivez leurs recommandations en temps réel.',
    icon: Sparkles
  },
  {
    title: 'Timeline de lecture',
    description: 'Visualisez votre historique avec un mode calendrier et des rappels de sorties.',
    icon: Timer
  }
]

const UpcomingPage = () => {
  const { registerAddHandler } = useLayout()

  useEffect(() => {
    registerAddHandler(null)
  }, [registerAddHandler])

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-muted/40 bg-panel/80 p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/20 text-accent">
        <Construction size={26} />
      </div>
      <h2 className="text-2xl font-semibold text-white">Prochaine Feature</h2>
      <p className="mx-auto max-w-2xl text-sm text-textLight/60">
        Les futures évolutions de Webtoon Book se concentrent sur l&apos;expérience collaborative et la personnalisation.
        Voici un aperçu des travaux en cours.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {upcomingFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card flex flex-col items-center gap-3 rounded-2xl border border-muted/40 px-4 py-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent">
              <feature.icon size={20} />
            </div>
            <p className="text-sm font-semibold text-white">{feature.title}</p>
            <p className="text-xs text-textLight/60">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default UpcomingPage
