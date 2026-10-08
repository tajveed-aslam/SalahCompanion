/**
 * Shared Appium helpers. Every interactive element in the app has a React Native `testID`, which Android exposes as
 * the view's resource-id, so specs find elements by testID rather than by text or position.
 */

export const APP_ID = 'com.tajveedaslam.salahcompanion'

export const LONDON = { latitude: 51.5074, longitude: -0.1278 }
export const KARACHI = { latitude: 24.8607, longitude: 67.0011 }

const LOCATION_PERMISSIONS = ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION']
const NOTIFICATION_PERMISSION = 'android.permission.POST_NOTIFICATIONS'

export function byTestId(testID: string) {
  return $(`android=new UiSelector().resourceId("${testID}")`)
}

/** Scrolls the current screen until the element is on screen, then returns it. */
export async function scrollTo(testID: string) {
  const el = byTestId(testID)
  if (!(await el.isDisplayed())) {
    await $(
      `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(10).scrollIntoView(new UiSelector().resourceId("${testID}"))`,
    )
  }
  await el.waitForDisplayed()
  return el
}

export async function tap(testID: string) {
  const el = await scrollTo(testID)
  await el.click()
}

/** Visible text of an element; for a container, the text of every Text inside it joined by spaces. */
export async function textOf(testID: string): Promise<string> {
  const el = await scrollTo(testID)
  const own = await el.getText()
  if (own) return own.trim()
  const parts = await el.$$('android.widget.TextView').map((t) => t.getText())
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export async function waitForTestId(testID: string, timeout = 30_000) {
  const el = byTestId(testID)
  await el.waitForDisplayed({ timeout })
  return el
}

export async function openTab(name: 'times' | 'qibla' | 'ramadan' | 'settings') {
  const tab = byTestId(`tab-${name}`)
  await tab.waitForDisplayed()
  await tab.click()
}

/** Mock the device position (emulator, or a phone with Appium Settings set as the mock location app). */
export async function setLocation({ latitude, longitude }: { latitude: number; longitude: number }) {
  await driver.execute('mobile: setGeolocation', { latitude, longitude, altitude: 20 })
}

/**
 * Starts the app from a clean slate: stops it, wipes its storage (settings, cached times, fasting record) and
 * runtime permissions, re-grants the requested permissions, then launches it.
 */
export async function resetApp({ grantLocation = true, grantNotifications = true } = {}) {
  await driver.execute('mobile: terminateApp', { appId: APP_ID })
  await driver.execute('mobile: clearApp', { appId: APP_ID })
  const grant = [...(grantLocation ? LOCATION_PERMISSIONS : []), ...(grantNotifications ? [NOTIFICATION_PERMISSION] : [])]
  if (grant.length > 0) {
    await driver.execute('mobile: changePermissions', { permissions: grant, appPackage: APP_ID, action: 'grant' })
  }
  await driver.execute('mobile: activateApp', { appId: APP_ID })
}

/** Restarts the app without clearing anything, to check what was persisted. */
export async function relaunchApp() {
  await driver.execute('mobile: terminateApp', { appId: APP_ID })
  await driver.execute('mobile: activateApp', { appId: APP_ID })
}

/**
 * Taps a button in a native Android dialog (Alert.alert or a system permission prompt) by its label.
 * `pattern` is a Java regex, as UiSelector.textMatches expects, e.g. "(?i)ok".
 */
export async function tapDialogButton(pattern: string) {
  const button = $(`android=new UiSelector().className("android.widget.Button").textMatches("${pattern}")`)
  await button.waitForDisplayed()
  await button.click()
}

export async function isChecked(testID: string): Promise<boolean> {
  return (await byTestId(testID).getAttribute('checked')) === 'true'
}
