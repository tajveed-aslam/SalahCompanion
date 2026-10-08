import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AsrSchool } from './lib/methods'
import { PRAYERS, type PrayerName } from './lib/prayerTimes'
import { KEYS, loadJson, saveJson } from './lib/storage'

export interface Settings {
  /** 'auto' picks a regional default from the location (see lib/methods.ts). */
  method: 'auto' | number
  school: 'auto' | AsrSchool
  notificationsEnabled: boolean
  notify: Record<PrayerName, boolean>
}

export const DEFAULT_SETTINGS: Settings = {
  method: 'auto',
  school: 'auto',
  notificationsEnabled: false,
  notify: Object.fromEntries(PRAYERS.map((p) => [p, true])) as Record<PrayerName, boolean>,
}

interface SettingsValue {
  settings: Settings
  loaded: boolean
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadJson<Partial<Settings>>(KEYS.settings, {}).then((saved) => {
      setSettings({ ...DEFAULT_SETTINGS, ...saved, notify: { ...DEFAULT_SETTINGS.notify, ...saved.notify } })
      setLoaded(true)
    })
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      void saveJson(KEYS.settings, next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside <SettingsProvider>')
  return value
}
