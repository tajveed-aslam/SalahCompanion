export type FastStatus = 'fasted' | 'missed'

/** Day of Ramadan (1–30) → status. Unmarked days are absent. */
export type FastRecord = Record<number, FastStatus>

export interface FastStats {
  fasted: number
  /** Missed fasts still to be made up (qada). */
  missed: number
  /** Consecutive fasted days ending at the most recently marked day. */
  currentStreak: number
  bestStreak: number
}

/**
 * Stats for one Ramadan. `upToDay` is the last day that can be counted (today's day of Ramadan, or the month's
 * length once it's over). Trailing unmarked days (today, or days not filled in yet) don't break the current streak;
 * a missed day, or an unmarked gap between marked days, does.
 */
export function fastStats(record: FastRecord, totalDays: number, upToDay: number): FastStats {
  const last = Math.min(Math.max(upToDay, 0), totalDays)
  let fasted = 0
  let missed = 0
  let best = 0
  let run = 0
  for (let day = 1; day <= last; day++) {
    const status = record[day]
    if (status === 'fasted') {
      fasted++
      run++
      best = Math.max(best, run)
    } else {
      if (status === 'missed') missed++
      run = 0
    }
  }

  let current = 0
  let day = last
  while (day >= 1 && record[day] === undefined) day-- // not filled in yet
  while (day >= 1 && record[day] === 'fasted') {
    current++
    day--
  }

  return { fasted, missed, currentStreak: current, bestStreak: best }
}

/** Tap cycle for a day: unmarked → fasted → missed → unmarked. */
export function nextStatus(status: FastStatus | undefined): FastStatus | undefined {
  if (status === undefined) return 'fasted'
  if (status === 'fasted') return 'missed'
  return undefined
}

/**
 * Which day of the given Ramadan `today` is: 0 before it starts, 1..n during, n once it's over.
 * Dates are YYYY-MM-DD strings, so plain string comparison orders them.
 */
export function ramadanProgress(dates: string[], today: string): number {
  if (dates.length === 0 || today < dates[0]) return 0
  const index = dates.findIndex((d) => d === today)
  return index >= 0 ? index + 1 : dates.length
}

export function localIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
