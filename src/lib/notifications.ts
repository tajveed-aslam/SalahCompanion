import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { PrayerDay, PrayerName } from './prayerTimes'

/** Local notifications work on Android and iOS (including Expo Go); browsers aren't supported by expo-notifications. */
export const notificationsSupported = Platform.OS !== 'web'

const CHANNEL_ID = 'prayer-times'
let configured = false

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

/** Creates the Android channel (needed before the permission prompt can appear) and asks for permission. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }
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
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: time, channelId: CHANNEL_ID },
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
  await Notifications.scheduleNotificationAsync({
    content: { title: 'SalahCompanion', body: 'Prayer reminders are working.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
  })
}
