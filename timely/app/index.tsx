import { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withSequence(
      withDelay(1000, withTiming(1, { duration: 800, easing: Easing.ease })),
      withDelay(2300, withTiming(0, { duration: 0 }, () => {
        runOnJS(navigateToTabs)();
      }))
    );
  }, []);

  const navigateToTabs = () => {
    router.replace('/(tabs)/cylinder');
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={{ uri: 'https://api.builder.io/api/v1/image/assets/TEMP/fb8baefda5c8545a900fbbacb584d22a34160fcd' }}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.35,
  },
});
