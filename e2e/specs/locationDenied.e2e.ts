import { openTab, resetApp, tap, tapDialogButton, textOf, waitForTestId } from '../helpers.ts'

describe('When location access is declined', () => {
  before(async () => {
    await resetApp({ grantLocation: false })
    // Android's runtime permission prompt.
    await tapDialogButton('(?i)(don.t allow|deny)')
  })

  it('explains why location is needed and offers a way forward', async () => {
    await waitForTestId('location-denied', 30_000)
    await waitForTestId('location-retry')
    await waitForTestId('location-sample')
  })

  it('works with the sample city instead', async () => {
    await tap('location-sample')
    await waitForTestId('next-prayer', 45_000)
    expect(await textOf('place-name')).toMatch(/Karachi/)
    expect(await textOf('method-line')).toMatch(/Karachi.*Hanafi/)
  })

  it('uses the sample city for the Qibla too', async () => {
    await openTab('qibla')
    expect(await textOf('qibla-bearing')).toMatch(/^267\.\d° W$/)
  })
})
