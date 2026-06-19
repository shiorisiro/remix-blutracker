# Security hardening notes

This branch includes several security improvements for the server and auth middleware. Summary:

- Use server-only env vars (SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY) instead of VITE_ prefixed vars.
- Forbid local authentication fallback in production. Use ALLOW_LOCAL_FALLBACK=true only in development.
- Add security headers (helmet), CORS configuration, and rate limiting for APIs.
- Validate /api/gemini inputs using zod and enforce maximum content size.
- Do not return internal error messages to clients; log errors server-side with pino.

Deployment checklist:
- Add required secrets to your deployment environment (SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY).
- Set CORS_ORIGINS to the list of allowed origins in production.
- Ensure .env is not committed and that your CI/CD injects secrets securely.
- Run `npm install` to pick up new dependencies (helmet, cors, express-rate-limit, zod, pino, dotenv-safe).

If you'd like, I can open a PR description and mark it draft for review.