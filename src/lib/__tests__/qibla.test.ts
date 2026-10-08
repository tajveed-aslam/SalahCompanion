import { angleDelta, compassPoint, distanceToKaabaKm, headingFromMagnetometer, KAABA, normalizeDegrees, qiblaBearing } from '../qibla'

describe('qiblaBearing', () => {
  // Reference bearings from published Qibla tables (true north), to within half a degree.
  it.each([
    ['London', 51.5074, -0.1278, 119.0],
    ['Karachi', 24.8607, 67.0011, 267.6],
    ['New York', 40.7128, -74.006, 58.5],
    ['Jakarta', -6.2088, 106.8456, 295.1],
    ['Cape Town', -33.9249, 18.4241, 23.2],
  ])('points from %s towards Mecca', (_city, lat, lon, expected) => {
    expect(Math.abs(qiblaBearing(lat, lon) - expected)).toBeLessThan(0.5)
  })

  it('is due south straight north of the Kaaba and due north straight south of it', () => {
    expect(qiblaBearing(40, KAABA.longitude)).toBeCloseTo(180, 5)
    expect(qiblaBearing(0, KAABA.longitude)).toBeCloseTo(0, 5)
  })
})

describe('distanceToKaabaKm', () => {
  it('matches great-circle distances', () => {
    expect(distanceToKaabaKm(51.5074, -0.1278)).toBeGreaterThan(4780)
    expect(distanceToKaabaKm(51.5074, -0.1278)).toBeLessThan(4810)
    expect(distanceToKaabaKm(KAABA.latitude, KAABA.longitude)).toBeCloseTo(0, 5)
  })
})

describe('angle helpers', () => {
  it('normalizes into [0, 360)', () => {
    expect(normalizeDegrees(-10)).toBe(350)
    expect(normalizeDegrees(370)).toBe(10)
    expect(normalizeDegrees(360)).toBe(0)
  })

  it('takes the short way round', () => {
    expect(angleDelta(350, 10)).toBe(20)
    expect(angleDelta(10, 350)).toBe(-20)
    expect(angleDelta(0, 180)).toBe(180)
    expect(angleDelta(90, 90)).toBe(0)
  })

  it('names compass points', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(119)).toBe('SE')
    expect(compassPoint(267.6)).toBe('W')
    expect(compassPoint(350)).toBe('N')
  })

  it('reads a flat phone heading from the magnetometer', () => {
    expect(headingFromMagnetometer(0, 1)).toBeCloseTo(0) // field along +y: top of the phone points north
    expect(headingFromMagnetometer(1, 0)).toBeCloseTo(90)
    expect(headingFromMagnetometer(0, -1)).toBeCloseTo(180)
    expect(headingFromMagnetometer(-1, 0)).toBeCloseTo(270)
  })
})
