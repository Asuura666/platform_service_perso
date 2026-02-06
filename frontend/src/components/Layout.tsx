import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AuthModal from './AuthModal'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '@/providers/AuthProvider'

type LayoutContextValue = {
  searchValue: string
  setSearchValue: (value: string) => void
  registerAddHandler: (handler: (() => void) | null) => void
  openAuthModal: () => void
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
  '/scraper': {
    title: 'Scraper',
    subtitle: 'Importez automatiquement chapitres et images depuis une URL de webtoon.'
  },
  '/admin': {
    title: 'Administration',
    subtitle: 'Gérez les comptes et attribuez les droits aux utilisateurs.'
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { 
      duration: 0.2, 
      ease: [0.16, 1, 0.3, 1]
    }
  }
}

const Layout = () => {
  const { pathname } = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [hasAddHandler, setHasAddHandler] = useState(false)
  const addHandlerRef = useRef<(() => void) | null>(null)
  const { isAuthenticated, user, logout } = useAuth()

  useEffect(() => {
    setIsSidebarOpen(false)
    setSearchValue('')
    setHasAddHandler(false)
    addHandlerRef.current = null
  }, [pathname])

  const registerAddHandler = useCallback((handler: (() => void) | null) => {
    addHandlerRef.current = handler ?? null
    setHasAddHandler(Boolean(handler))
  }, [])

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const metadata = useMemo(
    () =>
      pageMetadata[pathname] ?? {
        title: 'Webtoon Book',
        subtitle: 'Retrouvez vos webtoons préférés et vos dernières lectures'
      },
    [pathname]
  )

  const isAddButtonDisabled = pathname !== '/webtoons' || !hasAddHandler || !isAuthenticated

  const handleAddWebtoon = useCallback(() => {
    if (!isAuthenticated) {
      openAuthModal()
      return
    }
    addHandlerRef.current?.()
  }, [isAuthenticated, openAuthModal])

  const contextValue = useMemo(
    () => ({
      searchValue,
      setSearchValue,
      registerAddHandler,
      openAuthModal
    }),
    [searchValue, registerAddHandler, openAuthModal]
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
            onAddWebtoon={handleAddWebtoon}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            disableAddButton={isAddButtonDisabled}
            isAuthenticated={isAuthenticated}
            userName={user?.username ?? ''}
            onAuthAction={openAuthModal}
            onLogout={logout}
          />
          
          <main className="flex-1 overflow-x-hidden">
            <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="mx-auto flex w-full max-w-7xl flex-col gap-8"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Footer Gradient */}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </LayoutContext.Provider>
  )
}

export default Layout
