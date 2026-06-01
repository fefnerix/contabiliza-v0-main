
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // true = IPv4 + IPv6; só "::" no Windows pode recusar ligação a http://localhost
    host: true,
    port: 8080,
  },
  preview: {
    host: true,
    // Mesma porta exposta no Dockerfile / docker-compose (`npm run build && npm run preview`)
    port: Number(process.env.PREVIEW_PORT) || 4173,
    strictPort: false,
  },
  build:
    mode === "production"
      ? {
          minify: "terser",
          terserOptions: {
            compress: {
              pure_funcs: ["console.log", "console.info", "console.debug"],
            },
          },
        }
      : {},
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
              name: 'Contabiliza',
      short_name: 'Contabiliza',
      description: 'Gerencie suas finanças com Contabiliza',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        icons: [
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['finance', 'productivity']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/assets\//, /^\/workbox-/, /^\/sw\.js$/],
        // Dev build (`vite build --mode development`) gera bundle maior; precisa caber no precache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ],
        // Adicionar esta configuração para lidar com todas as rotas de navegação
        navigateFallback: 'index.html',
        // Opcionalmente, você pode excluir algumas rotas da navegação fallback
        // navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: true,
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
