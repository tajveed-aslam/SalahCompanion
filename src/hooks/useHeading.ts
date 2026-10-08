import * as Location from 'expo-location'
import { Magnetometer } from 'expo-sensors'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { headingFromMagnetometer, normalizeDegrees } from '../lib/qibla'

export type HeadingSource = 'os' | 'magnetometer' | 'browser'

export interface HeadingState {
  /** Degrees clockwise from north (true north where available), smoothed. Null until the first reading. */
  heading: number | null
  source: HeadingSource | null
  /** True north (corrected for magnetic declination) rather than magnetic north. */
  trueNorth: boolean
  /** 0–3 where reported; ≤1 means the compass should be calibrated (figure-8 motion). */
  accuracy: number | null
  /** No compass on this device/browser (e.g. a desktop browser). */
  unsupported: boolean
  /** iOS Safari: compass access needs a tap to grant. */
  needsPermission: boolean
  requestPermission: () => void
}

/**
 * Low-pass filter on the unit circle, so 359° → 1° moves 2°, not 358° the long way round.
 * `alpha` is how much of each new reading to take.
 */
function smoothAngle(previous: number | null, next: number, alpha = 0.25): number {
  if (previous === null) return next
  const p = (previous * Math.PI) / 180
  const n = (next * Math.PI) / 180
  const x = (1 - alpha) * Math.cos(p) + alpha * Math.cos(n)
  const y = (1 - alpha) * Math.sin(p) + alpha * Math.sin(n)
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI)
}

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

/**
 * Device compass heading. Native: the OS heading API (magnetometer fused with the accelerometer, tilt-compensated,
 * true north), falling back to the raw magnetometer. Web: the browser's absolute device-orientation events, which
 * work on phones (Android Chrome, iOS Safari) but not desktops.
 */
export function useHeading(): HeadingState {
  const [heading, setHeading] = useState<number | null>(null)
  const [source, setSource] = useState<HeadingSource | null>(null)
  const [trueNorth, setTrueNorth] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  // Browsers without the orientation API at all (rare) are known to be unsupported up front.
  const [unsupported, setUnsupported] = useState(
    Platform.OS === 'web' && (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)),
  )
  const [needsPermission, setNeedsPermission] = useState(
    Platform.OS === 'web' && typeof (globalThis as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent?.requestPermission === 'function',
  )
  const [permissionTick, setPermissionTick] = useState(0)
  const smoothed = useRef<number | null>(null)

  const push = useCallback((value: number) => {
    smoothed.current = smoothAngle(smoothed.current, normalizeDegrees(value))
    setHeading(smoothed.current)
  }, [])

  // ----- Native -----
  useEffect(() => {
    if (Platform.OS === 'web') return
    let cancelled = false
    let remove: (() => void) | null = null

    ;(async () => {
      try {
        const sub = await Location.watchHeadingAsync((h) => {
          const hasTrue = h.trueHeading >= 0
          setTrueNorth(hasTrue)
          setAccuracy(h.accuracy)
          push(hasTrue ? h.trueHeading : h.magHeading)
        })
        if (cancelled) sub.remove()
        else {
          remove = () => sub.remove()
          setSource('os')
        }
      } catch {
        // OS heading unavailable: read the magnetometer directly (magnetic north, phone held flat).
        if (cancelled || !(await Magnetometer.isAvailableAsync())) {
          if (!cancelled) setUnsupported(true)
          return
        }
        Magnetometer.setUpdateInterval(100)
        const sub = Magnetometer.addListener(({ x, y }) => push(headingFromMagnetometer(x, y)))
        remove = () => sub.remove()
        setSource('magnetometer')
      }
    })()

    return () => {
      cancelled = true
      remove?.()
    }
  }, [push])

  // ----- Web -----
  useEffect(() => {
    if (Platform.OS !== 'web' || needsPermission) return
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return

    let gotReading = false
    const onAbsolute = (e: DeviceOrientationEvent) => {
      if (e.alpha === null) return
      gotReading = true
      setSource('browser')
      setTrueNorth(false)
      push(360 - e.alpha) // alpha is counter-clockwise from north
    }
    const onIOS = (e: Event) => {
      const heading = (e as IOSOrientationEvent).webkitCompassHeading
      if (heading === undefined || heading === null) return
      gotReading = true
      setSource('browser')
      setTrueNorth(false)
      push(heading)
    }

    window.addEventListener('deviceorientationabsolute', onAbsolute as EventListener)
    window.addEventListener('deviceorientation', onIOS)
    // Desktops expose the API but never fire it with compass data.
    const timer = setTimeout(() => !gotReading && setUnsupported(true), 2500)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('deviceorientationabsolute', onAbsolute as EventListener)
      window.removeEventListener('deviceorientation', onIOS)
    }
  }, [needsPermission, permissionTick, push])

  const requestPermission = useCallback(() => {
    const ctor = (globalThis as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent
    if (!ctor?.requestPermission) return
    ctor
      .requestPermission()
      .then((result) => {
        if (result === 'granted') {
          setNeedsPermission(false)
          setPermissionTick((t) => t + 1)
        } else setUnsupported(true)
      })
      .catch(() => setUnsupported(true))
  }, [])

  return { heading, source, trueNorth, accuracy, unsupported, needsPermission, requestPermission }
}
