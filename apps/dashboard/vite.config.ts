import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png"],
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
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/pwa-192x192-maskable.png",
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
                        src: "/pwa-512x512-maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                screenshots: [
                    {
                        src: "/screenshot-1.png",
                        sizes: "540x720",
                        type: "image/png",
                        form_factor: "narrow",
                    },
                    {
                        src: "/screenshot-2.png",
                        sizes: "1280x720",
                        type: "image/png",
                        form_factor: "wide",
                    },
                ],
                categories: ["productivity", "business"],
                shortcuts: [
                    {
                        name: "Conversations",
                        short_name: "Chat",
                        description: "Lihat dan kelola percakapan WhatsApp",
                        url: "/conversations",
                        icons: [
                            {
                                src: "/icon-conversations.png",
                                sizes: "192x192",
                            },
                        ],
                    },
                    {
                        name: "Analytics",
                        short_name: "Stats",
                        description: "Lihat analitik dan statistik bot",
                        url: "/analytics",
                        icons: [
                            {
                                src: "/icon-analytics.png",
                                sizes: "192x192",
                            },
                        ],
                    },
                    {
                        name: "Configuration",
                        short_name: "Config",
                        description: "Konfigurasi bot dan sistem",
                        url: "/config",
                        icons: [
                            {
                                src: "/icon-config.png",
                                sizes: "192x192",
                            },
                        ],
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\..*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // 24 hours
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-apis",
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                ],
                skipWaiting: true,
                clientsClaim: true,
            },
            devOptions: {
                enabled: true,
                navigateFallback: "index.html",
                suppressWarnings: true,
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
