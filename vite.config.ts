import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'TRAVEL JUST Mysuru Cabs',
          short_name: 'TRAVEL JUST',
          description: 'Mysuru taxi booking service for outstation drops, airport transfers, and local packages.',
          theme_color: '#032014',
          background_color: '#032014',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['travel', 'transportation', 'navigation'],
          prefer_related_applications: false,
          shortcuts: [
            {
              name: 'Book One-Way Cab',
              short_name: 'One-Way',
              description: 'Point-to-point one-way outstation taxi drop',
              url: '/#booking-search-section',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Airport Taxi Transfer',
              short_name: 'Airport',
              description: 'Mysuru to Bengaluru Kempegowda Airport (BLR) Cabs',
              url: '/#booking-search-section',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Local Hourly Package',
              short_name: 'Local Cab',
              description: 'Hourly rental cabs in Mysuru (4h, 8h, 12h)',
              url: '/#booking-search-section',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Round Trip Outstation',
              short_name: 'Round Trip',
              description: 'Outstation cabs for family holidays and return trips',
              url: '/#booking-search-section',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          importScripts: ['/sw-push.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/fare\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tj-fare-api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/maps\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tj-maps-api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/api\/search\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tj-search-results-cache-v1',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('@google/genai')) return 'genai';
              if (id.includes('jspdf')) return 'jspdf';
              if (id.includes('lucide-react')) return 'lucide';
              if (id.includes('motion')) return 'motion';
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
