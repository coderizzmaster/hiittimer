import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

import { WorkoutProvider } from './src/context/WorkoutContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import TabataScreen from './src/screens/TabataScreen';
import CustomScreen from './src/screens/CustomScreen';
import YourWorkoutsScreen from './src/screens/YourWorkoutsScreen';
import TimerScreen from './src/screens/TimerScreen';
import EMOMScreen from './src/screens/EMOMScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar from './src/components/BottomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TimerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Tabata" component={TabataScreen} />
      <Stack.Screen name="EMOM" component={EMOMScreen} />
      <Stack.Screen name="Custom" component={CustomScreen} />
      <Stack.Screen name="YourWorkouts" component={YourWorkoutsScreen} />
      <Stack.Screen
        name="WorkoutTimer"
        component={TimerScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Timer" component={TimerStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    }
  }, [isDark, colors.background]);

  const navTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs />
    </NavigationContainer>
  );
}

// Sits inside ThemeProvider but outside SafeAreaProvider so its background
// fills the full window including the Android gesture-bar strip at the bottom.
function ThemedRoot({ children }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.surface }}>{children}</View>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <ThemeProvider>
          <ThemedRoot>
            <SafeAreaProvider>
              <WorkoutProvider>
                <AppNavigator />
              </WorkoutProvider>
            </SafeAreaProvider>
          </ThemedRoot>
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
