import { KARACHI, LONDON, openTab, resetApp, setLocation, textOf, waitForTestId } from '../helpers.ts'

describe('Qibla compass', () => {
  it('gives the great-circle direction and distance from London', async () => {
    await setLocation(LONDON)
    await resetApp()
    await waitForTestId('next-prayer', 45_000)
    await openTab('qibla')
    expect(await textOf('qibla-bearing')).toMatch(/^119\.\d° SE$/)
    const km = Number((await textOf('qibla-distance')).replace(/[^\d]/g, ''))
    expect(km).toBeGreaterThan(4780)
    expect(km).toBeLessThan(4810)
  })

  it('draws the dial and reads the device compass', async () => {
    await waitForTestId('compass-dial')
    await waitForTestId('qibla-needle')
    // On a real phone or an emulator with virtual sensors the heading streams in; it then tells the user which way
    // to turn (or that they're facing the Qibla). Without a sensor it falls back to the bearing from north.
    const status = await textOf('qibla-status')
    expect(status).toMatch(/Turn (left|right) \d+°|facing the Qibla|Face \d+° \w+ from north/)
  })

  it('updates when the location changes', async () => {
    await setLocation(KARACHI)
    await resetApp()
    await waitForTestId('next-prayer', 45_000)
    await openTab('qibla')
    expect(await textOf('qibla-bearing')).toMatch(/^267\.\d° W$/)
  })
})
