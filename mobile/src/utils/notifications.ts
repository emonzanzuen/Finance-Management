import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const PUSH_ENABLED_KEY = 'finmanage.push_enabled';
export const PUSH_TOKEN_KEY = 'finmanage.push_token';
export const ANDROID_CHANNEL_ID = 'finmanage-alerts';

export type LocalNotificationsApi = {
  scheduleNotificationAsync: typeof import('expo-notifications/build/scheduleNotificationAsync').scheduleNotificationAsync;
  addNotificationResponseReceivedListener: typeof import('expo-notifications/build/NotificationsEmitter').addNotificationResponseReceivedListener;
  getLastNotificationResponseAsync: typeof import('expo-notifications/build/NotificationsEmitter').getLastNotificationResponseAsync;
  setNotificationHandler: typeof import('expo-notifications/build/NotificationsHandler').setNotificationHandler;
  getPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').getPermissionsAsync;
  requestPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').requestPermissionsAsync;
  setNotificationChannelAsync: typeof import('expo-notifications/build/setNotificationChannelAsync').setNotificationChannelAsync;
  AndroidImportance: typeof import('expo-notifications/build/NotificationChannelManager.types').AndroidImportance;
};

let NotificationsModule: LocalNotificationsApi | null = null;
let isLoadingNotifications = false;
let notificationsConfigured = false;

/** Persisted locally only after a successful POST /devices. */
export async function saveStoredPushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function clearStoredPushToken(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

/**
 * Load only local-notification submodules rather than the root `expo-notifications` barrel.
 * Importing the root barrel loads `topicSubscription`, which requires `ExpoTopicSubscriptionModule`
 * (removed from Expo Go on Android in SDK 53+) and crashes before local notification exports load.
 */
export async function getNotifications(): Promise<LocalNotificationsApi | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  if (NotificationsModule) {
    return NotificationsModule;
  }
  if (isLoadingNotifications) {
    while (isLoadingNotifications) {
      await new Promise((r) => setTimeout(r, 10));
    }
    return NotificationsModule;
  }
  isLoadingNotifications = true;
  try {
    const [
      schedulerMod,
      emitterMod,
      handlerMod,
      permissionsMod,
      channelMod,
      channelTypesMod,
    ] = await Promise.all([
      import('expo-notifications/build/scheduleNotificationAsync'),
      import('expo-notifications/build/NotificationsEmitter'),
      import('expo-notifications/build/NotificationsHandler'),
      import('expo-notifications/build/NotificationPermissions'),
      import('expo-notifications/build/setNotificationChannelAsync'),
      import('expo-notifications/build/NotificationChannelManager.types'),
    ]);

    NotificationsModule = {
      scheduleNotificationAsync: schedulerMod.scheduleNotificationAsync,
      addNotificationResponseReceivedListener: emitterMod.addNotificationResponseReceivedListener,
      getLastNotificationResponseAsync: emitterMod.getLastNotificationResponseAsync,
      setNotificationHandler: handlerMod.setNotificationHandler,
      getPermissionsAsync: permissionsMod.getPermissionsAsync,
      requestPermissionsAsync: permissionsMod.requestPermissionsAsync,
      setNotificationChannelAsync: channelMod.setNotificationChannelAsync,
      AndroidImportance: channelTypesMod.AndroidImportance,
    };
    return NotificationsModule;
  } catch {
    return null;
  } finally {
    isLoadingNotifications = false;
  }
}

/** Configure notification handler and Android channel. Call once at app startup (e.g., in _layout.tsx). */
export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'web' || notificationsConfigured) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    // Handle notifications received while app is in foreground (heads-up banner like WhatsApp)
    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    // Create high-importance Android notification channels for heads-up popups
    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'FinManage Alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        enableLights: true,
      });
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }

    notificationsConfigured = true;
  } catch {
    // Ignore native configuration errors on unsupported environments
  }
}

/** Trigger an immediate OS-level heads-up notification banner on the phone. */
export async function sendLocalNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await configureNotifications();
  const Notifications = await getNotifications();
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data ?? {},
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

/** Get Expo push token, safely handling Expo Go or missing projectId. */
export async function getExpoPushToken(): Promise<string | null> {
  if (isExpoGo || Platform.OS === 'web') return null;

  // projectId is required by getExpoPushTokenAsync; without it we cannot register remote push.
  const projectId =
    Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== 'string' || projectId.length === 0) return null;

  try {
    const tokenMod = await import('expo-notifications/build/getExpoPushTokenAsync');
    if (typeof tokenMod.getExpoPushTokenAsync !== 'function') return null;
    const token = await tokenMod.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    // Token fetch can fail on devices without Google Play services or FCM config; treat as unavailable.
    return null;
  }
}
