import { LONDON, openTab, resetApp, scrollTo, setLocation, tap, textOf, waitForTestId } from '../helpers.ts'

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const TIME = /\d{1,2}:\d{2}/

describe('Prayer times', () => {
  before(async () => {
    await setLocation(LONDON)
    await resetApp()
  })

  it('shows the next prayer with a live countdown', async () => {
    await waitForTestId('next-prayer', 45_000)
    expect(PRAYERS).toContain(await textOf('next-prayer-name'))
    expect(await textOf('next-prayer-countdown')).toMatch(/^in \d+(h|m|s)/)
  })

  it('names the GPS location', async () => {
    expect(await textOf('place-name')).toMatch(/London|51\.50/)
  })

  it("lists today's five prayers and sunrise with times", async () => {
    for (const name of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      const row = await textOf(`time-${name}`)
      expect(row.toLowerCase()).toContain(name)
      expect(row).toMatch(TIME)
    }
  })

  it('shows the Gregorian and Hijri date and switches to tomorrow', async () => {
    await scrollTo('day-today')
    const today = await textOf('date-line')
    expect(today).toMatch(/AH/)
    await tap('day-tomorrow')
    const tomorrow = await textOf('date-line')
    expect(tomorrow).not.toEqual(today)
    await tap('day-today')
  })

  it('uses the regional calculation method automatically', async () => {
    expect(await textOf('method-line')).toMatch(/Muslim World League.*auto/)
  })

  it('keeps the location across tabs', async () => {
    await openTab('qibla')
    await waitForTestId('qibla-bearing')
    await openTab('times')
    await waitForTestId('next-prayer')
  })
})
