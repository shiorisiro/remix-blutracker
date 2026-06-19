# BluTracker Security Hardening — Copilot Task List

> **Repo**: `shiorisiro/remix-blutracker`  
> **Generated**: 2026-06-19  
> **Severity**: 🔴 Critical (3), 🟠 High (4), 🟡 Medium (5), 🟢 Low (6)  
> **Estimated Effort**: ~2–3 hours

---

## 🔴 CRITICAL — Fix Immediately

### 1. Remove `GEMINI_API_KEY` from Client Bundle
**File**: `vite.config.ts`  
**Issue**: The Gemini API key is bundled into client-side JavaScript via `define`, making it extractable by anyone.

```typescript
// ❌ REMOVE THIS ENTIRE BLOCK
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
},
```

**Fix**: The client already calls `/api/gemini` (server-side). No client-side key is needed.

```typescript
// ✅ vite.config.ts — remove the define block entirely
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({ ... })
    ],
    // REMOVED: define: { 'process.env.GEMINI_API_KEY': ... }
    resolve: { ... },
    server: { ... },
  };
});
```

**Verify**: After build, search `dist/assets/*.js` for the API key — it must NOT appear.

```bash
grep -r "AIza" dist/assets/ || echo "✅ Clean"
```

---

### 2. Remove Hardcoded Google OAuth Client ID
**File**: `capacitor.config.ts`  
**Issue**: Fallback Client ID is hardcoded in source, exposing the app's Google identity.

```typescript
// ❌ BEFORE
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || 
  '433471653749-p589v1t6d525jpsg96f4tkaoc081bqu7.apps.googleusercontent.com';
```

```typescript
// ✅ AFTER
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error(
    'VITE_GOOGLE_CLIENT_ID is required. ' +
    'Set it in your .env file or environment variables.'
  );
}
```

**Action**: 
1. Rotate the exposed Client ID in Google Cloud Console
2. Add `VITE_GOOGLE_CLIENT_ID` to `.env.example`
3. Update CI/CD secrets

---

### 3. Remove `ALLOW_LOCAL_FALLBACK` Mock Auth
**File**: `src/middleware/auth.ts`  
**Issue**: Missing auth headers grant mock admin access in non-production environments.

```typescript
// ❌ REMOVE THIS ENTIRE BLOCK
const allowLocalFallback = process.env.NODE_ENV !== 'production' && 
  process.env.ALLOW_LOCAL_FALLBACK === 'true';

// ... inside requireAuth():
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  if (allowLocalFallback) {
    req.user = { uid: 'local-mock-user-id', email: 'fallback-user@example.com' };
    req.dbUser = { id: 'local-mock-user-id', uid: 'local-mock-user-id', email: 'fallback-user@example.com' };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
```

```typescript
// ✅ AFTER — strict auth only
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**For testing**: Use a proper test fixture or mock middleware in test files, not production code.

---

## 🟠 HIGH — Fix Before Production

### 4. Harden Supabase Query (RLS Bypass Risk)
**File**: `src/db.ts`  
**Issue**: String interpolation in `.or()` query could be manipulated.

```typescript
// ❌ BEFORE (multiple locations)
.or(`user_id.eq.${userId},owner_id.eq.${userId}`)
```

```typescript
// ✅ AFTER — use Supabase's filter API safely
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .or('owner_id.eq.' + userId); // Still string-based but userId is trusted from auth
  // OR better: enforce RLS on Supabase side and simplify query:
  // .eq('user_id', userId) — let RLS handle owner_id
```

**Better approach**: Ensure Supabase Row Level Security (RLS) policies are properly configured server-side, then simplify queries to just `.eq('user_id', userId)`.

---

### 5. Enforce Password Strength
**File**: `src/components/LoginPage.tsx` + `src/auth.ts`  
**Issue**: No password complexity requirements.

```typescript
// ✅ Add to LoginPage.tsx — inside handleSubmit()
const isPasswordValid = password.length >= 8 && 
  /[A-Z]/.test(password) && 
  /[a-z]/.test(password) && 
  /[0-9]/.test(password) && 
  /[^A-Za-z0-9]/.test(password);

if (!isPasswordValid) {
  setPasswordError(true);
  setGeneralError('Password must be at least 8 characters with uppercase, lowercase, number, and symbol.');
  setIsLoading(false);
  return;
}
```

**Also**: Add same validation to `AuthModal.tsx` registration flow.

---

### 6. Prevent CORS "Allow All" in Production
**File**: `server.ts`  
**Issue**: Empty `CORS_ORIGINS` defaults to allowing all origins.

```typescript
// ❌ BEFORE
const whitelist = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// if whitelist.length === 0 → allows ALL origins

// ✅ AFTER
const rawOrigins = process.env.CORS_ORIGINS;
if (!rawOrigins && process.env.NODE_ENV === 'production') {
  logger.error('CORS_ORIGINS is required in production');
  process.exit(1);
}

const whitelist = (rawOrigins || '').split(',').map(s => s.trim()).filter(Boolean);
```

---

### 7. Sanitize User Input Before Rendering
**File**: `src/App.tsx` (and components displaying transaction data)  
**Issue**: User-generated content (titles, categories) rendered without sanitization.

```typescript
// ✅ Add a utility: src/lib/sanitize.ts
export function sanitizeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Use it wherever user input is displayed:
// <span>{sanitizeHtml(transaction.title)}</span>
```

**Note**: React JSX escaping handles most cases, but defense in depth is recommended.

---

## 🟡 MEDIUM — Address Soon

### 8. Move Auth Token from localStorage to httpOnly Cookie
**Files**: `src/auth.ts`, `src/supabase-client.ts`  
**Issue**: Tokens in localStorage are vulnerable to XSS extraction.

```typescript
// ❌ BEFORE (supabase-client.ts)
storage: localStorage,
storageKey: 'blutracker-auth-token',

// ✅ AFTER — use Supabase's cookie-based session
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storage: undefined, // Use default (cookies when available)
  // OR implement a custom cookie storage adapter
},
```

**Alternative**: Keep using Supabase's built-in cookie session management by removing the custom `storage` override.

---

### 9. Add Content Security Policy (CSP) Headers
**File**: `server.ts`  
**Issue**: No CSP configured via Helmet.

```typescript
// ✅ Add to server.ts after helmet()
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // adjust as needed
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:"],
    connectSrc: ["'self'", process.env.VITE_SUPABASE_URL || ''],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

---

### 10. Replace External PWA Manifest Icons
**File**: `public/manifest.json`  
**Issue**: Icons loaded from `picsum.photos` — third party can change content.

```json
// ❌ BEFORE
"icons": [
  { "src": "https://picsum.photos/seed/bluicon/192/192", ... },
  { "src": "https://picsum.photos/seed/bluicon/512/512", ... }
]

// ✅ AFTER — use local assets
"icons": [
  { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
]
```

---

### 11. Add HSTS Header
**File**: `server.ts`

```typescript
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

---

### 12. Validate File Type on CSV/XLSX Import
**File**: `src/App.tsx` — import handlers  
**Issue**: No validation of uploaded file types.

```typescript
// ✅ Add before parsing
const allowedTypes = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

if (!allowedTypes.includes(file.type)) {
  alert('Invalid file type. Please upload a CSV or Excel file.');
  return;
}
```

---

## 🟢 LOW — Polish & Cleanup

| # | Task | File | Action |
|---|------|------|--------|
| 13 | Remove unused files | `bggray.txt`, `bgwhite.txt` | `git rm bggray.txt bgwhite.txt` |
| 14 | Fix `package.json` version | `package.json` | Change `"version": "0.0.0"` to `"0.1.0"` |
| 15 | Log `dotenv-safe` errors | `src/middleware/auth.ts` | Replace `// swallow` with `logger.warn({ err }, 'dotenv-safe check failed')` |
| 16 | Add `X-Content-Type-Options: nosniff` | `server.ts` | Already handled by `helmet()`, verify |
| 17 | Add `X-Frame-Options: DENY` | `server.ts` | Already handled by `helmet()`, verify |
| 18 | Review `metadata.json` | `metadata.json` | Ensure no sensitive data; remove if unused |

---

## 📋 Environment Variables Checklist

Ensure these are set in your deployment environment (never commit `.env`):

| Variable | Required | Location | Notes |
|----------|----------|----------|-------|
| `SUPABASE_URL` | ✅ Server | `.env` (server) | Server-only, no `VITE_` prefix |
| `SUPABASE_ANON_KEY` | ✅ Server | `.env` (server) | Server-only, no `VITE_` prefix |
| `GEMINI_API_KEY` | ✅ Server | `.env` (server) | Server-only, never client |
| `VITE_SUPABASE_URL` | ✅ Client | `.env` (build) | Public, used by client |
| `VITE_SUPABASE_ANON_KEY` | ✅ Client | `.env` (build) | Public anon key only |
| `VITE_GOOGLE_CLIENT_ID` | ✅ Client | `.env` (build) | For Capacitor Google Auth |
| `CORS_ORIGINS` | ✅ Prod | `.env` (server) | Comma-separated, no spaces |
| `RATE_LIMIT_MAX` | Optional | `.env` (server) | Default: 60 |
| `GEMINI_RATE_LIMIT_MAX` | Optional | `.env` (server) | Default: 10 |
| `GEMINI_MAX_CONTENT_LENGTH` | Optional | `.env` (server) | Default: 50000 |
| `ALLOW_LOCAL_FALLBACK` | ❌ Remove | — | **Delete this variable entirely** |

---

## 🔧 Copilot Commands

Run these in your terminal after applying fixes:

```bash
# 1. Verify no secrets in build output
npm run build
grep -rE "(AIza[0-9A-Za-z_-]{35}|eyJhbGci|433471653749)" dist/ || echo "✅ No leaked keys"

# 2. Type check
npm run lint

# 3. Test auth middleware
npm run dev &
curl -X POST http://localhost:3000/api/gemini   -H "Content-Type: application/json"   -d '{"contents":"test"}'
# Should return 401 (no auth header)

# 4. Verify CORS blocks unknown origins
curl -H "Origin: https://evil.com"   -I http://localhost:3000/api/gemini
# Should return CORS error in production
```

---

## 🎯 Summary

| Category | Count | Status |
|----------|-------|--------|
| Critical | 3 | 🔴 Must fix before any deployment |
| High | 4 | 🟠 Fix before production |
| Medium | 5 | 🟡 Address within 1 sprint |
| Low | 6 | 🟢 Nice-to-have cleanup |

**Total estimated time**: 2–3 hours of focused work.

---

*Generated for GitHub Copilot — paste into a new issue or PR description to track progress.*
