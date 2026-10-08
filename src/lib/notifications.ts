// Import the local-notification pieces directly instead of the 'expo-notifications' entry point. The entry point
// loads a module that registers a push-token listener on startup, and in Expo Go on Android (SDK 53+) that
// *throws* ("push notifications were removed from Expo Go … use a development build"), crashing the app before it
// renders. This app only schedules local notifications, which Expo Go still supports, so it never needs that module.
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync'
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types'
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions'
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types'
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler'
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync'
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync'
import { isRunningInExpoGo } from 'expo'
import { Platform } from 'react-native'
import type { PrayerDay, PrayerName } from './prayerTimes'

const Notifications = {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
}

/** Local notifications work on Android and iOS (including Expo Go); browsers aren't supported by expo-notifications. */
export const notificationsSupported = Platform.OS !== 'web'

const CHANNEL_ID = 'prayer-times'
let configured = false
/** Whether our "Prayer times" Android channel exists; until then notifications use Expo's default channel. */
let channelReady = false

/** Expo Go on Android ships without parts of the native notification stack; a real build has all of it. */
const limitedExpoGo = Platform.OS === 'android' && isRunningInExpoGo()

/** A message for the user when a notification call fails. */
export function notificationErrorMessage(): string {
  return limitedExpoGo
    ? "Expo Go on Android can't schedule this app's notifications. Install the Android build (APK) to get prayer alerts."
    : "Couldn't set up notifications on this device. Check that notifications are allowed for SalahCompanion."
}

/**
 * Creates the high-importance "Prayer times" channel. Expo Go on Android doesn't include the channel manager
 * (the call rejects with a NullPointerException), so a failure is tolerated: notifications then go to Expo's
 * default channel instead.
 */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
    channelReady = true
  } catch {
    channelReady = false
  }
}

const channel = () => (channelReady ? { channelId: CHANNEL_ID } : {})

/** Show prayer alerts even while the app is open. Call once at startup. */
export function configureNotifications(): void {
  if (!notificationsSupported || configured) return
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
  configured = true
}

/**
 * Creates the Android channel (on Android 13+ the permission prompt only appears once a channel exists) and asks
 * for permission. Throws when the device can't do notifications at all; see notificationErrorMessage.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false
  await ensureChannel()
  const existing = await Notifications.getPermissionsAsync()
  if (existing.granted) return true
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  })
  return requested.granted
}

/**
 * Replaces all scheduled prayer reminders with one per enabled prayer for the given days (only future times).
 * Rescheduled on every app open and settings change, so a week of reminders is always queued even if the app
 * isn't opened for several days. Returns how many were scheduled.
 */
export async function schedulePrayerNotifications(
  days: PrayerDay[],
  enabled: Record<PrayerName, boolean>,
  place: string,
  now: Date = new Date(),
): Promise<number> {
  if (!notificationsSupported) return 0
  await ensureChannel()
  await Notifications.cancelAllScheduledNotificationsAsync()

  let count = 0
  for (const day of days) {
    for (const { name, time } of day.times) {
      if (name === 'Sunrise' || !enabled[name] || time.getTime() <= now.getTime()) continue
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${name} · ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          body: `It's time for ${name}${place ? ` in ${place}` : ''}.`,
          sound: 'default',
          data: { prayer: name },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: time, ...channel() },
      })
      count++
    }
  }
  return count
}

export async function cancelPrayerNotifications(): Promise<void> {
  if (notificationsSupported) await Notifications.cancelAllScheduledNotificationsAsync()
}

/** Fires a sample reminder in 5 seconds so users can check notifications work on their device. */
export async function sendTestNotification(): Promise<void> {
  if (!notificationsSupported) return
  await ensureChannel()
  await Notifications.scheduleNotificationAsync({
    content: { title: 'SalahCompanion', body: 'Prayer reminders are working.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, ...channel() },
  })
}
