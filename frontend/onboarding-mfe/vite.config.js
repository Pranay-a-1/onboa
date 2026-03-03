import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    // React plugin for JSX transform + fast refresh during local development.
    react(),

    // Module Federation: this app is a remote consumed by the shell host.
    federation({
      // Remote name used by the host when resolving federation modules.
      name: 'onboarding',

      // Keep remote entry path explicit so host URLs stay predictable.
      filename: 'assets/remoteEntry.js',

      // Expose the remote root component consumed by `onboarding/OnboardingApp`.
      exposes: {
        './OnboardingApp': './src/OnboardingApp.jsx',
      },

      // Share singleton runtime dependencies to avoid duplicate React/Auth0 instances.
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
      },
    }),
  ],

  // Task-11 dev server contract: onboarding-mfe runs on localhost:3001.
  server: {
    port: 3001,
    strictPort: true,
  },

  // ESM target keeps output compatible with module federation runtime loading.
  build: {
    target: 'esnext',
    minify: false,
  },
})
