import { fastStats, localIsoDate, nextStatus, ramadanProgress, type FastRecord } from '../ramadan'

describe('fastStats', () => {
  it('counts fasted and missed days and the best streak', () => {
    const record: FastRecord = { 1: 'fasted', 2: 'fasted', 3: 'fasted', 4: 'missed', 5: 'fasted' }
    expect(fastStats(record, 30, 30)).toEqual({ fasted: 4, missed: 1, currentStreak: 1, bestStreak: 3 })
  })

  it("doesn't let today (or other trailing unmarked days) break the current streak", () => {
    const record: FastRecord = { 1: 'fasted', 2: 'fasted', 3: 'fasted' }
    expect(fastStats(record, 30, 4).currentStreak).toBe(3)
    expect(fastStats(record, 30, 30).currentStreak).toBe(3)
  })

  it('breaks the streak at a missed day or an unmarked gap', () => {
    expect(fastStats({ 1: 'fasted', 2: 'missed', 3: 'fasted' }, 30, 3).currentStreak).toBe(1)
    expect(fastStats({ 1: 'fasted', 3: 'fasted' }, 30, 3)).toMatchObject({ currentStreak: 1, bestStreak: 1 })
  })

  it('ignores marks beyond the days counted so far', () => {
    expect(fastStats({ 1: 'fasted', 10: 'fasted' }, 30, 5)).toMatchObject({ fasted: 1, currentStreak: 1 })
    expect(fastStats({ 1: 'fasted' }, 30, 0)).toEqual({ fasted: 0, missed: 0, currentStreak: 0, bestStreak: 0 })
  })

  it('caps at the length of the month', () => {
    const all: FastRecord = Object.fromEntries(Array.from({ length: 29 }, (_, i) => [i + 1, 'fasted' as const]))
    expect(fastStats(all, 29, 40)).toEqual({ fasted: 29, missed: 0, currentStreak: 29, bestStreak: 29 })
  })
})

describe('nextStatus', () => {
  it('cycles unmarked → fasted → missed → unmarked', () => {
    expect(nextStatus(undefined)).toBe('fasted')
    expect(nextStatus('fasted')).toBe('missed')
    expect(nextStatus('missed')).toBeUndefined()
  })
})

describe('ramadanProgress', () => {
  const dates = ['2026-02-18', '2026-02-19', '2026-02-20']

  it('is 0 before, the day number during, and the length after', () => {
    expect(ramadanProgress(dates, '2026-02-17')).toBe(0)
    expect(ramadanProgress(dates, '2026-02-19')).toBe(2)
    expect(ramadanProgress(dates, '2026-10-08')).toBe(3)
    expect(ramadanProgress([], '2026-10-08')).toBe(0)
  })

  it('formats local dates', () => {
    expect(localIsoDate(new Date(2026, 1, 3))).toBe('2026-02-03')
  })
})
