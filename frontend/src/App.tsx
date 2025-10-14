import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireSuperuser from './components/RequireSuperuser'
import RouteLoader from './components/RouteLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const WebtoonPage = lazy(() => import('./pages/WebtoonPage'))
const InfoPage = lazy(() => import('./pages/InfoPage'))
const ScraperPage = lazy(() => import('./pages/ScraperPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="webtoons" element={<WebtoonPage />} />
          <Route path="info" element={<InfoPage />} />
          <Route path="scraper" element={<ScraperPage />} />
          <Route
            path="admin"
            element={
              <RequireSuperuser>
                <AdminPage />
              </RequireSuperuser>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)

export default App
