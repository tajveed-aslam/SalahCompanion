import { Ionicons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useAppData } from '../AppData'
import { Button, Card, Muted, Notice, Screen, Title } from '../components/ui'
import { autoMethod, METHODS, methodName, type AsrSchool } from '../lib/methods'
import { ensureNotificationPermission, notificationsSupported, sendTestNotification } from '../lib/notifications'
import { PRAYERS } from '../lib/prayerTimes'
import { useSettings } from '../settings'
import { space, useTheme } from '../theme'

export function SettingsScreen() {
  return (
    <Screen testID="screen-settings">
      <Title>Settings</Title>
      <NotificationSettings />
      <CalculationSettings />
      <LocationSettings />
      <Muted style={{ fontSize: 12 }}>
        Prayer times and the Hijri calendar come from the free AlAdhan API (aladhan.com). Your location, settings and
        fasting record are stored only on this device.
      </Muted>
    </Screen>
  )
}

function NotificationSettings() {
  const t = useTheme()
  const { settings, update } = useSettings()
  const { scheduledCount } = useAppData()
  const [denied, setDenied] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const toggle = async (on: boolean) => {
    if (!on) {
      update({ notificationsEnabled: false })
      return
    }
    const granted = await ensureNotificationPermission()
    setDenied(!granted)
    if (granted) update({ notificationsEnabled: true })
  }

  const sendTest = async () => {
    await sendTestNotification()
    setTestSent(true)
  }

  return (
    <Card testID="settings-notifications">
      <SectionTitle icon="notifications-outline">Prayer notifications</SectionTitle>
      {!notificationsSupported ? (
        <Notice testID="notifications-web">
          Notifications need the mobile app. Open SalahCompanion in Expo Go or install the Android build to get an alert
          at each prayer time.
        </Notice>
      ) : (
        <>
          <Row label="Notify me at prayer times">
            <Switch
              testID="notifications-toggle"
              accessibilityLabel="Notify me at prayer times"
              value={settings.notificationsEnabled}
              onValueChange={(on) => void toggle(on)}
              trackColor={{ true: t.primary, false: t.border }}
            />
          </Row>
          {denied && (
            <View style={{ gap: space.sm }}>
              <Notice tone="warn" testID="notifications-denied">
                Notifications are blocked for SalahCompanion. Allow them in your phone&apos;s settings.
              </Notice>
              <Button label="Open settings" variant="ghost" onPress={() => void Linking.openSettings()} testID="open-system-settings" />
            </View>
          )}
          {settings.notificationsEnabled && (
            <>
              {PRAYERS.map((p) => (
                <Row key={p} label={p} indent>
                  <Switch
                    testID={`notify-${p.toLowerCase()}`}
                    accessibilityLabel={`Notify for ${p}`}
                    value={settings.notify[p]}
                    onValueChange={(on) => update({ notify: { ...settings.notify, [p]: on } })}
                    trackColor={{ true: t.primary, false: t.border }}
                  />
                </Row>
              ))}
              <Muted testID="scheduled-count">
                {scheduledCount} reminder{scheduledCount === 1 ? '' : 's'} scheduled for the coming week. They refresh
                each time you open the app.
              </Muted>
              <Button label={testSent ? 'Test sent, arriving in 5 s' : 'Send a test notification'} variant="ghost" onPress={() => void sendTest()} testID="notifications-test" />
            </>
          )}
        </>
      )}
    </Card>
  )
}

function CalculationSettings() {
  const { settings, update } = useSettings()
  const { place } = useAppData()
  const auto = place ? autoMethod(place.latitude, place.longitude) : null

  return (
    <Card testID="settings-calculation">
      <SectionTitle icon="calculator-outline">Calculation method</SectionTitle>
      <Option
        label="Automatic"
        detail={auto ? `${methodName(auto.method)}, based on your location` : 'Chosen from your location'}
        selected={settings.method === 'auto'}
        onPress={() => update({ method: 'auto' })}
        testID="method-auto"
      />
      {METHODS.map((m) => (
        <Option
          key={m.id}
          label={m.name}
          detail={m.region}
          selected={settings.method === m.id}
          onPress={() => update({ method: m.id })}
          testID={`method-${m.id}`}
        />
      ))}

      <View style={{ height: space.md }} />
      <SectionTitle icon="sunny-outline">Asr time</SectionTitle>
      <Option
        label="Automatic"
        detail={auto ? `${auto.school === 'hanafi' ? 'Hanafi' : 'Standard'}, based on your location` : 'Chosen from your location'}
        selected={settings.school === 'auto'}
        onPress={() => update({ school: 'auto' })}
        testID="school-auto"
      />
      {(
        [
          ['standard', 'Standard', "Shafi'i, Maliki, Hanbali: shadow equals the object's length"],
          ['hanafi', 'Hanafi', "Shadow twice the object's length (later Asr)"],
        ] as [AsrSchool, string, string][]
      ).map(([id, label, detail]) => (
        <Option key={id} label={label} detail={detail} selected={settings.school === id} onPress={() => update({ school: id })} testID={`school-${id}`} />
      ))}
    </Card>
  )
}

function LocationSettings() {
  const { place, locate, chooseSample, locationStatus } = useAppData()
  return (
    <Card testID="settings-location">
      <SectionTitle icon="location-outline">Location</SectionTitle>
      <Muted testID="settings-place">
        {place
          ? `${place.name ?? 'Current location'} (${place.latitude.toFixed(3)}°, ${place.longitude.toFixed(3)}°)`
          : 'Not set'}
      </Muted>
      {locationStatus === 'denied' && <Notice tone="warn">Location access is off. Allow it in your device settings, then tap Update.</Notice>}
      <Button label={locationStatus === 'loading' ? 'Locating…' : 'Update my location'} disabled={locationStatus === 'loading'} onPress={() => void locate()} testID="settings-locate" />
      {!place?.sample && <Button label="Use the sample city (Karachi)" variant="ghost" onPress={chooseSample} testID="settings-sample" />}
    </Card>
  )
}

function SectionTitle({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: string }) {
  const t = useTheme()
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={18} color={t.primary} />
      <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }} accessibilityRole="header">{children}</Text>
    </View>
  )
}

function Row({ label, indent, children }: { label: string; indent?: boolean; children: ReactNode }) {
  const t = useTheme()
  return (
    <View style={[styles.row, indent && { paddingLeft: space.md }]}>
      <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{label}</Text>
      {children}
    </View>
  )
}

function Option({ label, detail, selected, onPress, testID }: { label: string; detail: string; selected: boolean; onPress: () => void; testID: string }) {
  const t = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? t.primary : t.muted} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: selected ? '700' : '500' }}>{label}</Text>
        <Text style={{ color: t.muted, fontSize: 12 }}>{detail}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 8 },
})
