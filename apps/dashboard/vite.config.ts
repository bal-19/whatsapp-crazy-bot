import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            // Jangan include manual manifest.json — biarkan plugin yang generate
            includeAssets: [
                "favicon.ico",
                "apple-touch-icon.png",
                "pwa-192x192.png",
                "pwa-512x512.png",
            ],
            // Wajib untuk generate SW yang valid
            injectRegister: "auto",
            manifest: {
                name: "WhatsApp AI Bot Dashboard",
                short_name: "Bot Dashboard",
                description:
                    "Dashboard untuk mengelola WhatsApp AI Bot dengan analitik dan konfigurasi real-time",
                theme_color: "#ffffff",
                background_color: "#ffffff",
                scope: "/",
                start_url: "/",
                display: "standalone",
                orientation: "portrait",
                lang: "id",
                // HANYA icon yang file-nya benar-benar ada di public/
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                // HAPUS screenshots & shortcuts — jika file PNG-nya tidak ada,
                // browser Android menolak installability check secara diam-diam
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
                // Penting: navigateFallback agar SPA routing bekerja di offline
                navigateFallback: "index.html",
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        // Cache API calls ke server lokal (bukan https://api.*)
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith("/api/"),
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // 24 jam
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
                skipWaiting: true,
                clientsClaim: true,
            },
            devOptions: {
                // Matikan di dev untuk menghindari konflik HMR
                enabled: false,
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
    },
});
