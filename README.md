# Run and deploy your AI Studio app

This contains everything you need to run your app locally.
## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Note: GEMINI_API_KEY is a server-side secret. Do NOT add it to client .env files or inject it into the client bundle.
   - For local development, set GEMINI_API_KEY in a server-side .env (used only by the server process), or run the server with the environment variable set.
   - Example (unix/mac):
     `GEMINI_API_KEY=your_key npm run dev`
3. Run the app:
   `npm run dev`
