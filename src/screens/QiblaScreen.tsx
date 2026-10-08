import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useAppData } from '../AppData'
import { LocationGate } from '../components/LocationGate'
import { Button, Card, Muted, Notice, Screen, Title } from '../components/ui'
import { useHeading } from '../hooks/useHeading'
import { angleDelta, compassPoint, distanceToKaabaKm, qiblaBearing } from '../lib/qibla'
import { space, useTheme } from '../theme'

const DIAL = 280
/** Within this many degrees of the Qibla counts as facing it. */
const ALIGNED_DEG = 5

export function QiblaScreen() {
  return (
    <Screen testID="screen-qibla">
      <Title>Qibla</Title>
      <LocationGate purpose="the Qibla direction">
        <QiblaContent />
      </LocationGate>
    </Screen>
  )
}

function QiblaContent() {
  const t = useTheme()
  const { place } = useAppData()
  const compass = useHeading()
  const wasAligned = useRef(false)

  const bearing = place ? qiblaBearing(place.latitude, place.longitude) : 0
  const live = compass.heading !== null && !compass.unsupported
  const delta = live ? angleDelta(compass.heading!, bearing) : null
  const aligned = delta !== null && Math.abs(delta) <= ALIGNED_DEG

  // A short buzz when the phone comes into line with the Qibla.
  useEffect(() => {
    if (aligned && !wasAligned.current && Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    wasAligned.current = aligned
  }, [aligned])

  if (!place) return null
  // Without a live compass, draw the dial north-up so the arrow still shows the direction relative to north.
  const rotation = live ? -compass.heading! : 0
  const distance = Math.round(distanceToKaabaKm(place.latitude, place.longitude))

  return (
    <>
      {compass.needsPermission && (
        <Card testID="compass-permission">
          <Muted>Your browser needs permission to use the compass.</Muted>
          <Button label="Enable compass" onPress={compass.requestPermission} testID="compass-enable" />
        </Card>
      )}

      <View style={styles.dialWrap}>
        <Ionicons name="caret-down" size={28} color={aligned ? t.good : t.text} style={{ marginBottom: -6 }} />
        <View
          testID="compass-dial"
          style={[
            styles.dial,
            { borderColor: aligned ? t.good : t.border, backgroundColor: t.surface, transform: [{ rotate: `${rotation}deg` }] },
          ]}
        >
          {Array.from({ length: 36 }, (_, i) => i * 10).map((deg) => (
            <View key={deg} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${deg}deg` }] }]} pointerEvents="none">
              <View
                style={{
                  alignSelf: 'center',
                  marginTop: 6,
                  width: deg % 90 === 0 ? 3 : 1.5,
                  height: deg % 30 === 0 ? 14 : 8,
                  backgroundColor: deg === 0 ? t.danger : t.muted,
                  borderRadius: 2,
                }}
              />
            </View>
          ))}
          {(['N', 'E', 'S', 'W'] as const).map((label, i) => (
            <View key={label} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${i * 90}deg` }] }]} pointerEvents="none">
              <Text style={[styles.cardinal, { color: label === 'N' ? t.danger : t.text }]}>{label}</Text>
            </View>
          ))}
          {/* Qibla needle, rotated to the bearing within the (north-aligned) dial. */}
          <View
            testID="qibla-needle"
            style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${bearing}deg` }] }]}
            pointerEvents="none"
          >
            <View style={[styles.kaaba, { borderColor: t.gold }]}>
              <View style={[styles.kaabaBand, { backgroundColor: t.gold }]} />
            </View>
            <View style={[styles.needle, { backgroundColor: aligned ? t.good : t.gold }]} />
          </View>
          <View style={[styles.hub, { backgroundColor: aligned ? t.good : t.gold, borderColor: t.surface }]} />
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 4 }}>
        {live ? (
          aligned ? (
            <Text testID="qibla-status" style={[styles.status, { color: t.good }]}>You are facing the Qibla</Text>
          ) : (
            <Text testID="qibla-status" style={[styles.status, { color: t.text }]}>
              Turn {delta! > 0 ? 'right' : 'left'} {Math.round(Math.abs(delta!))}°
            </Text>
          )
        ) : (
          <Text testID="qibla-status" style={[styles.status, { color: t.text }]}>
            Face {Math.round(bearing)}° {compassPoint(bearing)} from north
          </Text>
        )}
        {live && (
          <Muted testID="heading-value">
            Phone heading {Math.round(compass.heading!)}° {compassPoint(compass.heading!)}
          </Muted>
        )}
      </View>

      {compass.unsupported && (
        <Notice tone="info" testID="compass-unsupported">
          No compass on this device. Open SalahCompanion on a phone for a live compass; the arrow above shows the
          Qibla relative to north.
        </Notice>
      )}
      {live && compass.accuracy !== null && compass.accuracy <= 1 && (
        <Notice tone="warn" testID="calibrate-hint">
          Compass accuracy is low. Move your phone in a figure-8 a few times, away from metal and magnets.
        </Notice>
      )}
      {live && compass.source === 'magnetometer' && (
        <Notice tone="info">Hold your phone flat, screen up, for an accurate reading.</Notice>
      )}

      <Card>
        <Fact label="Qibla direction" value={`${bearing.toFixed(1)}° ${compassPoint(bearing)}`} testID="qibla-bearing" />
        <Fact label="Distance to the Kaaba" value={`${distance.toLocaleString()} km`} testID="qibla-distance" />
        <Fact
          label="North reference"
          value={!live ? 'True north' : compass.trueNorth ? 'True north' : 'Magnetic north'}
          testID="north-reference"
        />
      </Card>
      <Muted style={{ fontSize: 12 }}>
        Great-circle bearing from your location to the Kaaba (21.4225° N, 39.8262° E). Keep the phone flat and away
        from electronics for the best result.
      </Muted>
    </>
  )
}

function Fact({ label, value, testID }: { label: string; value: string; testID: string }) {
  const t = useTheme()
  return (
    <View style={styles.fact}>
      <Text style={{ color: t.muted }}>{label}</Text>
      <Text testID={testID} style={{ color: t.text, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  dialWrap: { alignItems: 'center', paddingVertical: space.sm },
  dial: { width: DIAL, height: DIAL, borderRadius: DIAL / 2, borderWidth: 3 },
  cardinal: { alignSelf: 'center', marginTop: 24, fontSize: 18, fontWeight: '800' },
  kaaba: {
    alignSelf: 'center',
    marginTop: 52,
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#111',
    borderWidth: 1.5,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  kaabaBand: { height: 4, marginTop: 6 },
  needle: { alignSelf: 'center', width: 4, height: DIAL / 2 - 52 - 26 - 6, borderRadius: 2 },
  hub: {
    position: 'absolute',
    left: DIAL / 2 - 3 - 9,
    top: DIAL / 2 - 3 - 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  status: { fontSize: 22, fontWeight: '800' },
  fact: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
})
