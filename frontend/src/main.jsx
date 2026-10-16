import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { getSavedTheme } from './utils/storage.js'
import './styles/tokens.css'
import './styles/global.css'

// Тему применяем до первой отрисовки, чтобы страница не «мигала»
document.documentElement.dataset.theme = getSavedTheme() || 'light'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
