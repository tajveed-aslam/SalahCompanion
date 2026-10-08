# SalahCompanion — Appium E2E tests

End-to-end tests for the Android app, written in TypeScript with **WebdriverIO 10 + Appium 3 (UiAutomator2)**.
Every interactive element in the app has a React Native `testID`, which Android exposes as the view's
`resource-id`, so tests select elements by ID and not by text or screen position.

| Spec | Covers |
|---|---|
| `prayerTimes.e2e.ts` | Next prayer + countdown, GPS place name, all six times, Hijri date, today/tomorrow, auto method |
| `qibla.e2e.ts` | Bearing and distance for London and Karachi, dial + needle, live compass status |
| `ramadan.e2e.ts` | Marking fasted/missed, streaks, clearing a day, persistence across restarts, locked upcoming Ramadan, reset dialog |
| `settings.e2e.ts` | Notification toggle → reminders scheduled, per-prayer switches, a real test notification in the shade, method and Asr school changes |
| `locationDenied.e2e.ts` | Declining the permission prompt → explanation → sample city works for times and Qibla |

## One-time setup (Windows)

1. **JDK 17**: `winget install EclipseAdoptium.Temurin.17.JDK`, then set `JAVA_HOME`.
2. **Android SDK platform-tools** (adb): install Android Studio, or only the
   [command-line tools](https://developer.android.com/studio#command-tools). Set `ANDROID_HOME`
   (e.g. `%LOCALAPPDATA%\Android\Sdk`) and add `%ANDROID_HOME%\platform-tools` to `PATH`.
3. **A device**, either of these:
   - An Android phone with *Developer options → USB debugging* on, connected by USB (`adb devices` lists it).
     For the location specs, install [Appium Settings](https://github.com/appium/io.appium.settings) (Appium
     installs it automatically) and pick it under *Developer options → Select mock location app*.
   - An Android emulator (needs CPU virtualisation enabled in the BIOS).
4. In this folder: `npm install`, then `npm run appium:driver` (installs the UiAutomator2 driver) and
   `npm run appium:doctor` to check the setup.

## Build the app under test

Either build an APK in the cloud (needs a free Expo account):

```bash
cd ..            # app root
npx eas-cli build -p android --profile preview   # downloads an .apk when finished
```

or build locally with the Android SDK: `npx expo run:android --variant release`.

## Run

```bash
# PowerShell
$env:APP_PATH = "C:\path\to\salahcompanion.apk"   # omit to use the copy already installed on the device
$env:UDID = "emulator-5554"                       # only needed when several devices are connected
npm test                                          # all specs
npm run test:spec -- ./specs/qibla.e2e.ts         # one spec
```

Appium is started automatically (logs in `./logs`). Each spec resets the app's storage and permissions first, so
specs are independent and can run in any order.
