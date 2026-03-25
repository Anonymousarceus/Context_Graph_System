import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#f8fafc',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f8fafc',
          },
        },
      }}
    />
  </React.StrictMode>
)
