import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { AdminAuthProvider } from './context/AdminAuthContext.tsx'
import { GuestAuthProvider } from './context/GuestAuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GuestAuthProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </AuthProvider>
    </GuestAuthProvider>
  </StrictMode>,
)
