import type { ReactNode } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { radius, space, useTheme } from '../theme'

export function Screen({ children, refreshing, onRefresh, testID }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; testID?: string }) {
  const t = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView
        testID={testID}
        contentContainerStyle={styles.screen}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.primary} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Card({ children, style, testID }: { children: ReactNode; style?: ViewStyle; testID?: string }) {
  const t = useTheme()
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]}>
      {children}
    </View>
  )
}

export function Title({ children }: { children: ReactNode }) {
  const t = useTheme()
  return <Text style={[styles.title, { color: t.text }]} accessibilityRole="header">{children}</Text>
}

export function Muted({ children, style, testID }: { children: ReactNode; style?: object; testID?: string }) {
  const t = useTheme()
  return <Text testID={testID} style={[{ color: t.muted, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  testID,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  testID?: string
}) {
  const t = useTheme()
  const primary = variant === 'primary'
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: t.primary } : { borderWidth: 1, borderColor: t.border, backgroundColor: t.surface },
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.8 },
      ]}
    >
      <Text style={{ color: primary ? t.primaryText : t.text, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  )
}

export function Notice({ children, tone = 'info', testID }: { children: ReactNode; tone?: 'info' | 'warn' | 'error'; testID?: string }) {
  const t = useTheme()
  const bg = tone === 'error' ? t.dangerSoft : tone === 'warn' ? t.goldSoft : t.primarySoft
  const fg = tone === 'error' ? t.danger : tone === 'warn' ? t.gold : t.primary
  return (
    <View testID={testID} style={[styles.notice, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  )
}

export function Loading({ label }: { label: string }) {
  const t = useTheme()
  return (
    <View style={styles.loading} testID="loading">
      <ActivityIndicator color={t.primary} />
      <Text style={{ color: t.muted }}>{label}</Text>
    </View>
  )
}

/** Confirmation dialog that also works on web (react-native-web's Alert has no buttons). */
export function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm()
    return
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', style: 'destructive', onPress: onConfirm },
  ])
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, gap: space.sm },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  button: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  notice: { borderRadius: radius.md, padding: space.md },
  loading: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
})
