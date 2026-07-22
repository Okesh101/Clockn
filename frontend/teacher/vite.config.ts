import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' // 💡 Imported the PWA builder

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    // 💡 Add the PWA engine configuration directly here
    VitePWA({
      registerType: 'autoUpdate', // Automatically patches mobile devices when you deploy updates
      includeAssets: ['favicon.ico', 'apple-icon.png', 'manifest.json'], // 💡 Updated assets list
      manifest: {
        name: 'ClockN Attendance System',
        short_name: 'ClockN',
        description: 'Secure QR Code and Button Attendance Tracking System',
        theme_color: '#0B2545',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'android-icon-192x192.png', // 💡 Matches your generated file name
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'apple-icon.png', // 💡 High-res fallback matching your folder file
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: [
      'polka-jogger-selector.ngrok-free.dev'
    ],
    proxy: {
      "/api/v1": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
