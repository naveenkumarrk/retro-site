// vite.config.js
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [tailwindcss(), sveltekit()],

    // Server dev options — make dev much quieter
    server: {
      // Disable HMR websocket noise and /@vite/client requests
      hmr: false,
      // You can still enable HMR later by changing this to true
    },

    optimizeDeps: {
      // pre-bundle commonly used packages so dev doesn't request many small modules
      include: [
        // add libs you use heavily (examples)
        '@sveltejs/kit',
        'svelte',
        'svelte/internal'
      ]
    },

    // Build options used for production (and preview)
    build: {
      sourcemap: false,           // no .map files
      minify: 'esbuild',         // fast minify
      cssMinify: true,
      cssCodeSplit: true,
      target: 'esnext',
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          // hashed file names for caching / obfuscation
          chunkFileNames: 'assets/[hash].js',
          entryFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]',

          // If you want a single (or fewer) JS chunks in production:
          // NOTE: forcing one huge chunk can hurt caching and initial load.
          manualChunks: () => 'bundle'
        }
      },

      // reduce module preload noise (useful in some deploys)
      modulePreload: {
        polyfill: false
      }
    },

    // Expose a __DEV__ flag to code if useful
    define: {
      __DEV__: JSON.stringify(isDev)
    },

    // SSR options left default; you can tune noExternal if needed
    ssr: {
      noExternal: []
    }
  };
});
