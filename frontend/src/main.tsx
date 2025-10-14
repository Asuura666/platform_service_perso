import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import GlobalErrorBoundary from './components/GlobalErrorBoundary'
import { NotificationProvider } from './providers/NotificationProvider'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <ThemeProvider>
          <GlobalErrorBoundary>
            <App />
          </GlobalErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
)
