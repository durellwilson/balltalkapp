const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_BETA = process.env.APP_VARIANT === 'beta';

export default {
  name: IS_DEV ? 'BallTalk (Dev)' : IS_BETA ? 'BallTalk (Beta)' : 'BallTalk',
  slug: 'balltalkapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/balltalk-app',
    enabled: true,
    checkAutomatically: 'ON_LOAD',
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? 'com.balltalk.dev' : IS_BETA ? 'com.balltalk.beta' : 'com.balltalk',
    buildNumber: '1',
    infoPlist: {
      NSMicrophoneUsageDescription: "BallTalk needs access to your microphone to record audio."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: IS_DEV ? 'com.balltalk.dev' : IS_BETA ? 'com.balltalk.beta' : 'com.balltalk',
    versionCode: 1,
    permissions: [
      "RECORD_AUDIO",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: 'balltalk-app',
    },
  },
  owner: 'balltalk',
  // Add channels for EAS Update
  channel: IS_DEV ? 'development' : IS_BETA ? 'beta' : 'production',
}; 