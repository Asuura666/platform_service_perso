import { motion } from 'framer-motion'
import { Loader2, Save, Shield, User as UserIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import apiClient from '@/api/client'
import { useAuth } from '@/providers/AuthProvider'
import { notifyError, notifySuccess } from '@/utils/notificationBus'

type ProfileForm = {
  username: string
  email: string
  first_name: string
  last_name: string
}

const ProfilePage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [form, setForm] = useState<ProfileForm>({ username: '', email: '', first_name: '', last_name: '' })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (user && !loaded) {
      setForm({
        username: user.username,
        email: user.email,
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
      })
      setLoaded(true)
    }
  }, [user, loaded])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.patch('/auth/me/', form)
      notifySuccess('Profil mis à jour.')
    } catch {
      notifyError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-muted/40 bg-panel/70">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-accent/20 bg-panel/70 px-6 py-12 text-center">
        <UserIcon size={28} className="text-accent" />
        <p className="text-lg font-semibold text-white">Connectez-vous pour voir votre profil.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-accent/20 bg-panel/80 shadow-panel"
      >
        {/* Header */}
        <div className="border-b border-muted/30 px-4 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accentSoft text-white shadow-glow">
              <UserIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{user.username}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {user.role}
                </span>
                {user.is_superuser && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                    <Shield size={12} /> Superuser
                  </span>
                )}
              </div>
            </div>
          </div>
          {user.features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {user.features.map((f) => (
                <span key={f} className="rounded-full border border-muted/50 bg-surface/70 px-3 py-1 text-xs text-textLight/60">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-textLight/40 sm:text-xs">Pseudo</label>
              <input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-textLight/40 sm:text-xs">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-textLight/40 sm:text-xs">Prénom</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="Votre prénom"
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-textLight/40 sm:text-xs">Nom</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="Votre nom"
                className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export default ProfilePage
