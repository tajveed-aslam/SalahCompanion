import type { AsrSchool } from './methods'
import { aladhanDate, parseTimings, type AladhanTimingsResponse, type HijriDate, type PrayerDay } from './prayerTimes'

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

interface AladhanCalendarResponse {
  code: number
  status: string
  data: AladhanTimingsResponse['data'][]
}

async function fetchMonth(year: number, month: number, q: TimingsQuery): Promise<PrayerDay[]> {
  const params = new URLSearchParams({
    latitude: q.latitude.toFixed(5),
    longitude: q.longitude.toFixed(5),
    method: String(q.method),
    school: q.school === 'hanafi' ? '1' : '0',
    iso8601: 'true',
  })
  const json = await getJson<AladhanCalendarResponse>(`${BASE}/calendar/${year}/${month}?${params}`)
  if (json.code !== 200 || !Array.isArray(json.data)) throw new AladhanError(`Prayer time service error: ${json.status}`)
  return json.data.map((d) => parseTimings({ code: 200, status: 'OK', data: d }))
}

/**
 * Prayer times for `count` consecutive days starting at `from`, using one request per calendar month touched
 * (usually one). Enough days to schedule a week of notifications in advance.
 */
export async function fetchPrayerDays(from: Date, count: number, q: TimingsQuery): Promise<PrayerDay[]> {
  const last = new Date(from.getFullYear(), from.getMonth(), from.getDate() + count - 1)
  const months = [{ year: from.getFullYear(), month: from.getMonth() + 1 }]
  if (last.getMonth() !== from.getMonth() || last.getFullYear() !== from.getFullYear())
    months.push({ year: last.getFullYear(), month: last.getMonth() + 1 })

  const all = (await Promise.all(months.map((m) => fetchMonth(m.year, m.month, q)))).flat()
  const start = aladhanDate(from).split('-').reverse().join('-') // DD-MM-YYYY → YYYY-MM-DD
  return all.filter((d) => d.date >= start).slice(0, count)
}

interface GToHResponse {
  code: number
  data: { hijri: { day: string; year: string; month: { number: number; en: string; ar: string } } }
}

/** Today's Hijri date (no location needed). */
export async function fetchHijriDate(date: Date): Promise<HijriDate> {
  const json = await getJson<GToHResponse>(`${BASE}/gToH/${aladhanDate(date)}`)
  if (json.code !== 200) throw new AladhanError('Could not load the Hijri date.')
  const h = json.data.hijri
  return { day: Number(h.day), month: h.month.number, monthName: h.month.en, monthNameAr: h.month.ar, year: Number(h.year) }
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
