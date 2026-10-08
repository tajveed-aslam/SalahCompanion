import { aladhanDate, formatCountdown, formatTime, nextPrayer, parseTimings, timeZoneCity, type AladhanTimingsResponse } from '../prayerTimes'

function response(date: string, offset: string, overrides: Record<string, string> = {}): AladhanTimingsResponse {
  const [dd, mm, yyyy] = date.split('-')
  const at = (hm: string) => `${yyyy}-${mm}-${dd}T${hm}:00${offset}`
  return {
    code: 200,
    status: 'OK',
    data: {
      timings: {
        Fajr: at('05:21'),
        Sunrise: at('07:13'),
        Dhuhr: at('12:48'),
        Asr: at('15:45'),
        Sunset: at('18:23'),
        Maghrib: at('18:23'),
        Isha: at('20:07'),
        Midnight: at('23:59'),
        ...overrides,
      },
      date: {
        gregorian: { date },
        hijri: { day: '27', year: '1448', month: { number: 4, en: 'Rabīʿ al-thānī', ar: 'رَبيع الثاني' } },
      },
      meta: { timezone: 'Europe/London', method: { name: 'Muslim World League' } },
    },
  }
}

const today = parseTimings(response('08-10-2026', '+01:00'))
const tomorrow = parseTimings(response('09-10-2026', '+01:00'))

describe('parseTimings', () => {
  it('keeps the six times in order as exact instants, ignoring extras', () => {
    expect(today.times.map((t) => t.name)).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'])
    expect(today.times[0].time.toISOString()).toBe('2026-10-08T04:21:00.000Z')
    expect(today.date).toBe('2026-10-08')
    expect(today.hijri).toMatchObject({ day: 27, month: 4, year: 1448 })
    expect(today.timezone).toBe('Europe/London')
  })

  it('rejects a response with a missing or garbled time', () => {
    expect(() => parseTimings(response('08-10-2026', '+01:00', { Asr: 'nonsense' }))).toThrow(/Asr/)
  })
})

describe('nextPrayer', () => {
  const days = [today, tomorrow]
  const at = (iso: string) => new Date(iso)

  it('finds the next prayer and the one in progress', () => {
    const next = nextPrayer(days, at('2026-10-08T14:00:00Z')) // 15:00 in London; Asr is at 15:45
    expect(next).toMatchObject({ name: 'Asr', current: 'Dhuhr' })
    expect(next!.msUntil).toBe(45 * 60 * 1000)
  })

  it('skips Sunrise', () => {
    expect(nextPrayer(days, at('2026-10-08T05:00:00Z'))?.name).toBe('Dhuhr') // 06:00 in London, after Fajr
  })

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const next = nextPrayer(days, at('2026-10-08T21:00:00Z'))
    expect(next?.name).toBe('Fajr')
    expect(next?.time.toISOString()).toBe('2026-10-09T04:21:00.000Z')
    expect(next?.current).toBe('Isha')
  })

  it('has no current prayer before the first Fajr', () => {
    expect(nextPrayer(days, at('2026-10-08T01:00:00Z'))).toMatchObject({ name: 'Fajr', current: null })
  })

  it('returns null when every time has passed', () => {
    expect(nextPrayer(days, at('2026-10-10T00:00:00Z'))).toBeNull()
  })
})

describe('formatting', () => {
  it('formats countdowns', () => {
    expect(formatCountdown(2 * 3600_000 + 5 * 60_000 + 30_000)).toBe('2h 05m')
    expect(formatCountdown(14 * 60_000 + 9_000)).toBe('14m 09s')
    expect(formatCountdown(45_000)).toBe('45s')
    expect(formatCountdown(-5)).toBe('0s')
  })

  it("formats a time in the location's own zone", () => {
    const fajr = today.times[0].time
    expect(formatTime(fajr, 'Europe/London')).toMatch(/05:21/)
    expect(formatTime(fajr, 'Asia/Karachi')).toMatch(/09:21/)
    expect(formatTime(fajr, 'Not/AZone')).toMatch(/\d{2}:\d{2}/) // falls back instead of throwing
  })

  it('builds the AlAdhan date and names cities from time zones', () => {
    expect(aladhanDate(new Date(2026, 0, 5))).toBe('05-01-2026')
    expect(timeZoneCity('Europe/London')).toBe('London')
    expect(timeZoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
    expect(timeZoneCity('UTC')).toBeNull()
    expect(timeZoneCity(undefined)).toBeNull()
  })
})
