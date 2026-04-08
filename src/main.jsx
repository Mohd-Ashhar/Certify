import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n.js'
import App from './App.jsx'

// Set initial direction based on stored language
const storedLang = localStorage.getItem('certifycx-lang');
if (storedLang === 'ar') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
} else if (storedLang === 'es') {
  document.documentElement.lang = 'es';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
