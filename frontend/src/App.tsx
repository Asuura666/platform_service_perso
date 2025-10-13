import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import UpcomingPage from './pages/UpcomingPage'
import WebtoonPage from './pages/WebtoonPage'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="webtoons" element={<WebtoonPage />} />
        <Route path="info" element={<InfoPage />} />
        <Route path="upcoming" element={<UpcomingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App
