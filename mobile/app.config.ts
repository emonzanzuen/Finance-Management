import type { ConfigContext, ExpoConfig } from 'expo/config';

const isLocalDemo = process.env.EAS_BUILD_PROFILE === 'local-demo';

// Diisi dari environment saat project EAS sudah dibuat (`eas init`).
// Kosong berarti push token tidak dapat diminta; UI menampilkan pesan konfigurasi.
const easProjectId = process.env.EAS_PROJECT_ID ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FinManage',
  slug: 'finmanage',
  scheme: 'finmanage',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.finmanage.app',
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#4F46E5',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sharing',
    '@react-native-community/datetimepicker',
    'expo-notifications',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#4F46E5',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // HTTP (cleartext) hanya untuk profil build local-demo; production wajib HTTPS.
          usesCleartextTraffic: isLocalDemo,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Hanya true pada profil local-demo (layar ganti alamat server).
    allowServerOverride: isLocalDemo || process.env.EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE === 'true',
    eas: {
      projectId: easProjectId,
    },
  },
});
