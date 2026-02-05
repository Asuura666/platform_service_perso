import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Home, Info, ShieldCheck, Sparkles, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { memo, useMemo } from 'react'
import { useAuth } from '@/providers/AuthProvider'

type SidebarProps = {
  isMobileOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  disabled?: boolean
}

type NavConfig = NavItem & {
  requiredFeature?: string
  requireAuth?: boolean
}

const baseNavItems: NavConfig[] = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Webtoon Book', path: '/webtoons', icon: BookOpen, requiredFeature: 'webtoon_management', requireAuth: true },
  { label: 'Information', path: '/info', icon: Info },
  { label: 'Scraper', path: '/scraper', icon: Sparkles, requiredFeature: 'scraper_access', requireAuth: true },
  { label: 'Mon Profil', path: '/profile', icon: User, requireAuth: true }
]

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation()
  const { user, isAuthenticated, hasFeature } = useAuth()
  const activePath = useMemo(() => location.pathname, [location])
  const navItems = useMemo(() => {
    const items = baseNavItems.map<NavItem>((item) => {
      const disabled =
        (item.requireAuth && !isAuthenticated) ||
        (item.requiredFeature ? !hasFeature(item.requiredFeature) : false)
      return { label: item.label, path: item.path, icon: item.icon, disabled }
    })
    if (user?.is_superuser) {
      items.push({ label: 'Administration', path: '/admin', icon: ShieldCheck })
    }
    return items
  }, [user, isAuthenticated, hasFeature])

  return (
    <nav className="flex h-full w-72 flex-col bg-panel/80 backdrop-blur-xl shadow-panel">
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-3 rounded-3xl border border-muted/70 bg-surface/60 px-5 py-4 shadow-panel">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accentSoft text-white shadow-glow">
            <BookOpen size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent/80">Webtoon</p>
            <p className="text-lg font-semibold text-white">Book Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {navItems.map(({ label, path, icon: Icon, disabled }) => {
          const isActive = activePath === path || (path !== '/' && activePath.startsWith(path))
          return (
            <NavLink
              key={path}
              to={disabled ? '#' : path}
              onClick={() => {
                if (disabled) return
                onNavigate?.()
              }}
              className={clsx(
                'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                disabled
                  ? 'cursor-not-allowed bg-surface/50 text-muted'
                  : 'hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
                isActive
                  ? 'glow-border text-white shadow-glow'
                  : 'bg-surface/70 text-textLight/70 hover:shadow-panel'
              )}
            >
              <Icon size={18} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
              {disabled && (
                <span className="ml-auto inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">
                  Bientôt
                </span>
              )}
              {isActive && (
                <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-accent to-accentSoft" />
              )}
            </NavLink>
          )
        })}
      </div>

      <div className="mt-auto px-5 pb-8 pt-10">
        <div className="rounded-2xl border border-muted/40 bg-surface/50 p-5">
          <p className="text-xs text-textLight/60">
            Interface inspirée d&apos;AsuraScans pour suivre vos lectures, vos saisons préférées et les nouvelles
            sorties à ne pas manquer.
          </p>
        </div>
      </div>
    </nav>
  )
}

const sidebarVariants = {
  hidden: { x: -320, opacity: 0 },
  visible: { x: 0, opacity: 1 }
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => (
  <>
    <aside className="hidden h-full w-72 lg:block">
      <SidebarContent />
    </aside>

    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarVariants}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
          >
            <SidebarContent onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
)

export default memo(Sidebar)
