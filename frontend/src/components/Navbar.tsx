import clsx from 'clsx'
import { LogIn, LogOut, Menu, PlusCircle, Search, User } from 'lucide-react'
import { memo, type ChangeEvent } from 'react'

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
  subtitle,
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
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-muted/30 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:bg-surface hover:text-white lg:hidden"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{pageTitle}</h1>
          {subtitle && <p className="hidden truncate text-xs text-textMuted sm:block">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-textMuted sm:flex">
                <User size={14} /> {userName}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted transition hover:bg-surface hover:text-white sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
              >
                <LogOut size={16} />
                <span className="hidden text-xs font-medium sm:inline">Déco</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAuthAction}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent/90"
            >
              <LogIn size={14} /> <span>Connexion</span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 sm:px-6 lg:px-10">
        <label className="flex flex-1 items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <Search className="text-textMuted" size={16} />
          <input
            value={searchValue}
            onChange={handleSearch}
            type="search"
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-sm text-textLight placeholder:text-textMuted/60 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={onAddWebtoon}
          disabled={disableAddButton}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4',
            disableAddButton
              ? 'cursor-not-allowed bg-muted/50 text-textMuted/50'
              : 'bg-accent text-white hover:bg-accent/90 active:scale-95'
          )}
        >
          <PlusCircle size={16} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>
    </header>
  )
}

export default memo(NavbarComponent)
