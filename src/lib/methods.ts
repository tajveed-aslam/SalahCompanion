/** AlAdhan calculation method ids (https://aladhan.com/calculation-methods). */
export const METHODS: { id: number; name: string; region: string }[] = [
  { id: 1, name: 'University of Islamic Sciences, Karachi', region: 'Pakistan, India, Bangladesh, Afghanistan' },
  { id: 2, name: 'Islamic Society of North America (ISNA)', region: 'North America' },
  { id: 3, name: 'Muslim World League', region: 'Europe, Far East, parts of America' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', region: 'Arabian Peninsula' },
  { id: 5, name: 'Egyptian General Authority of Survey', region: 'Africa, Syria, Lebanon, Malaysia' },
  { id: 8, name: 'Gulf Region', region: 'UAE, Oman, Bahrain' },
  { id: 9, name: 'Kuwait', region: 'Kuwait' },
  { id: 10, name: 'Qatar', region: 'Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapura', region: 'Singapore' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı', region: 'Turkey' },
  { id: 15, name: 'Moonsighting Committee Worldwide', region: 'Worldwide' },
]

export type AsrSchool = 'standard' | 'hanafi'

export interface AutoChoice {
  method: number
  school: AsrSchool
}

type Box = { method: number; school: AsrSchool; minLat: number; maxLat: number; minLon: number; maxLon: number }

// Coarse regional boxes, checked in order (smaller, more specific regions first). Good enough to pick a sensible
// default; users can always override it in Settings.
const REGIONS: Box[] = [
  { method: 10, school: 'standard', minLat: 24.4, maxLat: 26.3, minLon: 50.7, maxLon: 51.7 }, // Qatar
  { method: 9, school: 'standard', minLat: 28.5, maxLat: 30.1, minLon: 46.5, maxLon: 48.5 }, // Kuwait
  { method: 8, school: 'standard', minLat: 22.5, maxLat: 26.1, minLon: 51.5, maxLon: 56.4 }, // UAE
  { method: 11, school: 'standard', minLat: 1.15, maxLat: 1.48, minLon: 103.6, maxLon: 104.1 }, // Singapore
  { method: 4, school: 'standard', minLat: 16, maxLat: 32.2, minLon: 34.5, maxLon: 55.7 }, // Saudi Arabia
  { method: 13, school: 'hanafi', minLat: 35.8, maxLat: 42.2, minLon: 25.6, maxLon: 44.9 }, // Turkey
  { method: 5, school: 'standard', minLat: 22, maxLat: 31.7, minLon: 24.7, maxLon: 36.9 }, // Egypt
  { method: 1, school: 'hanafi', minLat: 5.5, maxLat: 38.5, minLon: 60.5, maxLon: 97.5 }, // South Asia
  { method: 2, school: 'standard', minLat: 14, maxLat: 72, minLon: -170, maxLon: -50 }, // North America
]

/** A sensible calculation method and Asr school for a location, before the user has chosen their own. */
export function autoMethod(latitude: number, longitude: number): AutoChoice {
  const box = REGIONS.find((r) => latitude >= r.minLat && latitude <= r.maxLat && longitude >= r.minLon && longitude <= r.maxLon)
  return box ? { method: box.method, school: box.school } : { method: 3, school: 'standard' }
}

export function methodName(id: number): string {
  return METHODS.find((m) => m.id === id)?.name ?? `Method ${id}`
}
