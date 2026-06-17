import type { CapacitorConfig } from '@capacitor/cli';

// We fall back to the project's standard Web Client ID based on sender ID (433471653749)
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || '433471653749-p589v1t6d525jpsg96f4tkaoc081bqu7.apps.googleusercontent.com';

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
