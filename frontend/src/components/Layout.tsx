import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

type LayoutContextValue = {
  searchValue: string
  setSearchValue: (value: string) => void
  registerAddHandler: (handler: (() => void) | null) => void
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined)

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within the Layout component')
  }
  return context
}

const pageMetadata: Record<
  string,
  {
    title: string
    subtitle: string
  }
> = {
  '/': {
    title: 'Accueil',
    subtitle: 'Vos univers favoris, vos lectures récentes et les tendances du moment.'
  },
  '/webtoons': {
    title: 'Webtoon Book',
    subtitle: 'Gérez votre collection, suivez vos lectures et explorez de nouveaux webtoons.'
  },
  '/info': {
    title: 'Informations',
    subtitle: 'Découvrez la vision du projet, les technologies et la roadmap à venir.'
  },
  '/upcoming': {
    title: 'Feature suivante',
    subtitle: 'Aperçu des fonctionnalités en cours de conception pour Webtoon Book.'
  }
}

const Layout = () => {
  const { pathname } = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const addHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setIsSidebarOpen(false)
    setSearchValue('')
  }, [pathname])

  const registerAddHandler = useCallback((handler: (() => void) | null) => {
    addHandlerRef.current = handler ?? null
  }, [])

  const metadata = useMemo(
    () =>
      pageMetadata[pathname] ?? {
        title: 'Webtoon Book',
        subtitle: 'Retrouvez vos webtoons préférés et vos dernières lectures'
      },
    [pathname]
  )

  const isAddButtonDisabled = pathname !== '/webtoons' || !addHandlerRef.current

  const contextValue = useMemo(
    () => ({
      searchValue,
      setSearchValue,
      registerAddHandler
    }),
    [searchValue, registerAddHandler]
  )

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-background text-textLight">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="relative flex flex-1 flex-col">
          <Navbar
            pageTitle={metadata.title}
            subtitle={metadata.subtitle}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onAddWebtoon={() => addHandlerRef.current?.()}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            disableAddButton={isAddButtonDisabled}
          />
          <main className="flex-1 overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex w-full max-w-7xl flex-col gap-8"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  )
}

export default Layout
