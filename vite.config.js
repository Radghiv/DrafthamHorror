import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app lives in src/ (its index.html is the entry). The sources use JSX in .js files, so both esbuild and the plugin are told to read
// them as JSX.
export default defineConfig({
    root: 'src',
    publicDir: '../public',
    base: './',
    plugins: [
        react({ include: /\.(js|jsx)$/ }),
        // Installable, and the app itself works offline (the card data is in the browser's cache, see cache.js). A new version is
        // offered with a notice and only takes over when the user reloads, so a draft is never interrupted.
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'logo512-maskable.png'],
            manifest: {
                name: 'Draftham Horror',
                short_name: 'Draftham',
                description: 'Drafting tool for Arkham Horror: The Card Game',
                start_url: './',
                scope: './',
                display: 'standalone',
                theme_color: '#0f1218',
                background_color: '#0f1218',
                icons: [
                    { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'logo512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,ico,svg,webmanifest}'],
                // the fonts of Google Fonts, fetched once and kept
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } }
                    }
                ]
            }
        })
    ],
    esbuild: { loader: 'jsx', include: /\/src\/.*\.js$/, exclude: [] },
    optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
    server: { port: 3000 },
    build: { outDir: '../build', emptyOutDir: true },
    test: { environment: 'jsdom', globals: true }
})
