import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App.jsx'

function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null)
  React.useEffect(() => {
    const h = (e) => setErr(e?.reason || e?.error || e)
    window.addEventListener('error', h)
    window.addEventListener('unhandledrejection', h)
    return () => { window.removeEventListener('error', h); window.removeEventListener('unhandledrejection', h) }
  }, [])
  if (err) return <div style={{ padding: 16 }}>Oups… une erreur est survenue. Recharge la page (F5).<pre style={{whiteSpace:'pre-wrap',opacity:.6}}>{String(err)}</pre></div>
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
