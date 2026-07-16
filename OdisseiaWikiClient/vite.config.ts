import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  if (command === 'build') {
    if (!env.VITE_API_URL?.trim()) {
      throw new Error('VITE_API_URL deve ser configurada para o build de produção.');
    }

    if (!env.VITE_GOOGLE_CLIENT_ID?.trim()) {
      throw new Error('VITE_GOOGLE_CLIENT_ID deve ser configurado para o build de produção.');
    }
  }

  return {
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/assets_dynamic': {
                target: 'http://localhost:5146', // seu backend
                changeOrigin: true,
                secure: false
            }
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
  };
});
