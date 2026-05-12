import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const modes = [
  { id: 'tabata', title: 'TABATA', subtitle: 'Quick HIIT (20s/10s)', screen: 'Tabata', icon: 'timer-outline' },
  { id: 'emom', title: 'EMOM', subtitle: 'Every Minute On the Minute', screen: 'EMOM', icon: 'repeat-outline' },
  { id: 'circuit', title: 'CIRCUIT', subtitle: 'Multi-exercise rounds', screen: 'Custom', params: { mode: 'circuit' }, icon: 'flash-outline' },
  { id: 'custom', title: 'CUSTOM', subtitle: 'Design your own workout', screen: 'Custom', params: { mode: 'custom' }, icon: 'build-outline' },
  { id: 'saved', title: 'YOUR WORKOUTS', subtitle: 'Load your saved workouts', screen: 'YourWorkouts', icon: 'bookmark-outline' },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = buildStyles(colors, isDark, width >= 600);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1 }} />
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>YOUR TRAINING</Text>
              <Text style={styles.title}>HIIT Timer</Text>
              <Text style={styles.subtitle}>Choose your workout mode</Text>
            </View>
            <View style={styles.list}>
              {modes.map(mode => (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.card}
                  onPress={() => navigation.navigate(mode.screen, mode.params)}
                  activeOpacity={0.78}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={mode.icon} size={22} color="#fff" />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{mode.title}</Text>
                    <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flex: 3 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function buildStyles(c, isDark, isTablet = false) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flexGrow: 1, paddingHorizontal: '10%', paddingBottom: spacing.xl, paddingTop: isTablet ? '5%' : 0 },
    header: { marginBottom: spacing.xl },
    eyebrow: { fontSize: 11, fontWeight: '700', color: c.primary, letterSpacing: 1.8, marginBottom: spacing.xs },
    title: { fontSize: 40, fontWeight: '800', color: c.text, letterSpacing: -1 },
    subtitle: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
    contentWrapper: { flex: 1, flexDirection: 'column' },
    list: { gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? c.surface : '#fff',
      borderRadius: radius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    cardText: { flex: 1, justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, letterSpacing: 0.3 },
    cardSubtitle: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    chevron: { fontSize: 22, color: c.primary, fontWeight: '300' },
  });
}
