import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { BookOpen, Home, Info, ShieldCheck, Sparkles, X } from 'lucide-react'
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
  { label: 'Scraper', path: '/scraper', icon: Sparkles, requiredFeature: 'scraper_access', requireAuth: true }
]

const SidebarContent = ({ onNavigate, showClose }: { onNavigate?: () => void; showClose?: boolean }) => {
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
    <nav className="flex h-full w-72 flex-col border-r border-border/30 bg-panel/95 backdrop-blur-2xl">
      {/* Header / Logo */}
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/60 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accentSoft text-white shadow-glow">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-accent">Webtoon</p>
              <p className="font-display text-base font-bold text-white">Book</p>
            </div>
          </div>
          {showClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onNavigate}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-surface/60 text-textMuted transition-colors hover:text-white"
            >
              <X size={18} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-textMuted/60">
          Navigation
        </p>
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
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                disabled
                  ? 'cursor-not-allowed text-textMuted/40'
                  : 'hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-textMuted hover:bg-surface/80'
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.span 
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-accentSoft"
                />
              )}
              
              <Icon 
                size={18} 
                strokeWidth={2} 
                className={clsx(
                  'shrink-0 transition-colors',
                  isActive && 'text-accent',
                  !disabled && !isActive && 'group-hover:text-accent'
                )} 
              />
              <span>{label}</span>
              
              {disabled && (
                <span className="ml-auto rounded-md bg-muted/60 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-textMuted/60">
                  Bientôt
                </span>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-6">
        <div className="rounded-2xl border border-border/30 bg-surface/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-semibold text-white">Glow Mode</span>
          </div>
          <p className="text-[0.7rem] leading-relaxed text-textMuted">
            Interface inspirée d'AsuraScans pour suivre vos lectures et les nouvelles sorties.
          </p>
        </div>
      </div>
    </nav>
  )
}

const sidebarVariants: Variants = {
  hidden: { x: -320, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    }
  }
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => (
  <>
    {/* Desktop Sidebar */}
    <aside className="hidden h-screen lg:sticky lg:top-0 lg:block">
      <SidebarContent />
    </aside>

    {/* Mobile Sidebar */}
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarVariants}
            className="fixed inset-y-0 left-0 z-50 shadow-2xl lg:hidden"
          >
            <SidebarContent onNavigate={onClose} showClose />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
)

export default memo(Sidebar)
