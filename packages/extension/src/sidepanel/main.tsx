import React from 'react'
import { createRoot } from 'react-dom/client'
import { initConfig } from '@hchat/shared'
import App from './App'
import './styles/globals.css'

initConfig({
  apiBaseUrl: 'https://sgtlim0--hchat-api-api.modal.run',
  isDev: false,
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
