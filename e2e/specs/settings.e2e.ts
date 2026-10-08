import { isChecked, LONDON, openTab, resetApp, scrollTo, setLocation, tap, textOf, waitForTestId } from '../helpers.ts'

async function scheduledCount(): Promise<number> {
  return Number((await textOf('scheduled-count')).match(/^(\d+)/)?.[1] ?? NaN)
}

describe('Settings and prayer notifications', () => {
  before(async () => {
    await setLocation(LONDON)
    await resetApp({ grantNotifications: true })
    await waitForTestId('next-prayer', 45_000)
    await openTab('settings')
  })

  it('starts with notifications off', async () => {
    await waitForTestId('notifications-toggle')
    expect(await isChecked('notifications-toggle')).toBe(false)
  })

  it('schedules a week of reminders when turned on', async () => {
    await tap('notifications-toggle')
    await waitForTestId('scheduled-count')
    await browser.waitUntil(async () => (await scheduledCount()) > 0, { timeoutMsg: 'no reminders were scheduled' })
    // 5 prayers × 7 days, less the ones already past today.
    const count = await scheduledCount()
    expect(count).toBeGreaterThanOrEqual(30)
    expect(count).toBeLessThanOrEqual(35)
  })

  it('drops a prayer from the schedule when its switch is turned off', async () => {
    const before = await scheduledCount()
    await tap('notify-fajr')
    expect(await isChecked('notify-fajr')).toBe(false)
    await browser.waitUntil(async () => (await scheduledCount()) < before)
    expect(before - (await scheduledCount())).toBeGreaterThanOrEqual(6)
    await tap('notify-fajr')
  })

  it('delivers a test notification', async () => {
    await tap('notifications-test')
    await driver.pause(7_000)
    await driver.execute('mobile: openNotifications')
    const shade = $('android=new UiSelector().textContains("Prayer reminders are working")')
    await shade.waitForDisplayed({ timeout: 15_000 })
    await driver.back()
  })

  it('switches the calculation method and recalculates the times', async () => {
    await tap('method-4') // Umm Al-Qura
    expect(await isChecked('method-4')).toBe(true) // radio rows report accessibilityState as `checked`
    await openTab('times')
    await waitForTestId('next-prayer', 45_000)
    expect(await textOf('method-line')).toMatch(/Umm Al-Qura/)
    expect(await textOf('method-line')).not.toMatch(/auto/)
  })

  it('switches the Asr school', async () => {
    await openTab('settings')
    await tap('school-hanafi')
    await openTab('times')
    await waitForTestId('next-prayer', 45_000)
    expect(await textOf('method-line')).toMatch(/Asr Hanafi/)
  })

  it('turns notifications back off', async () => {
    await openTab('settings')
    await scrollTo('notifications-toggle')
    await tap('notifications-toggle')
    expect(await isChecked('notifications-toggle')).toBe(false)
  })
})

