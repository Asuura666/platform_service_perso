import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import Skeleton from '@/components/skeletons/Skeleton'
import { AlertTriangle, CheckCircle2, Loader2, Shield, UserPlus } from 'lucide-react'
import {
  createAdminUser,
  fetchAdminFeatures,
  fetchAdminUsers,
  updateAdminUser,
  type AdminFeature,
  type AdminUser
} from '@/api/admin'

type FormState = {
  username: string
  email: string
  password: string
  role: string
  features: string[]
}

const INITIAL_FORM: FormState = {
  username: '',
  email: '',
  password: '',
  role: 'user',
  features: []
}

const AdminPage = () => {
  const [features, setFeatures] = useState<AdminFeature[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [featuresResponse, usersResponse] = await Promise.all([fetchAdminFeatures(), fetchAdminUsers()])
      setFeatures(featuresResponse)
      setUsers(usersResponse)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les donnees administrateur. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const toggleFormFeature = (code: string) => {
    setFormState((prev) => {
      const hasFeature = prev.features.includes(code)
      return {
        ...prev,
        features: hasFeature ? prev.features.filter((item) => item !== code) : [...prev.features, code]
      }
    })
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const payload = {
        username: formState.username.trim(),
        email: formState.email.trim(),
        password: formState.password,
        role: formState.role,
        features: formState.features
      }
      if (!payload.username || !payload.email || !payload.password) {
        setError('Merci de renseigner un nom utilisateur, un email et un mot de passe.')
        setCreating(false)
        return
      }
      const created = await createAdminUser(payload)
      setUsers((prev) => [created, ...prev])
      setFormState(INITIAL_FORM)
      setSuccessMessage(`Le compte ${created.username} a ete cree.`)
    } catch (err: any) {
      console.error(err)
      const detail = err?.response?.data?.detail
      setError(detail ?? 'Impossible de creer le compte. Verifiez les informations et reessayez.')
    } finally {
      setCreating(false)
    }
  }

  const handleUserFeatureToggle = async (user: AdminUser, featureCode: string) => {
    if (user.is_superuser) {
      return
    }
    setUpdatingUserId(user.id)
    setError(null)
    setSuccessMessage(null)
    const nextFeatures = user.features.includes(featureCode)
      ? user.features.filter((code) => code !== featureCode)
      : [...user.features, featureCode]
    try {
      const updated = await updateAdminUser(user.id, { features: nextFeatures })
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)))
      setSuccessMessage(`Droits mis a jour pour ${updated.username}.`)
    } catch (err) {
      console.error(err)
      setError('Mise a jour impossible. Merci de reessayer.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const sortedUsers = useMemo(
    () =>
      users.slice().sort((a, b) => {
        if (a.is_superuser && !b.is_superuser) return -1
        if (!a.is_superuser && b.is_superuser) return 1
        return a.username.localeCompare(b.username)
      }),
    [users]
  )

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="flex items-center gap-3 rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <section className="glass-card rounded-3xl border border-accent/20 p-6 shadow-panel lg:p-8">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Creer un nouveau compte</h2>
            <p className="text-sm text-textLight/60">
              Attribuez des acces specifiques lors de la creation du compte. Les droits pourront etre modifies plus tard.
            </p>
          </div>
        </header>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-textLight/60">
            Nom d&apos;utilisateur
            <input
              value={formState.username}
              onChange={handleInputChange('username')}
              className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              placeholder="Identifiant unique"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-textLight/60">
            Adresse email
            <input
              type="email"
              value={formState.email}
              onChange={handleInputChange('email')}
              className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              placeholder="utilisateur@example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-textLight/60">
            Mot de passe
            <input
              type="password"
              value={formState.password}
              onChange={handleInputChange('password')}
              className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              placeholder="Minimum 8 caracteres"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-textLight/60">
            Role
            <input
              value={formState.role}
              onChange={handleInputChange('role')}
              className="rounded-2xl border border-transparent bg-surface/80 px-4 py-3 text-sm text-white shadow-panel transition focus:border-accent/50 focus:outline-none"
              placeholder="user / admin"
            />
          </label>

          <div className="md:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-textLight/40">
              Fonctionnalites autorisees
            </p>
            {features.length === 0 ? (
              <p className="rounded-2xl border border-muted/50 bg-surface/60 px-4 py-3 text-sm text-textLight/60">
                Aucune fonctionnalite configuree pour le moment.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {features.map((feature) => {
                  const checked = formState.features.includes(feature.code)
                  return (
                    <label
                      key={feature.id}
                      className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 transition ${
                        checked ? 'border-accent/60 bg-accent/10 text-white' : 'border-muted/50 bg-surface/70 text-textLight/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{feature.name}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormFeature(feature.code)}
                          className="h-4 w-4 rounded border border-muted/60 bg-background text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        />
                      </div>
                      <p className="text-xs text-textLight/60">{feature.description}</p>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: creating ? 1 : 1.02 }}
            whileTap={{ scale: creating ? 1 : 0.97 }}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentSoft px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {creating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creation...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Creer le compte
              </>
            )}
          </motion.button>
        </form>
      </section>

      <section className="rounded-3xl border border-muted/40 bg-panel/80 p-6 shadow-panel">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Comptes existants</h2>
            <p className="text-sm text-textLight/60">
              Modifiez les fonctionnalites accessibles pour chaque utilisateur. Les superutilisateurs disposent de tous les droits.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : sortedUsers.length === 0 ? (
          <p className="rounded-2xl border border-muted/40 bg-surface/70 px-4 py-6 text-center text-sm text-textLight/60">
            Aucun utilisateur n&apos;est enregistre pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedUsers.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border border-muted/50 bg-surface/70 p-5 transition hover:border-accent/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{account.username}</p>
                    <p className="text-xs text-textLight/50">{account.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-textLight/50">
                    <span className="rounded-full border border-muted/50 px-3 py-1">{account.role}</span>
                    {account.is_superuser && (
                      <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-accent">
                        Superuser
                      </span>
                    )}
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {features.map((feature) => {
                      const checked = account.is_superuser || account.features.includes(feature.code)
                      return (
                        <label
                          key={feature.id}
                          className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
                            checked ? 'border-accent/50 bg-accent/10 text-white' : 'border-muted/50 bg-panel/60 text-textLight/70'
                          } ${account.is_superuser ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{feature.name}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={account.is_superuser || updatingUserId === account.id}
                              onChange={() => handleUserFeatureToggle(account, feature.code)}
                              className="h-4 w-4 rounded border border-muted/60 bg-background text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                            />
                          </div>
                          <p className="text-xs text-textLight/60">{feature.description}</p>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminPage
