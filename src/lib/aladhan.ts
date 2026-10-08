import type { AsrSchool } from './methods'
import { aladhanDate, parseTimings, type AladhanTimingsResponse, type PrayerDay } from './prayerTimes'

const BASE = 'https://api.aladhan.com/v1'
const TIMEOUT_MS = 15000

export class AladhanError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new AladhanError(`Prayer time service returned ${response.status}.`)
    return (await response.json()) as T
  } catch (e) {
    if (e instanceof AladhanError) throw e
    throw new AladhanError("Couldn't reach the prayer time service. Check your connection.")
  } finally {
    clearTimeout(timer)
  }
}

export interface TimingsQuery {
  latitude: number
  longitude: number
  method: number
  school: AsrSchool
}

/** Prayer times for one day at a location, as exact instants (iso8601=true includes the UTC offset). */
export async function fetchPrayerDay(date: Date, q: TimingsQuery): Promise<PrayerDay> {
  const params = new URLSearchParams({
    latitude: q.latitude.toFixed(5),
    longitude: q.longitude.toFixed(5),
    method: String(q.method),
    school: q.school === 'hanafi' ? '1' : '0',
    iso8601: 'true',
  })
  const json = await getJson<AladhanTimingsResponse>(`${BASE}/timings/${aladhanDate(date)}?${params}`)
  if (json.code !== 200) throw new AladhanError(`Prayer time service error: ${json.status}`)
  return parseTimings(json)
}

export interface RamadanDay {
  /** 1-based day of Ramadan. */
  day: number
  /** Gregorian date, YYYY-MM-DD. */
  date: string
}

interface HijriCalendarResponse {
  code: number
  data: { gregorian: { date: string }; hijri: { day: string } }[]
}

/** The Gregorian dates of every day of Ramadan in a Hijri year (month 9). */
export async function fetchRamadanCalendar(hijriYear: number): Promise<RamadanDay[]> {
  const json = await getJson<HijriCalendarResponse>(`${BASE}/hToGCalendar/9/${hijriYear}`)
  if (json.code !== 200 || !Array.isArray(json.data)) throw new AladhanError('Could not load the Ramadan calendar.')
  return json.data.map((d) => {
    const [dd, mm, yyyy] = d.gregorian.date.split('-')
    return { day: Number(d.hijri.day), date: `${yyyy}-${mm}-${dd}` }
  })
}
