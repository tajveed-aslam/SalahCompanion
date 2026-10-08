import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useAppData } from '../AppData'
import { space } from '../theme'
import { Button, Card, Loading, Muted, Notice } from './ui'

/** Renders children once a location is known; otherwise explains why and offers to retry or use a sample city. */
export function LocationGate({ children, purpose }: { children: ReactNode; purpose: string }) {
  const { place, locationStatus, locationError, locate, chooseSample } = useAppData()
  if (place) return <>{children}</>

  if (locationStatus === 'loading') return <Loading label="Finding your location…" />

  return (
    <Card testID="location-gate">
      {locationStatus === 'denied' ? (
        <Notice tone="warn" testID="location-denied">
          Location access was declined. SalahCompanion needs your location for {purpose}.
        </Notice>
      ) : (
        <Notice tone="error" testID="location-error">{locationError ?? "Couldn't get your location."}</Notice>
      )}
      <Muted>Your location stays on this device and is only used to calculate times and direction.</Muted>
      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <Button label="Try again" onPress={() => void locate()} testID="location-retry" />
        <Button label="Use a sample city (Karachi)" variant="ghost" onPress={chooseSample} testID="location-sample" />
      </View>
    </Card>
  )
}
