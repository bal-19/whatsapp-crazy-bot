import type { BotConfig } from "@whatsapp-bot/shared";
import { appDb } from "../db/database.js";
import { logService } from "./logService.js";

interface CachedConfig {
    config: BotConfig;
    loadedAt: number;
}

/**
 * Singleton service untuk manage bot configuration dengan caching.
 *
 * Features:
 * - Load config dari database saat startup
 * - Cache config dengan TTL untuk reduce database queries
 * - Auto-refresh config saat diperlukan
 * - Log config changes
 */
export class BotConfigService {
    private static instance: BotConfigService;
    private cached: CachedConfig | null = null;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit
    private isLoading = false;

    private constructor() {}

    /**
     * Get singleton instance
     */
    static getInstance(): BotConfigService {
        if (!BotConfigService.instance) {
            BotConfigService.instance = new BotConfigService();
        }
        return BotConfigService.instance;
    }

    /**
     * Initialize service dan load config saat startup
     */
    async initialize(): Promise<void> {
        try {
            await this.refreshConfig();
            logService.write("info", "bot_config_initialized", {
                botName: this.cached?.config.bot_name,
                isActive: this.cached?.config.is_active,
                ignoreGroups: this.cached?.config.ignore_groups,
            });
        } catch (error) {
            logService.write("error", "bot_config_initialization_failed", {
                errorMessage:
                    error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Get current config dari cache atau database
     * - Jika cache valid (< TTL), return dari cache
     * - Jika cache expired, reload dari database
     */
    async getConfig(): Promise<BotConfig> {
        // Cache valid?
        if (
            this.cached &&
            Date.now() - this.cached.loadedAt < this.CACHE_TTL_MS
        ) {
            return this.cached.config;
        }

        // Refresh cache
        return this.refreshConfig();
    }

    /**
     * Force reload config dari database (bypass cache)
     * Gunakan saat settings berubah via dashboard
     */
    async refreshConfig(): Promise<BotConfig> {
        if (this.isLoading) {
            // Jika sedang loading, tunggu sampai selesai lalu return cache
            let attempts = 0;
            while (this.isLoading && attempts < 50) {
                await new Promise((r) => setTimeout(r, 100));
                attempts++;
            }
            return this.cached?.config ?? (await appDb.getConfig());
        }

        this.isLoading = true;
        try {
            const config = await appDb.getConfig();
            const now = Date.now();

            // Log jika config berubah
            if (
                this.cached &&
                JSON.stringify(this.cached.config) !== JSON.stringify(config)
            ) {
                logService.write("info", "bot_config_changed", {
                    botName: config.bot_name,
                    previousBotName: this.cached.config.bot_name,
                    isActive: config.is_active,
                    previousIsActive: this.cached.config.is_active,
                });
            }

            this.cached = { config, loadedAt: now };
            return config;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get config field specific
     */
    async getBotName(): Promise<string> {
        const config = await this.getConfig();
        return config.bot_name;
    }

    async getSystemPrompt(): Promise<string> {
        const config = await this.getConfig();
        return config.system_prompt;
    }

    async isActive(): Promise<boolean> {
        const config = await this.getConfig();
        return config.is_active;
    }

    async shouldIgnoreGroups(): Promise<boolean> {
        const config = await this.getConfig();
        return config.ignore_groups;
    }

    async getToneStyle(): Promise<BotConfig["tone_style"]> {
        const config = await this.getConfig();
        return config.tone_style;
    }

    /**
     * Clear cache (for testing atau manual reset)
     */
    clearCache(): void {
        this.cached = null;
        logService.write("info", "bot_config_cache_cleared");
    }

    /**
     * Get cache info for debugging
     */
    getCacheInfo(): {
        isCached: boolean;
        cacheAge: number;
        nextRefreshIn: number;
    } {
        if (!this.cached) {
            return { isCached: false, cacheAge: 0, nextRefreshIn: 0 };
        }

        const cacheAge = Date.now() - this.cached.loadedAt;
        const nextRefreshIn = Math.max(0, this.CACHE_TTL_MS - cacheAge);

        return { isCached: true, cacheAge, nextRefreshIn };
    }
}

// Export singleton instance
export const botConfigService = BotConfigService.getInstance();
