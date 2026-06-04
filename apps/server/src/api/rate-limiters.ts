import type { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { logService } from "../services/logService.js";

interface LimiterConfig {
    event: string;
    limit: number;
    message: string;
    skipSuccessfulRequests?: boolean;
    windowMs: number;
    keyGenerator?: (req: Request) => string;
}

export const apiRateLimiter = createRateLimiter({
    event: "api_rate_limit_exceeded",
    limit: env.API_RATE_LIMIT_MAX,
    message: "Terlalu banyak request. Coba lagi sebentar ya.",
    windowMs: env.API_RATE_LIMIT_WINDOW_MS,
});

export const authRateLimiter = createRateLimiter({
    event: "auth_rate_limit_exceeded",
    limit: env.AUTH_RATE_LIMIT_MAX,
    message: "Terlalu banyak percobaan login. Coba lagi nanti ya.",
    skipSuccessfulRequests: true,
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => {
        const username =
            typeof req.body?.username === "string"
                ? req.body.username.trim().toLowerCase()
                : "unknown";

        return `${resolveClientIp(req)}:${username}`;
    },
});

export const testPromptRateLimiter = createRateLimiter({
    event: "test_prompt_rate_limit_exceeded",
    limit: env.TEST_PROMPT_RATE_LIMIT_MAX,
    message: "Test prompt sedang dibatasi. Coba lagi sebentar ya.",
    windowMs: env.TEST_PROMPT_RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => resolveClientIp(req),
});

function createRateLimiter(config: LimiterConfig): RequestHandler {
    return rateLimit({
        windowMs: config.windowMs,
        limit: config.limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        keyGenerator: config.keyGenerator,
        handler: (req, res) => {
            logService.write("warn", config.event, {
                ip: resolveClientIp(req),
                method: req.method,
                path: req.originalUrl,
                limit: config.limit,
                windowMs: config.windowMs,
            });

            res.status(429).json({
                message: config.message,
                retry_after_seconds: Math.ceil(config.windowMs / 1000),
            });
        },
    });
}

function resolveClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || "unknown";
}
