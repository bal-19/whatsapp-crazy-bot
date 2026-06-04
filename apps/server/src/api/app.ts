import express from "express";
import cors from "cors";
import { env } from "../config/env.js";
import { createApiRouter } from "./routes.js";
import { apiRateLimiter } from "./rate-limiters.js";

export function createApp(): express.Express {
    const app = express();

    app.use(
        cors({
            origin: [env.DASHBOARD_ORIGIN, "http://localhost:5173"],
            credentials: true,
        }),
    );
    app.use(express.json({ limit: "1mb" }));
    app.use(apiRateLimiter);

    app.get("/health", (_req, res) => {
        res.json({ ok: true });
    });

    app.use("/api/v1", createApiRouter());

    app.use(
        (
            err: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction,
        ) => {
            const message =
                err instanceof Error ? err.message : "Internal server error";
            res.status(500).json({ message });
        },
    );

    return app;
}
