import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';

dotenv.config();

// Require Google Client ID to be provided at build time. Do NOT hardcode fallback values.
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
