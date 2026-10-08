import { useColorScheme } from 'react-native'

const light = {
  bg: '#f3f6f5',
  surface: '#ffffff',
  surface2: '#e7eeec',
  border: '#d9e3e0',
  text: '#10201c',
  muted: '#5a6d68',
  primary: '#0f766e',
  primaryText: '#ffffff',
  primarySoft: '#d4eee8',
  gold: '#a57a22',
  goldSoft: '#f5ead2',
  danger: '#b91c1c',
  dangerSoft: '#fde4e4',
  good: '#15803d',
  goodSoft: '#dcf3e3',
}

export type Theme = typeof light

const dark: Theme = {
  bg: '#0b1412',
  surface: '#13201d',
  surface2: '#1b2c28',
  border: '#26403a',
  text: '#e8f1ef',
  muted: '#93a9a3',
  primary: '#2dd4bf',
  primaryText: '#052b26',
  primarySoft: '#123c36',
  gold: '#e3b955',
  goldSoft: '#3a2f14',
  danger: '#f87171',
  dangerSoft: '#3b1717',
  good: '#4ade80',
  goodSoft: '#12301d',
}

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light
}

export const radius = { sm: 8, md: 14, lg: 20 }
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
