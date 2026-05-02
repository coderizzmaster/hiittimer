import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

export default function StatRow({ icon, label, value }) {
  const { colors } = useTheme();
  const styles = buildStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function buildStyles(c) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.sm,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    icon: { fontSize: 18 },
    label: { fontSize: 15, color: c.text, fontWeight: '500' },
    value: { fontSize: 15, fontWeight: '600', color: c.text },
  });
}
