import path from 'node:path'
import { APP_ID } from './helpers.ts'

/**
 * Appium + WebdriverIO config for the SalahCompanion Android app (UiAutomator2).
 *
 * Point it at a build with APP_PATH (an .apk from `eas build -p android --profile preview` or `npx expo run:android`),
 * or leave APP_PATH unset to drive an already-installed copy. UDID picks a device when several are connected
 * (`adb devices`). Appium itself is started by @wdio/appium-service from this folder's node_modules.
 */
const appPath = process.env.APP_PATH ? path.resolve(process.env.APP_PATH) : undefined

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: ['./specs/**/*.e2e.ts'],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.DEVICE_NAME ?? 'Android device',
      ...(process.env.UDID && { 'appium:udid': process.env.UDID }),
      ...(appPath
        ? { 'appium:app': appPath }
        : { 'appium:appPackage': APP_ID, 'appium:appActivity': '.MainActivity' }),
      // Location and notification permissions are granted per spec in resetApp(), so the denied path can be tested.
      'appium:autoGrantPermissions': false,
      'appium:noReset': true,
      'appium:newCommandTimeout': 240,
    },
  ],
  logLevel: 'warn',
  waitforTimeout: 20_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 1,
  services: [['appium', { logPath: './logs' }]],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 180_000 },
}
