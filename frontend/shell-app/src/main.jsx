import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.jsx'

// ─── MUI Dark Theme ───────────────────────────────────────────────────────────
// We define the theme here (at the root) so that every MUI component
// in the shell AND in both remote MFEs inherits the same design tokens.
// The 'palette.mode: dark' flips all MUI defaults (backgrounds, text, dividers)
// to their dark-mode variants automatically.
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      // PranayBank brand purple — used for buttons, links, highlights
      main: '#6C63FF',
    },
    secondary: {
      // Accent teal for contrast
      main: '#00D4AA',
    },
    background: {
      // Per design spec: #0A0E1A as the base canvas
      default: '#0A0E1A',
      // Slightly elevated surface (cards, drawers)
      paper: '#111827',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    // Slightly rounder corners for the glassmorphism aesthetic
    borderRadius: 12,
  },
})

// ─── Auth0 Configuration ──────────────────────────────────────────────────────
// All Auth0 values come from environment variables, never hardcoded.
// These are read at runtime from the .env.local file (Vite injects them at build time).
// VITE_AUTH0_DOMAIN    — e.g. "your-tenant.us.auth0.com"
// VITE_AUTH0_CLIENT_ID — the SPA client ID from Auth0 dashboard
// VITE_AUTH0_AUDIENCE  — the API identifier registered in Auth0
const auth0Config = {
  domain:       import.meta.env.VITE_AUTH0_DOMAIN,
  clientId:     import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: window.location.origin,
    // audience tells Auth0 to issue an access token valid for our backend API
    audience:   import.meta.env.VITE_AUTH0_AUDIENCE,
    // Request the 'openid', 'profile', 'email' scopes plus our custom roles claim
    scope:      'openid profile email',
  },
}

// ─── TanStack Query Client ───────────────────────────────────────────────────
// Central query client for shell and remote MFEs.
// Defaults reduce noisy refetch behavior while keeping retry resilience.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ─── Application Entry Point ──────────────────────────────────────────────────
// Provider nesting order matters:
//   1. Auth0Provider must be outermost (needs to intercept redirect callbacks
//      before the router renders anything)
//   2. QueryClientProvider provides shared server-state cache/mutations
//   3. ThemeProvider wraps everything so MUI theme is globally available
//   4. CssBaseline resets browser defaults (margins, box-sizing, font) to
//      match the dark theme background colour
//   5. BrowserRouter provides routing context for react-router-dom
//   6. App renders the actual route tree
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider {...auth0Config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>,
)
