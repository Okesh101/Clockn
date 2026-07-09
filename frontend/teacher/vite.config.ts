import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:5000/api/v1",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "polka-jogger-selector.ngrok-free.dev"
    ]
  },
})
