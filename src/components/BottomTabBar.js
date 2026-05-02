import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import EmojiIcon from './EmojiIcon';

const tabs = [
  { name: 'Timer', label: 'Timer', icon: '⏱' },
  { name: 'History', label: 'History', icon: '🕐' },
  { name: 'Settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = buildStyles(colors);

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
            <EmojiIcon emoji={tab.icon} size={22} style={{ opacity: isFocused ? 1 : 0.4 }} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function buildStyles(c) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    tab: { flex: 1, alignItems: 'center', gap: 2 },
    tabLabel: { fontSize: 11, color: c.textSecondary, fontWeight: '500' },
    tabLabelActive: { color: c.primary, fontWeight: '700' },
  });
}
