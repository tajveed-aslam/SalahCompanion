export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
export type PrayerName = (typeof PRAYERS)[number]

/** Shown in the list for reference; not a prayer and never notified. */
export type TimeName = PrayerName | 'Sunrise'

export interface PrayerTime {
  name: TimeName
  time: Date
}

export interface HijriDate {
  day: number
  month: number
  monthName: string
  monthNameAr: string
  year: number
}

export interface PrayerDay {
  /** Gregorian date of these times, YYYY-MM-DD. */
  date: string
  times: PrayerTime[]
  hijri: HijriDate
  timezone: string
  methodName: string
}

const ORDER: TimeName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

/** Minimal shape of AlAdhan's /v1/timings response (requested with iso8601=true). */
export interface AladhanTimingsResponse {
  code: number
  status: string
  data: {
    timings: Record<string, string>
    date: {
      gregorian: { date: string } // DD-MM-YYYY
      hijri: { day: string; year: string; month: { number: number; en: string; ar: string } }
    }
    meta: { timezone: string; method: { name: string } }
  }
}

/** Converts an AlAdhan response into exact instants. With iso8601=true each time carries its UTC offset. */
export function parseTimings(response: AladhanTimingsResponse): PrayerDay {
  const { timings, date, meta } = response.data
  const times = ORDER.map((name) => {
    const raw = timings[name]
    const time = new Date(raw)
    if (!raw || Number.isNaN(time.getTime())) throw new Error(`Missing or invalid time for ${name}: ${raw}`)
    return { name, time }
  })
  const [dd, mm, yyyy] = date.gregorian.date.split('-')
  return {
    date: `${yyyy}-${mm}-${dd}`,
    times,
    hijri: {
      day: Number(date.hijri.day),
      month: date.hijri.month.number,
      monthName: date.hijri.month.en,
      monthNameAr: date.hijri.month.ar,
      year: Number(date.hijri.year),
    },
    timezone: meta.timezone,
    methodName: meta.method.name,
  }
}

export interface NextPrayer {
  name: PrayerName
  time: Date
  msUntil: number
  /** The prayer whose time has most recently started, if any today. */
  current: PrayerName | null
}

/**
 * The next of the five prayers after `now`, looking at today and then tomorrow (so after Isha it's tomorrow's
 * Fajr). Sunrise is skipped: it marks the end of Fajr, not a prayer.
 */
export function nextPrayer(days: PrayerDay[], now: Date): NextPrayer | null {
  const prayers = days
    .flatMap((d) => d.times)
    .filter((t): t is PrayerTime & { name: PrayerName } => t.name !== 'Sunrise')
    .sort((a, b) => a.time.getTime() - b.time.getTime())

  const next = prayers.find((p) => p.time.getTime() > now.getTime())
  if (!next) return null
  const past = prayers.filter((p) => p.time.getTime() <= now.getTime())
  return {
    name: next.name,
    time: next.time,
    msUntil: next.time.getTime() - now.getTime(),
    current: past.length > 0 ? past[past.length - 1].name : null,
  }
}

/** "2h 05m", "14m 09s", "45s". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** Local wall-clock time, e.g. "05:12". */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** DD-MM-YYYY, the format AlAdhan's path parameter expects. */
export function aladhanDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
}
