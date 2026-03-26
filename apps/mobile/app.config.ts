import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "StudyTodo",
  slug: "studytodo",
  scheme: "studytodo",
  version: "1.0.3",
  orientation: "portrait",
  icon: "./assets/combined-icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.studytodo.app",
    buildNumber: "1.0.1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      googleMobileAdsAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/combined-icon.png",
      backgroundColor: "#ffffff"
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.studytodo.app",
    config: {
      googleMobileAdsAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-sqlite",
    "expo-secure-store",
    "expo-localization",
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff",
        "sounds": []
      }
    ],
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
        "iosAppId": process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
      }
    ]
  ],
  extra: {
    admobAndroidBannerId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
    admobIosBannerId: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
    eas: {
      projectId: "cfd433f3-e082-435b-b951-34b9c052fdd8"
    }
  }
});