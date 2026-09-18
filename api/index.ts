import type { Request, Response } from "express";
import { createApp } from "../src/server/app.js";
import { connectDB } from "../src/server/config/db.js";

const app = createApp();

let dbPromise: Promise<void> | null = null;

function ensureDBConnection() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDBConnection();
  } catch (error) {
    console.error("MongoDB unavailable for request:", error);
    res.status(503).json({
      success: false,
      error: "Database unavailable",
    });
    return;
  }

  const forwarded =
    (req.headers["x-forwarded-uri"] as string) ||
    (req.headers["x-matched-path"] as string) ||
    (req.headers["x-vercel-matched-path"] as string) ||
    "";

  const original = req.originalUrl || "";

  if (
    req.url === "/api" ||
    req.url === "/api/" ||
    req.url === "/" ||
    !req.url
  ) {
    if (
      forwarded &&
      forwarded.startsWith("/api") &&
      forwarded !== "/api" &&
      forwarded !== "/api/"
    ) {
      req.url = forwarded;
    } else if (
      original &&
      original.startsWith("/api") &&
      original !== "/api" &&
      original !== "/api/"
    ) {
      req.url = original;
    }
  } else if (!req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }

  return app(req, res);
}

Object.setPrototypeOf(handler, app);
Object.assign(handler, app);

export { handler as app };
