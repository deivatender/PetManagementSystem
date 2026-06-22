/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the Pet Management SPA.
// During local dev we proxy `/api` to the FastAPI backend so the browser sees a
// same-origin URL and we avoid CORS entirely. The proxy target is overridable
// via VITE_DEV_API_PROXY for teammates running the backend elsewhere.
export default defineConfig(({ mode }) => {
  const proxyTarget = process.env.VITE_DEV_API_PROXY ?? 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy:
        mode === 'development'
          ? {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
              },
            }
          : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
