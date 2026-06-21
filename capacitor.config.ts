import type { CapacitorConfig } from '@capacitor/cli';

// Read from environment variable (works in CI and local)
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error('VITE_GOOGLE_CLIENT_ID is required. Set it in your build environment (CI or .env) and do not commit it to source.');
}

const config: CapacitorConfig = {
  appId: 'com.blutracker.app',
  appName: 'Blu Tracker',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: googleClientId,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
