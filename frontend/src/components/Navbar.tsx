import { motion } from 'framer-motion'
import clsx from 'clsx'
import { LogIn, LogOut, Menu, Moon, PlusCircle, Search, SunMedium, User } from 'lucide-react'
import { memo, type ChangeEvent } from 'react'
import { useTheme } from '@/providers/ThemeProvider'

type NavbarProps = {
  pageTitle?: string
  subtitle?: string
  searchValue: string
  onSearchChange: (value: string) => void
  onAddWebtoon: () => void
  onToggleSidebar: () => void
  disableAddButton?: boolean
  isAuthenticated: boolean
  userName?: string
  onAuthAction: () => void
  onLogout: () => void
}

const NavbarComponent = ({
  pageTitle = 'Webtoon Book',
  subtitle = 'Retrouvez vos webtoons préférés et vos dernières lectures',
  searchValue,
  onSearchChange,
  onAddWebtoon,
  onToggleSidebar,
  disableAddButton = false,
  isAuthenticated,
  userName = '',
  onAuthAction,
  onLogout
}: NavbarProps) => {
  const { theme, toggleTheme } = useTheme()

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value)
  }

  const handleAddClick = () => {
    if (disableAddButton) return
    onAddWebtoon()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/60 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/40">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Top Row */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-surface/60 text-textMuted transition-colors hover:text-white lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} strokeWidth={2} />
          </motion.button>

          {/* Page Title */}
          <div className="flex flex-col">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-accent">
              Dashboard
            </span>
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl lg:text-3xl">
              {pageTitle}
            </h1>
            <p className="hidden text-sm text-textMuted sm:block">{subtitle}</p>
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle - Desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={toggleTheme}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-surface/60 text-textMuted transition-all hover:text-white sm:flex"
              aria-label="Changer le thème"
            >
              {theme === 'dark' ? (
                <SunMedium size={18} className="transition-transform hover:rotate-12" />
              ) : (
                <Moon size={17} className="transition-transform hover:-rotate-12" />
              )}
            </motion.button>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User Badge */}
                <span className="hidden items-center gap-2 rounded-xl border border-border/50 bg-surface/60 px-3 py-2 text-xs font-medium text-textMuted sm:flex">
                  <User size={14} />
                  <span className="max-w-[100px] truncate">{userName}</span>
                </span>
                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onLogout}
                  className="btn-secondary py-2 text-xs"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Déconnexion</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onAuthAction}
                className="btn-primary py-2.5 px-4 text-xs"
              >
                <LogIn size={14} />
                <span>Connexion</span>
              </motion.button>
            )}

            {/* Theme Toggle - Mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-surface/60 text-textMuted transition-all hover:text-white sm:hidden"
              aria-label="Changer le thème"
            >
              {theme === 'dark' ? (
                <SunMedium size={18} />
              ) : (
                <Moon size={17} />
              )}
            </motion.button>

            {/* Add Button - Desktop */}
            <motion.button
              whileHover={{ scale: disableAddButton ? 1 : 1.02 }}
              whileTap={{ scale: disableAddButton ? 1 : 0.98 }}
              type="button"
              onClick={handleAddClick}
              disabled={disableAddButton}
              className={clsx(
                'hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex',
                disableAddButton
                  ? 'cursor-not-allowed border border-border/30 bg-surface/40 text-textMuted/40'
                  : 'btn-primary'
              )}
            >
              <PlusCircle size={16} strokeWidth={2} />
              <span>Ajouter</span>
            </motion.button>
          </div>
        </div>

        {/* Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <motion.label
            layout
            className="group flex flex-1 items-center gap-3 rounded-xl border border-border/40 bg-surface/60 px-4 py-2.5 transition-all hover:border-accent/40 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 sm:max-w-md"
          >
            <Search className="text-textMuted/60 transition-colors group-hover:text-accent group-focus-within:text-accent" size={18} />
            <input
              value={searchValue}
              onChange={handleSearch}
              type="search"
              placeholder="Rechercher un webtoon..."
              className="flex-1 bg-transparent text-sm text-textLight placeholder:text-textMuted/50 focus:outline-none"
            />
          </motion.label>

          {/* Add Button - Mobile */}
          <motion.button
            whileHover={{ scale: disableAddButton ? 1 : 1.02 }}
            whileTap={{ scale: disableAddButton ? 1 : 0.98 }}
            type="button"
            onClick={handleAddClick}
            disabled={disableAddButton}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:hidden',
              disableAddButton
                ? 'cursor-not-allowed border border-border/30 bg-surface/40 text-textMuted/40'
                : 'btn-primary'
            )}
          >
            <PlusCircle size={16} strokeWidth={2} />
            Ajouter un webtoon
          </motion.button>
        </div>
      </div>
    </header>
  )
}

const Navbar = memo(NavbarComponent)

export default Navbar
