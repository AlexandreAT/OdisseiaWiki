import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
});