import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { JigiTheme } from '@/design-system/JigiTheme'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <JigiTheme>
        <App />
      </JigiTheme>
    </BrowserRouter>
  </StrictMode>
)
