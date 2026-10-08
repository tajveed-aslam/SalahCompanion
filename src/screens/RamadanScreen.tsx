import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Card, confirm, Loading, Muted, Notice, Screen, Title } from '../components/ui'
import { useHijriToday, useRamadanYear } from '../hooks/useRamadan'
import { fastStats, localIsoDate, ramadanProgress, type FastStatus } from '../lib/ramadan'
import { radius, space, useTheme } from '../theme'

const RAMADAN = 9

export function RamadanScreen() {
  const { hijri, error } = useHijriToday()
  return (
    <Screen testID="screen-ramadan">
      <Title>Ramadan tracker</Title>
      {hijri ? (
        <Tracker currentYear={hijri.year} currentMonth={hijri.month} />
      ) : error ? (
        <Notice tone="error" testID="hijri-error">{error}</Notice>
      ) : (
        <Loading label="Loading the Islamic calendar…" />
      )}
    </Screen>
  )
}

function Tracker({ currentYear, currentMonth }: { currentYear: number; currentMonth: number }) {
  const t = useTheme()
  // Show the Ramadan that is running or most recently finished; the next one is a tap away.
  const defaultYear = currentMonth >= RAMADAN ? currentYear : currentYear - 1
  const years = [defaultYear, defaultYear + 1]
  const [year, setYear] = useState(defaultYear)
  const { calendar, record, loading, error, toggleDay, reset, retry } = useRamadanYear(year)

  const today = localIsoDate(new Date())
  const dates = calendar?.map((d) => d.date) ?? []
  const progress = ramadanProgress(dates, today)
  const total = calendar?.length ?? 30
  const stats = fastStats(record, total, progress)

  const onToggle = (day: number) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync()
    toggleDay(day)
  }

  return (
    <>
      <View style={styles.years} accessibilityRole="tablist">
        {years.map((y) => (
          <Pressable
            key={y}
            testID={`ramadan-year-${y}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: y === year }}
            onPress={() => setYear(y)}
            style={[styles.yearChip, { borderColor: y === year ? t.primary : t.border, backgroundColor: y === year ? t.primarySoft : t.surface }]}
          >
            <Text style={{ color: y === year ? t.primary : t.text, fontWeight: '700' }}>Ramadan {y} AH</Text>
          </Pressable>
        ))}
      </View>

      {loading && !calendar ? (
        <Loading label="Loading the Ramadan calendar…" />
      ) : error || !calendar ? (
        <Card>
          <Notice tone="error" testID="ramadan-error">{error ?? 'Could not load the Ramadan calendar.'}</Notice>
          <Button label="Try again" onPress={retry} testID="ramadan-retry" />
        </Card>
      ) : (
        <>
          <Muted testID="ramadan-range">
            {formatDate(calendar[0].date)} – {formatDate(calendar[calendar.length - 1].date)} · {total} days
            {progress === 0 ? ` · begins in ${daysUntil(calendar[0].date)} days` : dates.includes(today) ? ` · day ${progress}` : ' · completed'}
          </Muted>

          <View style={styles.stats}>
            <Stat icon="flame" label="Current streak" value={stats.currentStreak} color={t.gold} testID="stat-streak" />
            <Stat icon="trophy-outline" label="Best streak" value={stats.bestStreak} color={t.primary} testID="stat-best" />
            <Stat icon="checkmark-circle" label="Fasted" value={stats.fasted} color={t.good} testID="stat-fasted" />
            <Stat icon="time-outline" label="To make up" value={stats.missed} color={t.danger} testID="stat-missed" />
          </View>

          <Card>
            <Muted>Tap a day to mark it fasted, tap again for missed, once more to clear.</Muted>
            <View style={styles.grid} testID="ramadan-grid">
              {calendar.map(({ day, date }) => {
                const status = record[day]
                const future = date > today
                return (
                  <DayCell
                    key={day}
                    day={day}
                    status={status}
                    disabled={future}
                    isToday={date === today}
                    onPress={() => onToggle(day)}
                  />
                )
              })}
            </View>
            <View style={styles.legend}>
              <Legend color={t.good} label="Fasted" />
              <Legend color={t.danger} label="Missed" />
              <Legend color={t.border} label="Not marked" />
            </View>
          </Card>

          {progress === 0 && <Notice testID="ramadan-upcoming">Days unlock one by one as Ramadan arrives.</Notice>}

          <Button
            label="Clear this Ramadan"
            variant="ghost"
            disabled={Object.keys(record).length === 0}
            testID="ramadan-reset"
            onPress={() => confirm('Clear tracker?', `Remove every mark for Ramadan ${year} AH?`, reset)}
          />
        </>
      )}
    </>
  )
}

function DayCell({ day, status, disabled, isToday, onPress }: { day: number; status?: FastStatus; disabled: boolean; isToday: boolean; onPress: () => void }) {
  const t = useTheme()
  const bg = status === 'fasted' ? t.good : status === 'missed' ? t.danger : t.surface2
  const fg = status ? '#ffffff' : disabled ? t.muted : t.text
  return (
    <Pressable
      testID={`fast-day-${day}`}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day}, ${status ?? 'not marked'}${disabled ? ', upcoming' : ''}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        isToday && { borderWidth: 2, borderColor: t.gold },
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700' }}>{day}</Text>
      {status === 'fasted' && <Ionicons name="checkmark" size={12} color="#fff" />}
      {status === 'missed' && <Ionicons name="close" size={12} color="#fff" />}
    </Pressable>
  )
}

function Stat({ icon, label, value, color, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string; testID: string }) {
  const t = useTheme()
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text testID={testID} style={{ color: t.text, fontSize: 26, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
    </View>
  )
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - start.getTime()) / 86_400_000)
}

const styles = StyleSheet.create({
  years: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  yearChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.sm },
  cell: { width: 44, height: 50, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: space.lg, marginTop: space.sm, flexWrap: 'wrap' },
})
