import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monitorescolar.pro',
  appName: 'MonitorEscolar',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '183026720548-7p2g2nopms5mnn6g5ctejuraslkaogjd.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
