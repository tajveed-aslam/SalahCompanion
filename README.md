# SalahCompanion

A React Native (Expo, TypeScript) prayer companion: accurate prayer times for where you are, a Qibla compass,
a Ramadan fasting tracker and prayer-time notifications. Runs on Android, iOS and the web.

| | |
|---|---|
| **Prayer times** | GPS location → [AlAdhan API](https://aladhan.com/prayer-times-api). Next prayer with a live countdown, today/tomorrow, Gregorian + Hijri date, times shown in the location's own time zone. Calculation method and Asr school chosen automatically by region (Karachi/Hanafi in South Asia, Umm Al-Qura in Saudi Arabia, ISNA in North America, MWL elsewhere …) or set by hand. Works offline from the last successful fetch. |
| **Qibla compass** | Great-circle bearing and distance to the Kaaba. A dial driven by the OS heading API (magnetometer fused with the accelerometer, true north), falling back to the raw magnetometer; low-pass filtered on the circle, haptic tick when you face the Qibla, calibration hint when accuracy is low. In mobile browsers it uses DeviceOrientation; on desktop it shows the bearing from north. |
| **Ramadan tracker** | The real Ramadan dates from the Hijri calendar (29 or 30 days). Tap a day: fasted → missed → clear. Current and best streak, fasts to make up, upcoming days locked. Stored per Hijri year in AsyncStorage. |
| **Notifications** | A local notification at each enabled prayer for the next 7 days, re-queued every time the app opens or settings change. Per-prayer switches and a test notification. Android channel at high importance. |

If location is declined, the app explains why and offers a sample city (Karachi), so it can always be tried.

## Stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · React Navigation 7 (bottom tabs) · expo-location ·
expo-sensors (Magnetometer) · expo-notifications · expo-haptics · AsyncStorage · react-native-web.
Tests: **Jest** (jest-expo) for the logic, **Appium** (WebdriverIO + UiAutomator2) for end-to-end on Android.

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go (Android/iOS), or press w for the web
```

- **Phone (recommended)**: install **Expo Go** from the Play Store / App Store, run `npx expo start`, scan the QR
  code. Location, compass and notifications all work in Expo Go.
- **Web**: `npx expo start --web`. The compass needs a phone browser; notifications need the mobile app.
- **Android APK**: `npx eas-cli build -p android --profile preview` (free Expo account) and install the .apk.

## Test

```bash
npm test                # 41 Jest unit tests: Qibla maths, prayer parsing/next prayer, streaks, regional methods
npm run typecheck
npm run lint
```

End-to-end tests with Appium live in [`e2e/`](e2e/README.md) (setup: JDK, Android platform-tools, a phone or
emulator).

## Deploy the web demo (Vercel)

Import the repo in Vercel. `vercel.json` sets the build (`npx expo export --platform web`), output (`dist`) and
SPA rewrites. No environment variables are needed; the app calls the public AlAdhan API directly.

## Project layout

```
App.tsx                  providers + bottom-tab navigator
src/
  screens/               PrayerTimes, Qibla, Ramadan, Settings
  components/            ui.tsx (Screen, Card, Button, Notice …), LocationGate
  hooks/                 useLocation, usePrayerTimes, useHeading, useRamadan, useNow
  lib/                   pure logic: qibla, prayerTimes, methods, ramadan, aladhan (API), notifications, storage
  AppData.tsx            one location + prayer-time fetch shared by every screen; keeps reminders scheduled
  settings.tsx           persisted settings context
  theme.ts               light/dark palettes
e2e/                     Appium suite (separate package)
```

Your location, settings and fasting record stay on the device.
