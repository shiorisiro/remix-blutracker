import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './src/middleware/auth';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { z } from 'zod';
import logger from './src/utils/logger';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  const isDev = process.env.NODE_ENV !== "production";
  logger.info({ env: process.env.NODE_ENV }, `[Server] Starting in ${isDev ? "DEVELOPMENT" : "PRODUCTION"} mode`);

  // Security headers
  app.use(helmet());

  // HSTS - enforce HTTPS in production
  app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }));

  // Content Security Policy
  const rawOrigins = process.env.CORS_ORIGINS;
  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.VITE_SUPABASE_URL || ''],
      frameAncestors: ["'none'"],
    },
  }));

  // CORS - restrict origins in production via CORS_ORIGINS env var (comma-separated)
  if (!rawOrigins && !isDev) {
    logger.error('CORS_ORIGINS is required in production. Startup aborted.');
    process.exit(1);
  }
  const whitelist = (rawOrigins || '').split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      // allow non-browser requests with no origin (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }
  }));

  // Global rate limiter
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: Number(process.env.RATE_LIMIT_MAX || 60),
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  // Smaller default body limit
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

  // Schema for Gemini request body
  const GeminiSchema = z.object({
    model: z.string().optional(),
    contents: z.union([z.string(), z.array(z.any())]).optional(),
    config: z.record(z.any()).optional()
  });

  // Per-route stricter limiter for /api/gemini
  const geminiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: Number(process.env.GEMINI_RATE_LIMIT_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false
  });

  app.post("/api/gemini", geminiLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const parse = GeminiSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const contents = parse.data.contents;
      const totalLen = typeof contents === 'string'
        ? contents.length
        : Array.isArray(contents) ? contents.reduce((s: number, c: any) => s + (c.text?.length || 0) + (c.inlineData?.data?.length || 0), 0) : 0;
      const maxLen = Number(process.env.GEMINI_MAX_CONTENT_LENGTH || 50000);
      if (totalLen > maxLen) {
        return res.status(413).json({ error: 'Payload too large' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error('GEMINI_API_KEY not configured.');
        return res.status(500).json({ error: 'Server misconfiguration' });
      }

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const { model, config } = parse.data;

      const response = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: parse.data.contents as any,
        config
      });

      res.json({ text: response.text });
    } catch (error: any) {
      logger.error({ err: error }, 'Gemini API Error');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    logger.info('[Server] Loaded Vite dev middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d', index: false }));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logger.info(`[Server] Serving production assets from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
