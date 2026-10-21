import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlueWaveOverlay } from './components/BlueWaveOverlay';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showWaveOverlay, setShowWaveOverlay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWaveOverlay(true);
    }, 3300);

    return () => clearTimeout(timer);
  }, []);

  const handleWaveComplete = () => {
    setShowWaveOverlay(false);
  };

  return (
    <View style={styles.container}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>

      {showWaveOverlay && (
        <View style={styles.waveOverlay}>
          <BlueWaveOverlay onWaveAnimationComplete={handleWaveComplete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waveOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
});
