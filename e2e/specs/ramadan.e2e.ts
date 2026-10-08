import { byTestId, LONDON, openTab, relaunchApp, resetApp, scrollTo, setLocation, tap, tapDialogButton, textOf, waitForTestId } from '../helpers.ts'

/**
 * The tracker opens on the Ramadan that is running or most recently finished, so this assumes the run isn't during
 * its first five days (when days 2–5 would still be locked).
 */
describe('Ramadan tracker', () => {
  before(async () => {
    await setLocation(LONDON)
    await resetApp()
    await waitForTestId('tab-ramadan', 45_000)
    await openTab('ramadan')
    await waitForTestId('ramadan-grid', 45_000)
  })

  async function stats() {
    return {
      streak: Number(await textOf('stat-streak')),
      best: Number(await textOf('stat-best')),
      fasted: Number(await textOf('stat-fasted')),
      missed: Number(await textOf('stat-missed')),
    }
  }

  it('shows the Ramadan date range from the Hijri calendar', async () => {
    expect(await textOf('ramadan-range')).toMatch(/(29|30) days/)
    expect(await stats()).toEqual({ streak: 0, best: 0, fasted: 0, missed: 0 })
  })

  it('marks days fasted and missed and computes streaks', async () => {
    for (const day of [1, 2, 3]) await tap(`fast-day-${day}`)
    await tap('fast-day-4')
    await tap('fast-day-4') // second tap: missed
    await tap('fast-day-5')
    expect(await stats()).toEqual({ streak: 1, best: 3, fasted: 4, missed: 1 })
  })

  it('clears a day on the third tap', async () => {
    await tap('fast-day-5')
    await tap('fast-day-5')
    expect(await stats()).toMatchObject({ fasted: 3, missed: 2 })
    await tap('fast-day-5') // cleared
    expect(await stats()).toMatchObject({ fasted: 3, missed: 1 })
  })

  it('keeps the record after the app restarts (AsyncStorage)', async () => {
    await relaunchApp()
    await openTab('ramadan')
    await waitForTestId('ramadan-grid', 45_000)
    expect(await stats()).toMatchObject({ fasted: 3, missed: 1, best: 3 })
  })

  it('locks the days of an upcoming Ramadan', async () => {
    const chips = await $$('android=new UiSelector().resourceIdMatches("ramadan-year-\\\\d+")')
    await chips[chips.length - 1].click()
    await waitForTestId('ramadan-upcoming', 45_000)
    expect(await byTestId('fast-day-1').getAttribute('enabled')).toBe('false')
    await chips[0].click()
    await waitForTestId('ramadan-grid')
  })

  it('clears the whole Ramadan after confirming', async () => {
    await scrollTo('ramadan-reset')
    await tap('ramadan-reset')
    await tapDialogButton('(?i)ok')
    expect(await stats()).toEqual({ streak: 0, best: 0, fasted: 0, missed: 0 })
  })
})
