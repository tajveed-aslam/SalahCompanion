import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation, type LocationStatus, type Place } from './hooks/useLocation'
import { usePrayerTimes, type ResolvedMethod } from './hooks/usePrayerTimes'
import {
  cancelPrayerNotifications,
  configureNotifications,
  notificationsSupported,
  schedulePrayerNotifications,
} from './lib/notifications'
import type { PrayerDay } from './lib/prayerTimes'
import { useSettings } from './settings'

interface AppDataValue {
  place: Place | null
  locationStatus: LocationStatus
  locationError: string | null
  locate: () => Promise<void>
  chooseSample: () => void
  days: PrayerDay[] | null
  timesLoading: boolean
  timesError: string | null
  offlineSince: string | null
  method: ResolvedMethod | null
  refreshTimes: () => void
  /** Reminders currently queued on the device (native only). */
  scheduledCount: number
}

const AppDataContext = createContext<AppDataValue | null>(null)

/** One location lookup and one prayer-time fetch shared by every screen, plus keeping reminders in sync. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { settings, loaded } = useSettings()
  const location = useLocation()
  const times = usePrayerTimes(location.place, settings, loaded)
  const [scheduledCount, setScheduledCount] = useState(0)

  useEffect(() => configureNotifications(), [])

  // Re-queue a week of reminders whenever the times or notification settings change.
  const { days } = times
  useEffect(() => {
    if (!notificationsSupported || !loaded) return
    let active = true
    const job = settings.notificationsEnabled && days
      ? schedulePrayerNotifications(days, settings.notify, location.place?.name ?? '')
      : cancelPrayerNotifications().then(() => 0)
    job.then((count) => active && setScheduledCount(count)).catch(() => active && setScheduledCount(0))
    return () => {
      active = false
    }
  }, [days, settings.notificationsEnabled, settings.notify, loaded, location.place?.name])

  const value: AppDataValue = {
    place: location.place,
    locationStatus: location.status,
    locationError: location.error,
    locate: location.locate,
    chooseSample: location.chooseSample,
    days: times.days,
    timesLoading: times.loading,
    timesError: times.error,
    offlineSince: times.offlineSince,
    method: times.method,
    refreshTimes: times.refresh,
    scheduledCount,
  }
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used inside <AppDataProvider>')
  return value
}
