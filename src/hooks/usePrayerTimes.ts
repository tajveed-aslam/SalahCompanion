import { useCallback, useEffect, useState } from 'react'
import { AladhanError, fetchPrayerDays } from '../lib/aladhan'
import { autoMethod, type AsrSchool } from '../lib/methods'
import type { PrayerDay } from '../lib/prayerTimes'
import { KEYS, loadJson, saveJson } from '../lib/storage'
import type { Settings } from '../settings'
import type { Place } from './useLocation'

/** Days fetched ahead: today and tomorrow for the screen, a week for notifications. */
const DAYS_AHEAD = 7

interface Cached {
  key: string
  fetchedAt: string
  days: (Omit<PrayerDay, 'times'> & { times: { name: string; time: string }[] })[]
}

export interface ResolvedMethod {
  method: number
  school: AsrSchool
  auto: boolean
}

export function resolveMethod(settings: Settings, place: Place): ResolvedMethod {
  const auto = autoMethod(place.latitude, place.longitude)
  return {
    method: settings.method === 'auto' ? auto.method : settings.method,
    school: settings.school === 'auto' ? auto.school : settings.school,
    auto: settings.method === 'auto',
  }
}

const cacheKey = (place: Place, m: ResolvedMethod) =>
  `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}|${m.method}|${m.school}`

function revive(cached: Cached): PrayerDay[] {
  return cached.days.map((d) => ({ ...d, times: d.times.map((t) => ({ name: t.name as PrayerDay['times'][number]['name'], time: new Date(t.time) })) }))
}

/**
 * Prayer times for the next week at `place`. If the network fails, the last successful result for the same place
 * and method is shown instead (flagged as offline), so the app keeps working without a connection.
 */
export function usePrayerTimes(place: Place | null, settings: Settings, settingsLoaded: boolean) {
  const [days, setDays] = useState<PrayerDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offlineSince, setOfflineSince] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const method = place ? resolveMethod(settings, place) : null
  const key = place && method ? cacheKey(place, method) : null

  useEffect(() => {
    if (!place || !method || !key || !settingsLoaded) return
    let active = true
    setLoading(true)
    setError(null)

    fetchPrayerDays(new Date(), DAYS_AHEAD, { latitude: place.latitude, longitude: place.longitude, ...method })
      .then((fresh) => {
        if (!active) return
        setDays(fresh)
        setOfflineSince(null)
        void saveJson(KEYS.lastTimes, {
          key,
          fetchedAt: new Date().toISOString(),
          days: fresh.map((d) => ({ ...d, times: d.times.map((t) => ({ name: t.name, time: t.time.toISOString() })) })),
        } satisfies Cached)
      })
      .catch(async (e: unknown) => {
        if (!active) return
        const cached = await loadJson<Cached | null>(KEYS.lastTimes, null)
        if (cached && cached.key === key) {
          setDays(revive(cached))
          setOfflineSince(cached.fetchedAt)
        } else {
          setError(e instanceof AladhanError ? e.message : 'Could not load prayer times.')
        }
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
    // `method` is derived from key's inputs; key changes whenever it matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, settingsLoaded, reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])
  return { days, loading, error, offlineSince, method, refresh }
}
