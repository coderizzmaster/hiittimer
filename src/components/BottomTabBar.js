import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const tabs = [
  { name: 'Timer',    label: 'Timer',    icon: 'stopwatch-outline',  iconActive: 'stopwatch'    },
  { name: 'History',  label: 'History',  icon: 'bar-chart-outline',  iconActive: 'bar-chart'    },
  { name: 'Settings', label: 'Settings', icon: 'settings-outline',   iconActive: 'settings'     },
];

export default function BottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);

  const activeTab = state.routes[state.index];
  const activeNested = activeTab?.state?.routes?.[activeTab.state.index ?? 0]?.name;
  if (activeNested === 'WorkoutTimer') return null;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => {
              if (tab.name === 'Timer') {
                if (!isFocused) navigation.navigate('Timer');
                const timerRoute = state.routes.find(r => r.name === 'Timer');
                const innerKey = timerRoute?.state?.key;
                if (innerKey) {
                  navigation.dispatch({ ...StackActions.popToTop(), target: innerKey });
                }
              } else if (!isFocused) {
                navigation.navigate(tab.name);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? tab.iconActive : tab.icon}
              size={24}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function buildStyles(c, isDark) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: isDark ? c.surface : '#fff',
      paddingTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 8,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3 },
    label: { fontSize: 10, fontWeight: '500', color: c.textMuted, letterSpacing: 0.2 },
    labelActive: { color: c.primary, fontWeight: '700' },
  });
}
