import { motion } from 'framer-motion'
import clsx from 'clsx'
import { LogIn, LogOut, Menu, Moon, PlusCircle, Search, SunMedium, User } from 'lucide-react'
import { type ChangeEvent } from 'react'
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

const Navbar = ({
  pageTitle = 'Webtoon Book',
  subtitle = 'Retrouvez vos webtoons preferes et vos dernieres lectures',
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
    <header className="sticky top-0 z-30 flex flex-col gap-5 border-b border-muted/30 bg-background/80 px-4 py-5 backdrop-blur-2xl sm:px-6 lg:px-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-muted/60 bg-surface/70 text-textLight/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-accent/70">Dashboard</span>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">{pageTitle}</h1>
          <p className="text-sm text-textLight/60">{subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={toggleTheme}
            className="group hidden h-11 w-11 items-center justify-center rounded-2xl border border-muted/50 bg-surface/80 text-textLight/70 transition-all hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 sm:flex"
            aria-label="Changer le theme"
          >
            {theme === 'dark' ? (
              <SunMedium size={20} className="transition-transform group-hover:rotate-12" />
            ) : (
              <Moon size={19} className="transition-transform group-hover:-rotate-12" />
            )}
          </motion.button>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-2xl border border-muted/50 bg-surface/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-textLight/50 sm:flex">
                <User size={16} />
                {userName}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent shadow-glow transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LogOut size={16} />
                Se deconnecter
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onAuthAction}
              className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent shadow-glow transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogIn size={16} />
              Se connecter
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={toggleTheme}
            className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-muted/50 bg-surface/80 text-textLight/70 transition-all hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 sm:hidden"
            aria-label="Changer le theme"
          >
            {theme === 'dark' ? (
              <SunMedium size={20} className="transition-transform group-hover:rotate-12" />
            ) : (
              <Moon size={19} className="transition-transform group-hover:-rotate-12" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleAddClick}
            disabled={disableAddButton}
            className={clsx(
              'relative hidden items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-semibold shadow-glow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-accent/60 sm:flex',
              disableAddButton
                ? 'cursor-not-allowed bg-muted/40 text-textLight/40'
                : 'bg-gradient-to-r from-accent to-accentSoft text-white hover:brightness-105'
            )}
          >
            <span className="absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-30" />
            <PlusCircle size={18} strokeWidth={1.8} />
            Ajouter un webtoon
          </motion.button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <motion.label
          layout
          className="group flex w-full items-center gap-3 rounded-3xl border border-muted/50 bg-surface/80 px-5 py-3 shadow-panel transition-all hover:border-accent/60 sm:max-w-md"
        >
          <Search className="text-textLight/50 transition-colors group-hover:text-white" size={18} />
          <input
            value={searchValue}
            onChange={handleSearch}
            type="search"
            placeholder="Rechercher un webtoon, un auteur, un statut..."
            className="flex-1 bg-transparent text-sm text-textLight/80 placeholder:text-textLight/40 focus:outline-none"
          />
        </motion.label>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleAddClick}
          disabled={disableAddButton}
          className={clsx(
            'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-glow transition sm:hidden',
            disableAddButton
              ? 'cursor-not-allowed border border-muted/50 bg-muted/40 text-textLight/40'
              : 'border border-accent/40 bg-accent/20 text-accent hover:bg-accent/30'
          )}
        >
          <PlusCircle size={18} strokeWidth={1.8} />
          Ajouter un webtoon
        </motion.button>
      </div>
    </header>
  )
}

export default Navbar
