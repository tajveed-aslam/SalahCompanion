import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { Platform, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppDataProvider } from './src/AppData'
import { PrayerTimesScreen } from './src/screens/PrayerTimesScreen'
import { QiblaScreen } from './src/screens/QiblaScreen'
import { RamadanScreen } from './src/screens/RamadanScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { SettingsProvider } from './src/settings'
import { useTheme } from './src/theme'

export type TabParamList = {
  Times: undefined
  Qibla: undefined
  Ramadan: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

const ICONS: Record<keyof TabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Times: ['time', 'time-outline'],
  Qibla: ['compass', 'compass-outline'],
  Ramadan: ['moon', 'moon-outline'],
  Settings: ['settings', 'settings-outline'],
}

function Tabs() {
  const t = useTheme()
  const dark = useColorScheme() === 'dark'
  const base = dark ? DarkTheme : DefaultTheme
  const navTheme: NavTheme = {
    ...base,
    colors: { ...base.colors, primary: t.primary, background: t.bg, card: t.surface, text: t.text, border: t.border },
  }

  return (
    <NavigationContainer theme={navTheme} documentTitle={{ formatter: (_, route) => `${route?.name ?? 'Home'} · SalahCompanion` }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: t.primary,
          tabBarInactiveTintColor: t.muted,
          tabBarButtonTestID: `tab-${route.name.toLowerCase()}`,
          // The default 49pt bar clips the labels in mobile browsers.
          ...(Platform.OS === 'web' && { tabBarStyle: { height: 62, paddingTop: 4, paddingBottom: 8 } }),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Times" component={PrayerTimesScreen} options={{ title: 'Prayer times', tabBarLabel: 'Times' }} />
        <Tab.Screen name="Qibla" component={QiblaScreen} />
        <Tab.Screen name="Ramadan" component={RamadanScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppDataProvider>
          <Tabs />
        </AppDataProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  )
}
