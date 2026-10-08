import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAppData } from '../AppData'
import { LocationGate } from '../components/LocationGate'
import { Button, Card, Loading, Muted, Notice, Screen, Title } from '../components/ui'
import { useNow } from '../hooks/useNow'
import { methodName } from '../lib/methods'
import { formatCountdown, formatTime, nextPrayer, type PrayerDay } from '../lib/prayerTimes'
import { radius, space, useTheme } from '../theme'

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Fajr: 'cloudy-night-outline',
  Sunrise: 'sunny-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night',
  Isha: 'moon-outline',
}

export function PrayerTimesScreen() {
  const { days, timesLoading, refreshTimes } = useAppData()
  return (
    <Screen testID="screen-times" refreshing={timesLoading && !!days} onRefresh={refreshTimes}>
      <Title>Prayer times</Title>
      <LocationGate purpose="accurate prayer times">
        <TimesContent />
      </LocationGate>
    </Screen>
  )
}

function TimesContent() {
  const t = useTheme()
  const { place, days, timesLoading, timesError, offlineSince, method, refreshTimes, locate } = useAppData()
  const now = useNow(1000)
  const [dayIndex, setDayIndex] = useState(0)

  if (!place) return null
  const placeLabel = place.name ?? `${place.latitude.toFixed(3)}°, ${place.longitude.toFixed(3)}°`

  const header = (
    <View style={{ gap: 2 }}>
      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color={t.muted} />
        <Text testID="place-name" style={{ color: t.text, fontWeight: '600', flexShrink: 1 }}>{placeLabel}</Text>
      </View>
      {place.sample && (
        <Pressable testID="use-my-location" onPress={() => void locate()} accessibilityRole="button">
          <Text style={{ color: t.primary, fontWeight: '600' }}>Use my location instead</Text>
        </Pressable>
      )}
    </View>
  )

  if (!days) {
    return (
      <>
        {header}
        {timesError ? (
          <Card>
            <Notice tone="error" testID="times-error">{timesError}</Notice>
            <Button label="Try again" onPress={refreshTimes} testID="times-retry" />
          </Card>
        ) : (
          timesLoading && <Loading label="Loading prayer times…" />
        )}
      </>
    )
  }

  const next = nextPrayer(days, now)
  const day = days[Math.min(dayIndex, days.length - 1)]
  const today = days[0]

  return (
    <>
      {header}
      {offlineSince && (
        <Notice tone="warn" testID="offline-notice">
          Offline: showing times saved {new Date(offlineSince).toLocaleString()}. Pull down to retry.
        </Notice>
      )}

      {next && (
        <View testID="next-prayer" style={[styles.hero, { backgroundColor: t.primary }]}>
          <Text style={[styles.heroLabel, { color: t.primaryText }]}>Next prayer</Text>
          <Text testID="next-prayer-name" style={[styles.heroName, { color: t.primaryText }]}>{next.name}</Text>
          <Text style={{ color: t.primaryText, fontSize: 16, opacity: 0.9 }}>at {formatTime(next.time)}</Text>
          <Text testID="next-prayer-countdown" style={[styles.countdown, { color: t.primaryText }]}>
            in {formatCountdown(next.msUntil)}
          </Text>
        </View>
      )}

      <Card>
        <View style={styles.dayTabs}>
          {['Today', 'Tomorrow'].map((label, i) => (
            <Pressable
              key={label}
              testID={`day-${label.toLowerCase()}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: dayIndex === i }}
              onPress={() => setDayIndex(i)}
              style={[styles.dayTab, dayIndex === i && { backgroundColor: t.primarySoft }]}
            >
              <Text style={{ color: dayIndex === i ? t.primary : t.muted, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <DateLine day={day} />
        <View style={{ marginTop: space.sm }}>
          {day.times.map((p) => {
            const isCurrent = day === today && next?.current === p.name && p.time.getTime() <= now.getTime()
            const isNext = next?.name === p.name && next.time.getTime() === p.time.getTime()
            const passed = p.time.getTime() <= now.getTime() && !isCurrent
            return (
              <View
                key={p.name}
                testID={`time-${p.name.toLowerCase()}`}
                style={[
                  styles.timeRow,
                  { borderColor: t.border },
                  isCurrent && { backgroundColor: t.primarySoft, borderColor: t.primarySoft },
                  isNext && { borderColor: t.primary },
                ]}
              >
                <Ionicons name={ICONS[p.name]} size={20} color={isCurrent || isNext ? t.primary : t.muted} />
                <Text style={[styles.timeName, { color: passed ? t.muted : t.text }]}>{p.name}</Text>
                {isCurrent && <Badge label="Now" />}
                {isNext && <Badge label="Next" outline />}
                <Text style={[styles.timeValue, { color: passed ? t.muted : t.text }]}>{formatTime(p.time)}</Text>
              </View>
            )
          })}
        </View>
      </Card>

      <Muted testID="method-line">
        {method ? `${methodName(method.method)} · Asr ${method.school === 'hanafi' ? 'Hanafi' : 'Standard'}` : day.methodName}
        {method?.auto ? ' (auto for your region, change in Settings)' : ''}
      </Muted>
      <Muted style={{ fontSize: 12 }}>Times from the AlAdhan API, shown in your device&apos;s time zone.</Muted>
    </>
  )
}

function DateLine({ day }: { day: PrayerDay }) {
  const t = useTheme()
  const [y, m, d] = day.date.split('-').map(Number)
  const gregorian = new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <View testID="date-line">
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{gregorian}</Text>
      <Text style={{ color: t.gold, fontWeight: '600' }}>
        {day.hijri.day} {day.hijri.monthName} {day.hijri.year} AH · {day.hijri.monthNameAr}
      </Text>
    </View>
  )
}

function Badge({ label, outline }: { label: string; outline?: boolean }) {
  const t = useTheme()
  return (
    <View style={[styles.badge, outline ? { borderWidth: 1, borderColor: t.primary } : { backgroundColor: t.primary }]}>
      <Text style={{ color: outline ? t.primary : t.primaryText, fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: 2 },
  heroLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 },
  heroName: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  countdown: { fontSize: 22, fontWeight: '700', marginTop: space.sm, fontVariant: ['tabular-nums'] },
  dayTabs: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  dayTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.sm },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  timeName: { fontSize: 17, fontWeight: '600', flex: 1 },
  timeValue: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
})
