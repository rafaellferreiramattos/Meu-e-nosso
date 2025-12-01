import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite do aviso para 1000 kbs (1MB) para silenciar o erro na Vercel
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Separa as bibliotecas pesadas em arquivos diferentes (chunks)
        // Isso melhora o carregamento do site
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@google/genai', '@supabase/supabase-js', 'lucide-react']
        }
      }
    }
  }
});