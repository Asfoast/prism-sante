import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/prism-sante/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Prism Sant\u00e9",
        short_name: "Sant\u00e9",
        description: "Alimentation, sport et sant\u00e9",
        start_url: "/prism-sante/",
        scope: "/prism-sante/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0A2342",
        theme_color: "#0A2342",
        icons: [
          {
            src: "/prism-sante/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/prism-sante/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/prism-sante/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/prism-sante/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        navigateFallback: "/prism-sante/index.html",
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ]
});
