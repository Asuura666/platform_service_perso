import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, LogIn, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'login' | 'register'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const dialog = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { login, register, isAuthenticated, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, mode])

  useEffect(() => {
    if (isAuthenticated && isOpen && !loading) {
      onClose()
    }
  }, [isAuthenticated, isOpen, loading, onClose])

  const handleChange =
    (field: 'username' | 'email' | 'password') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((previous) => ({
        ...previous,
        [field]: event.target.value
      }))
    }

  const toggleMode = () => {
    setMode((previous) => (previous === 'login' ? 'register' : 'login'))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password })
      } else {
        await register({
          username: form.username,
          email: form.email,
          password: form.password
        })
      }
      if (!loading) {
        onClose()
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'effectuer l'action. Vérifiez vos informations."
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl px-4 py-10 sm:px-6"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            className="glass-card relative w-full max-w-md overflow-hidden border border-accent/20 px-6 py-8 shadow-glow sm:px-8"
            variants={dialog}
            transition={{ duration: 0.3, type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-muted/40 bg-background/80 text-textLight/60 transition hover:text-white"
              aria-label="Fermer la fenêtre d'authentification"
            >
              <X size={18} />
            </button>

            <header className="mb-6 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-accent/70">
                {mode === 'login' ? 'Connexion' : 'Inscription'}
              </span>
              <h2 className="text-2xl font-semibold text-white">
                {mode === 'login' ? 'Connexion à Webtoon Book' : 'Créer un compte Webtoon Book'}
              </h2>
              <p className="text-sm text-textLight/60">
                {mode === 'login'
                  ? 'Renseignez vos identifiants pour accéder à votre bibliothèque.'
                  : 'Indiquez un email valide pour créer votre espace personnel.'}
              </p>
            </header>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm text-textLight/70">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Pseudo</span>
                <input
                  value={form.username}
                  onChange={handleChange('username')}
                  placeholder="Nom d'utilisateur"
                  required
                  className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
                />
              </label>

              {mode === 'register' && (
                <label className="flex flex-col gap-2 text-sm text-textLight/70">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="adresse@mail.com"
                    required
                    className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm text-textLight/70">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">Mot de passe</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Mot de passe"
                  required
                  className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
                />
              </label>

              {error && <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">{error}</p>}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <motion.button
                type="submit"
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-6 py-3 text-sm font-semibold text-white shadow-glow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Patientez...
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn size={18} />
                    Se connecter
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Créer un compte
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={toggleMode}
                className="text-xs font-semibold uppercase tracking-[0.35em] text-textLight/50 transition hover:text-textLight/80"
              >
                {mode === 'login' ? "Pas encore de compte ? Inscription" : 'Déjà un compte ? Connexion'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
