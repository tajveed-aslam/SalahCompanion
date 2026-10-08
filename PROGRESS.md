# Progress — SalahCompanion
_Last updated: 2026-10-08 by Claude Code_

## Goal
React Native (Expo, TypeScript) app: prayer times for the GPS location (AlAdhan API), Qibla compass from the
magnetometer, Ramadan fasting tracker with streaks (AsyncStorage), prayer-time notifications. Web build on Vercel as
the portfolio live demo; Expo Go QR / EAS APK for phones.

## Done
- Expo SDK 57 TS project, React Navigation bottom tabs (Times, Qibla, Ramadan, Settings), light/dark theme.
- Permissions: location (expo-location, with denied → retry / sample-city flow), compass (OS heading → magnetometer
  fallback; iOS Safari DeviceOrientation permission), notifications (Android channel + runtime permission).
- All four screens implemented with `testID`s on every interactive element.
- Logic in `src/lib/` with 41 Jest tests (`npm test`); typecheck, `expo lint`, `expo-doctor` all clean.
- Appium suite (WebdriverIO 10 + Appium 3 UiAutomator2) in `e2e/`, 5 specs, typechecks. **Not yet run**: this PC has
  no JDK / Android SDK / adb and CPU virtualisation is off (no emulator).
- Web export verified in Edge with Playwright (granted/denied location, London/Karachi/Jeddah, dark mode).
- `vercel.json` (expo export → dist) and `eas.json` (preview profile builds an APK).

## In progress
- Nothing mid-edit.

## Next steps
1. Owner deploys the web build on Vercel (import repo; no env vars), then add the live URL to README + portfolio.
2. With the owner's free Expo account: `npx eas-cli build -p android --profile preview` → APK link + QR on the portfolio.
3. Run the Appium suite on a USB-connected Android phone (install JDK 17 + platform-tools, see `e2e/README.md`).
4. Portfolio entry (phone-frame screenshots) — added in `tajveed-portfolio/lib/projects.ts`; swap in the live URL.

## Decisions & gotchas
- React Navigation (owner's spec), **not** Expo Router — the template AGENTS.md was edited to say so.
- Install packages with `npx expo install`, so versions match SDK 57.
- TypeScript 6 doesn't auto-include `@types/*`: root tsconfig lists `"types": ["jest"]` and excludes `e2e/`.
- React Compiler lint forbids setState directly in effect bodies: hooks derive loading/error from a request id instead.
- Times are formatted in the **location's** time zone (`meta.timezone` from AlAdhan), not the device's.
- Web can't reverse-geocode, so the place is labelled "Near <time-zone city>".
- Desktop browsers (no touch points) are treated as having no compass up front; notifications are hidden on web.
- Ramadan streak: trailing unmarked days don't break it; a missed day or an unmarked gap does.
- e2e is a separate npm package (its own package.json/tsconfig) so Appium stays out of the app's dependencies.
  UiAutomator2 selectors use `resourceId("<testID>")`.
