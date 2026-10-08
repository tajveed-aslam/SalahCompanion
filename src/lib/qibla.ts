/** The Kaaba in Masjid al-Haram, Mecca. */
export const KAABA = { latitude: 21.422487, longitude: 39.826206 } as const

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Wraps any angle into [0, 360). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/**
 * Initial great-circle bearing from a point to the Kaaba, in degrees clockwise from true north.
 * This is the Qibla direction: the shortest path on the globe, not a straight line on a flat map.
 */
export function qiblaBearing(latitude: number, longitude: number): number {
  const φ1 = toRad(latitude)
  const φ2 = toRad(KAABA.latitude)
  const Δλ = toRad(KAABA.longitude - longitude)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return normalizeDegrees(toDeg(Math.atan2(y, x)))
}

/** Great-circle (haversine) distance to the Kaaba in kilometres. */
export function distanceToKaabaKm(latitude: number, longitude: number): number {
  const R = 6371.0088
  const dφ = toRad(KAABA.latitude - latitude)
  const dλ = toRad(KAABA.longitude - longitude)
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Signed smallest rotation from `from` to `to`, in (-180, 180]. Positive = turn clockwise (right). */
export function angleDelta(from: number, to: number): number {
  const d = normalizeDegrees(to - from)
  return d > 180 ? d - 360 : d
}

/** Compass point name for a bearing, e.g. 263° → "W". */
export function compassPoint(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round(normalizeDegrees(deg) / 45) % 8]
}

/**
 * Heading (degrees clockwise from magnetic north) from raw magnetometer x/y, for a phone lying flat with the screen
 * up. Used only as a fallback when the OS heading API (which also corrects for tilt and declination) is unavailable.
 */
export function headingFromMagnetometer(x: number, y: number): number {
  return normalizeDegrees(90 - toDeg(Math.atan2(y, x)))
}
