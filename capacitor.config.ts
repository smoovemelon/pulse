import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.altius.app',
  appName: 'Altius',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
