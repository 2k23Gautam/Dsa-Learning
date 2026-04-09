import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './store/AuthContext.jsx'
import { StoreProvider } from './store/StoreContext.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>,
)
