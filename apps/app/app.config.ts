import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pickle',
  slug: 'pickle',
  scheme: 'pickle',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  backgroundColor: '#1A1A18',
  icon: './assets/pickle-icon-ios-1024.png',
  android: {
    // Change before your first store build.
    package: 'app.pickle.frontend',
    adaptiveIcon: {
      foregroundImage: './assets/android-adaptive-foreground-1024.png',
      backgroundImage: './assets/android-adaptive-background-1024.png',
      backgroundColor: '#1B4A2D',
    },
  },
  ios: {
    bundleIdentifier: 'app.pickle.frontend',
    icon: './assets/pickle-icon-ios-1024.png',
    supportsTablet: true,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.ico',
  },
  plugins: [
    'expo-router',
    ['expo-image-picker', { photosPermission: 'Pickle needs your photos so you can attach a screenshot to a card.' }],
  ],
  experiments: {
    typedRoutes: false,
  },
};

export default config;
