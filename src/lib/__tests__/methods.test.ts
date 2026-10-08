import { autoMethod, METHODS, methodName } from '../methods'

describe('autoMethod', () => {
  it.each([
    ['Karachi', 24.8607, 67.0011, 1, 'hanafi'],
    ['Lahore', 31.5204, 74.3587, 1, 'hanafi'],
    ['Makkah', 21.4225, 39.8262, 4, 'standard'],
    ['Doha', 25.2854, 51.531, 10, 'standard'],
    ['Dubai', 25.2048, 55.2708, 8, 'standard'],
    ['Kuwait City', 29.3759, 47.9774, 9, 'standard'],
    ['Istanbul', 41.0082, 28.9784, 13, 'hanafi'],
    ['Cairo', 30.0444, 31.2357, 5, 'standard'],
    ['Singapore', 1.3521, 103.8198, 11, 'standard'],
    ['Toronto', 43.6532, -79.3832, 2, 'standard'],
    ['London', 51.5074, -0.1278, 3, 'standard'],
  ])('picks a regional default for %s', (_city, lat, lon, method, school) => {
    expect(autoMethod(lat as number, lon as number)).toEqual({ method, school })
  })

  it('only picks methods it can name', () => {
    for (const [lat, lon] of [[24.86, 67], [21.4, 39.8], [51.5, 0], [43.6, -79.4]]) {
      expect(METHODS.some((m) => m.id === autoMethod(lat, lon).method)).toBe(true)
    }
    expect(methodName(3)).toBe('Muslim World League')
  })
})
