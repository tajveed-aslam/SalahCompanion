import AsyncStorage from '@react-native-async-storage/async-storage'

/** JSON helpers over AsyncStorage. Corrupt or missing values read as the fallback rather than crashing. */
export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable (e.g. private browsing): the app keeps working, it just won't persist.
  }
}

export const KEYS = {
  settings: 'salah.settings.v1',
  lastTimes: 'salah.lastTimes.v1',
  ramadan: (hijriYear: number) => `salah.ramadan.${hijriYear}`,
}
