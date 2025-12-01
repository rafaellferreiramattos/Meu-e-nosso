import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite apenas para evitar avisos, sem quebrar o build com configurações complexas
    chunkSizeWarningLimit: 2000,
  }
});