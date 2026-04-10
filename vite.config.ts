
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import basicSSL from "@vitejs/plugin-basic-ssl"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const appBase = env.VITE_APP_BASE || "/frontend/"
  const normalizedBase = appBase.endsWith("/") ? appBase : `${appBase}/`
  const apiTarget =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL?.replace(/\/v1\/?$/, "") ||
    "http://localhost:8080"

  return {
    plugins: [
      basicSSL(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["avatar.svg"],
        manifest: {
          name: "Сдай Кента",
          short_name: "Сдай Кента",
          description: "Сдай Кента",
          start_url: normalizedBase,
          scope: normalizedBase,
          display: "standalone",
          background_color: "#0b0f1a",
          theme_color: "#0b0f1a",
          icons: [
            {
              src: `${normalizedBase}avatar.svg`,
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: `${normalizedBase}avatar.svg`,
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          navigateFallback: `${normalizedBase}index.html`,
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    base: normalizedBase,
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
