import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Import the new plugin
import wyw from '@wyw-in-js/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // React plugin without special babel config now
    react(),
    // Use wyw plugin instead of linaria
    wyw({
      // Include TypeScript files
      include: ['**/*.{ts,tsx}'],
      // Add necessary Babel presets for TypeScript and React
      babelOptions: {
        presets: ['@babel/preset-typescript', '@babel/preset-react'],
      },
      // Keep source maps for development
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
  ],
})
