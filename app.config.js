/**
 * App Store Deployment Configuration
 * Comprehensive configuration for iOS App Store and Google Play Store deployment
 */

import 'dotenv/config';

const config = {
  expo: {
    name: 'CallDefender',
    slug: 'calldefender',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.callexample.calldefender',
      buildNumber: '1.0.0',
      infoPlist: {
        NSContactsUsageDescription: 'CallDefender needs access to your contacts to identify and block spam calls.',
        NSMicrophoneUsageDescription: 'CallDefender needs access to your microphone to record calls for evidence.',
        NSPhoneCallUsageDescription: 'CallDefender needs access to your phone to identify and block spam calls.',
        NSCameraUsageDescription: 'CallDefender needs camera access for video calls and scanning.',
        NSLocationWhenInUseUsageDescription: 'CallDefender uses location to provide region-specific scam alerts.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'CallDefender uses location to provide real-time scam alerts even when the app is in background.',
        NSFaceIDUsageDescription: 'Use Face ID to securely access your CallDefender account.',
        NSCalendarsUsageDescription: 'CallDefender needs calendar access to schedule important follow-up actions.',
        NSRemindersUsageDescription: 'CallDefender needs reminders access to notify you about important deadlines.',
        UIBackgroundModes: [
          'audio',
          'background-processing',
          'background-fetch',
          'remote-notification'
        ],
        UIRequiredDeviceCapabilities: [
          'telephony'
        ],
        UIRequiresFullScreen: true,
        UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          'tel',
          'sms',
          'mailto',
          'http',
          'https',
          'facetime',
          'whatsapp'
        ],
        NSBluetoothPeripheralUsageDescription: 'CallDefender uses Bluetooth for enhanced device detection.',
        NSBluetoothAlwaysUsageDescription: 'CallDefender uses Bluetooth for continuous scam call detection.'
      },
      config: {
        usesNonExemptEncryption: false
      },
      capabilities: [
        'ios.developer.team'
      ],
      entitlements: {
        'com.apple.developer.contacts.contacts': true,
        'com.apple.developer.networking.HotspotConfiguration': false,
        'com.apple.developer.associated-domains': ['applinks:callexample.com'],
        'com.apple.developer.networking.wifi-info': true,
        'com.apple.developer.networking.HotspotConfiguration': false,
        'aps-environment': 'development'
      }
    },
    android: {
      package: 'com.callexample.calldefender',
      versionCode: 1,
      compileSdkVersion: 33,
      targetSdkVersion: 33,
      minSdkVersion: 21,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      permissions: [
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
        'android.permission.READ_PHONE_STATE',
        'android.permission.CALL_PHONE',
        'android.permission.READ_CALL_LOG',
        'android.permission.WRITE_CALL_LOG',
        'android.permission.ANSWER_PHONE_CALLS',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.INTERNET',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.CAMERA',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.USE_FINGERPRINT',
        'android.permission.USE_BIOMETRIC',
        'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'com.google.android.gms.permission.AD_ID',
        'android.permission.ACCESS_WIFI_STATE',
        'android.permission.CHANGE_WIFI_STATE',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_ADMIN',
        'android.permission.BLUETOOTH_ADVERTISE',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.NEARBY_WIFI_DEVICES',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.USE_FULL_SCREEN_INTENT',
        'android.permission.HIGH_SAMPLING_RATE_SENSORS',
        'android.permission.ACTIVITY_RECOGNITION',
        'android.permission.BODY_SENSORS',
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS',
        'android.permission.RECEIVE_SMS',
        'android.permission.PROCESS_OUTGOING_CALLS'
      ],
      usesCleartextTraffic: false,
      networkSecurityConfig: './android/app/src/main/res/xml/network_security_config.xml',
      intentFilters: [
        {
          action: 'android.intent.action.PHONE_STATE',
          data: {
            scheme: 'tel'
          }
        },
        {
          action: 'android.intent.action.NEW_OUTGOING_CALL'
        },
        {
          action: 'android.intent.action.VIEW',
          data: {
            scheme: 'tel'
          }
        }
      ],
      meta: {
        'com.google.android.geo.API_KEY': process.env.GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key'
      }
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    plugins: [
      'expo-local-authentication',
      'expo-secure-store',
      'expo-location',
      'expo-contacts',
      'expo-camera',
      'expo-av',
      'expo-notifications',
      'expo-background-fetch',
      'expo-task-manager',
      'expo-sms',
      'expo-call',
      'expo-battery',
      'expo-network',
      'expo-device',
      'expo-sensors',
      'expo-file-system',
      'expo-asset',
      'expo-constants',
      'expo-haptics',
      'expo-blur',
      'expo-linear-gradient',
      'expo-splash-screen',
      'expo-status-bar',
      [
        'expo-build-properties',
        {
          ios: {
            flipper: false,
            newArchEnabled: true
          },
          android: {
            newArchEnabled: true,
            enableProguardInReleaseBuilds: true
          }
        }
      ],
      [
        'expo-updates',
        {
          username: 'callexample',
          runtimeVersion: '1.0.0',
          checkAutomatically: 'ON_LOAD',
          fallbackToCacheTimeout: 0
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-eas-project-id'
      },
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key',
      SEGMENT_WRITE_KEY: process.env.SEGMENT_WRITE_KEY || 'your-segment-write-key',
      SENTRY_DSN: process.env.SENTRY_DSN || 'your-sentry-dsn',
      API_BASE_URL: process.env.API_BASE_URL || 'https://api.callexample.com',
      WS_BASE_URL: process.env.WS_BASE_URL || 'wss://ws.callexample.com'
    },
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      '**/*'
    ],
    experiments: {
      newArchEnabled: true,
      typedRoutes: true
    },
    owner: 'callexample'
  }
};

export default config;