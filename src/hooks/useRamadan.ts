import { useCallback, useEffect, useState } from 'react'
import { AladhanError, fetchHijriDate, fetchRamadanCalendar, type RamadanDay } from '../lib/aladhan'
import type { HijriDate } from '../lib/prayerTimes'
import { localIsoDate, nextStatus, type FastRecord } from '../lib/ramadan'
import { KEYS, loadJson, saveJson } from '../lib/storage'

/** Today's Hijri date, cached per Gregorian day so the tracker also opens offline. */
export function useHijriToday() {
  const [hijri, setHijri] = useState<HijriDate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const today = localIsoDate(new Date())
    ;(async () => {
      const cached = await loadJson<{ date: string; hijri: HijriDate } | null>(KEYS.hijriToday, null)
      if (cached?.date === today) {
        if (active) setHijri(cached.hijri)
        return
      }
      try {
        const fresh = await fetchHijriDate(new Date())
        if (!active) return
        setHijri(fresh)
        void saveJson(KEYS.hijriToday, { date: today, hijri: fresh })
      } catch (e) {
        if (!active) return
        // A day-old Hijri date is still good enough to pick which Ramadan to show.
        if (cached) setHijri(cached.hijri)
        else setError(e instanceof AladhanError ? e.message : 'Could not load the Hijri date.')
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return { hijri, error }
}

/** One Ramadan's Gregorian calendar and the user's fasting record for it (persisted in AsyncStorage). */
export function useRamadanYear(hijriYear: number | null) {
  const [reloadKey, setReloadKey] = useState(0)
  // Each piece of state remembers which year (or request) it belongs to, so switching years never shows stale data
  // and the effect doesn't have to reset anything synchronously.
  const [loadedCalendar, setLoadedCalendar] = useState<{ year: number; days: RamadanDay[] } | null>(null)
  const [loadedRecord, setLoadedRecord] = useState<{ year: number; record: FastRecord } | null>(null)
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null)

  const requestId = hijriYear === null ? null : `${hijriYear}#${reloadKey}`
  const calendar = loadedCalendar && loadedCalendar.year === hijriYear ? loadedCalendar.days : null
  const record = loadedRecord && loadedRecord.year === hijriYear ? loadedRecord.record : {}
  const error = failed && failed.id === requestId ? failed.message : null
  const loading = requestId !== null && !calendar && !error

  useEffect(() => {
    if (hijriYear === null || requestId === null) return
    let active = true
    ;(async () => {
      const saved = await loadJson<FastRecord>(KEYS.ramadan(hijriYear), {})
      if (active) setLoadedRecord({ year: hijriYear, record: saved })

      const cached = await loadJson<RamadanDay[] | null>(KEYS.ramadanCalendar(hijriYear), null)
      if (cached) {
        if (active) setLoadedCalendar({ year: hijriYear, days: cached })
        return
      }
      try {
        const fresh = await fetchRamadanCalendar(hijriYear)
        if (!active) return
        setLoadedCalendar({ year: hijriYear, days: fresh })
        void saveJson(KEYS.ramadanCalendar(hijriYear), fresh)
      } catch (e) {
        if (active) setFailed({ id: requestId, message: e instanceof AladhanError ? e.message : 'Could not load the Ramadan calendar.' })
      }
    })()
    return () => {
      active = false
    }
  }, [hijriYear, requestId])

  const toggleDay = useCallback(
    (day: number) => {
      if (hijriYear === null) return
      setLoadedRecord((current) => {
        const next = { ...(current?.year === hijriYear ? current.record : {}) }
        const status = nextStatus(next[day])
        if (status) next[day] = status
        else delete next[day]
        void saveJson(KEYS.ramadan(hijriYear), next)
        return { year: hijriYear, record: next }
      })
    },
    [hijriYear],
  )

  const reset = useCallback(() => {
    if (hijriYear === null) return
    setLoadedRecord({ year: hijriYear, record: {} })
    void saveJson(KEYS.ramadan(hijriYear), {})
  }, [hijriYear])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  return { calendar, record, loading, error, toggleDay, reset, retry }
}
