import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Standard React plugin: enables JSX transform, HMR, and fast refresh
    react(),

    // Module Federation plugin — turns this app into a HOST
    federation({
      // Name this app uses to identify itself in the federation graph
      name: 'shell',

      // Remote MFEs this host will consume.
      // Each key is the module alias used in imports (e.g. 'onboarding/OnboardingApp')
      // Each value is the URL where that remote's manifest file is served.
      // We use placeholders here; real values come from .env in TASK-10.
      remotes: {
        onboarding: 'http://localhost:3001/assets/remoteEntry.js',
        dashboard:  'http://localhost:3002/assets/remoteEntry.js',
      },

      // Shared dependencies — these are deduplicated across host + all remotes.
      // 'singleton: true' means only one copy is ever loaded in the browser,
      // preventing the "two React instances" problem with hooks.
      // 'requiredVersion' must match what remotes declare in their own configs.
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.0.0',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^7.0.0',
        },
        '@auth0/auth0-react': {
          singleton: true,
          requiredVersion: '^2.0.0',
        },
        '@tanstack/react-query': {
          singleton: true,
          requiredVersion: '^5.0.0',
        },
      },
    }),
  ],

  // Dev server: shell app runs on port 3000 as specified in acceptance criteria
  server: {
    port: 3000,
    // strictPort prevents Vite from silently switching to another port if 3000 is taken
    strictPort: true,
  },

  // Build output: must be 'es' format for Module Federation to work
  // (it relies on dynamic import() which is an ESM feature)
  build: {
    target: 'esnext',
    minify: false, // Keep readable for debugging; enable in production
  },
})
