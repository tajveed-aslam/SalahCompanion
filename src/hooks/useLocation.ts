import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { loadJson, saveJson } from '../lib/storage'

export interface Place {
  latitude: number
  longitude: number
  /** "Karachi, Pakistan" when it can be resolved (native only), otherwise null. */
  name: string | null
  /** True when the user chose the sample city instead of sharing their location. */
  sample: boolean
}

export type LocationStatus = 'loading' | 'ready' | 'denied' | 'error'

const LAST_PLACE_KEY = 'salah.lastPlace.v1'

/** Used when location access is declined, so the app (and its web demo) can still be tried. */
export const SAMPLE_PLACE: Place = { latitude: 24.8607, longitude: 67.0011, name: 'Karachi, Pakistan (sample)', sample: true }

async function placeName(latitude: number, longitude: number): Promise<string | null> {
  if (Platform.OS === 'web') return null // reverseGeocodeAsync isn't available on web
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude })
    if (!address) return null
    return [address.city ?? address.subregion ?? address.region, address.country].filter(Boolean).join(', ') || null
  } catch {
    return null
  }
}

/**
 * The user's location for prayer times and Qibla. Shows the last known place instantly, then refreshes it.
 * Permission is requested on first use; if declined, the user can retry or use the sample city.
 */
export function useLocation() {
  const [place, setPlace] = useState<Place | null>(null)
  const [status, setStatus] = useState<LocationStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) {
        setStatus('denied')
        return
      }
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
      const { latitude, longitude } = position.coords
      const next: Place = { latitude, longitude, name: await placeName(latitude, longitude), sample: false }
      setPlace(next)
      setStatus('ready')
      void saveJson(LAST_PLACE_KEY, next)
    } catch {
      setError("Couldn't get your location. Make sure location services are on.")
      setStatus('error')
    }
  }, [])

  const chooseSample = useCallback(() => {
    setPlace(SAMPLE_PLACE)
    setStatus('ready')
    setError(null)
    void saveJson(LAST_PLACE_KEY, SAMPLE_PLACE)
  }, [])

  useEffect(() => {
    let active = true
    loadJson<Place | null>(LAST_PLACE_KEY, null).then((saved) => {
      if (!active) return
      if (saved) {
        setPlace(saved)
        setStatus('ready')
      }
      // A saved sample stays a sample; otherwise refresh the real position in the background.
      if (!saved?.sample) void locate()
    })
    return () => {
      active = false
    }
  }, [locate])

  return { place, status, error, locate, chooseSample }
}
