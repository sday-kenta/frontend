
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080"

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["avatar.svg"],
        manifest: {
          name: "Сдай Кента",
          short_name: "Сдай Кента",
          description: "Сдай Кента",
          start_url: "/frontend/",
          scope: "/frontend/",
          display: "standalone",
          background_color: "#0b0f1a",
          theme_color: "#0b0f1a",
          icons: [
            {
              src: "/frontend/avatar.svg",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/frontend/avatar.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          navigateFallback: "/frontend/index.html",
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    base: "/frontend/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/v1": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
