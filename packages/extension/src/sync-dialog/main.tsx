import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SyncDialogPage } from './SyncDialogPage'
import '../popup/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncDialogPage />
  </StrictMode>
)
