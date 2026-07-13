import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api/v1": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:5000", // For local development
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
