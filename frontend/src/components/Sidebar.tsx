import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Home, Info, ShieldCheck, Sparkles, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { memo, useMemo } from 'react'
import { useAuth } from '@/providers/AuthProvider'

type SidebarProps = { isMobileOpen?: boolean; onClose?: () => void }
type NavConfig = { label: string; path: string; icon: LucideIcon; requiredFeature?: string; requireAuth?: boolean; disabled?: boolean }

const baseNavItems: NavConfig[] = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Bibliothèque', path: '/webtoons', icon: BookOpen, requiredFeature: 'webtoon_management', requireAuth: true },
  { label: 'Info', path: '/info', icon: Info },
  { label: 'Scraper', path: '/scraper', icon: Sparkles, requiredFeature: 'scraper_access', requireAuth: true },
  { label: 'Profil', path: '/profile', icon: User, requireAuth: true },
]

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { pathname } = useLocation()
  const { user, isAuthenticated, hasFeature } = useAuth()
  const items = useMemo(() => {
    const list = baseNavItems.map((item) => ({
      ...item,
      disabled: (item.requireAuth && !isAuthenticated) || (item.requiredFeature ? !hasFeature(item.requiredFeature) : false)
    }))
    if (user?.is_superuser) list.push({ label: 'Admin', path: '/admin', icon: ShieldCheck, disabled: false })
    return list
  }, [user, isAuthenticated, hasFeature])

  return (
    <nav className="flex h-full w-64 flex-col bg-panel/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
          <BookOpen size={18} />
        </div>
        <span className="text-lg font-bold text-white">Webtoon Book</span>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {items.map(({ label, path, icon: Icon, disabled }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path))
          return (
            <NavLink
              key={path}
              to={disabled ? '#' : path}
              onClick={() => { if (!disabled) onNavigate?.() }}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                disabled ? 'cursor-not-allowed text-textMuted/40'
                  : active ? 'bg-accent/10 text-accent' : 'text-textMuted hover:bg-surface hover:text-white'
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
              {disabled && <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[0.6rem] text-textMuted">Bientôt</span>}
            </NavLink>
          )
        })}
      </div>
      <div className="mt-auto px-4 pb-6">
        <div className="rounded-lg bg-surface/80 p-4 text-xs text-textMuted">
          Votre tracker manga personnel.
        </div>
      </div>
    </nav>
  )
}

const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => (
  <>
    <aside className="hidden h-full w-64 lg:block"><SidebarContent /></aside>
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
          >
            <SidebarContent onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
)

export default memo(Sidebar)
