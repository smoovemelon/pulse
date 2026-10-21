import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyDocumentTheme, readStoredTheme } from './services/persistence'
import './index.css'

applyDocumentTheme(readStoredTheme())

if (typeof window !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage) {
  navigator.storage.persist().then((isPersisted) => {
    console.log(`[Storage] Persistent storage granted: ${isPersisted}`)
  }).catch((err) => {
    console.warn('[Storage] Failed to request persistent storage:', err)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
