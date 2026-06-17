import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for Gemini
  app.post("/api/gemini", requireAuth, async (req: AuthRequest, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "API Key is missing." });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { model, contents, config } = req.body;
      
      const response = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents,
        config
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  const isDev = process.env.NODE_ENV !== "production";
  console.log(`[Server] Starting in ${isDev ? "DEVELOPMENT" : "PRODUCTION"} mode`);

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Loaded Vite dev middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Server] Serving production assets from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
