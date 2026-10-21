import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BlueWaveOverlayProps {
  onWaveAnimationComplete?: () => void;
}

export function BlueWaveOverlay({ onWaveAnimationComplete }: BlueWaveOverlayProps) {
  const waveTranslateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    waveTranslateY.value = withSequence(
      withTiming(-SCREEN_HEIGHT - 80, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
      }),
      withDelay(600, withTiming(SCREEN_HEIGHT + 80, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
      }, () => {
        runOnJS(finishWaveAnimation)();
      }))
    );
  }, []);

  const finishWaveAnimation = () => {
    if (onWaveAnimationComplete) {
      onWaveAnimationComplete();
    }
  };

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: waveTranslateY.value }],
  }));

  return (
    <View style={styles.waveOverlayContainer}>
      <Animated.View style={[styles.waveContainer, waveAnimatedStyle]}>
        <Svg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT * 3}
          viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 3}`}
          style={styles.wave}
        >
          <Path
            d={`M 0 ${SCREEN_HEIGHT * 1}
               C ${SCREEN_WIDTH * 0.1} ${SCREEN_HEIGHT * 0.9},
                 ${SCREEN_WIDTH * 0.3} ${SCREEN_HEIGHT * 1.1},
                 ${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT * 1}
               C ${SCREEN_WIDTH * 0.7} ${SCREEN_HEIGHT * 0.9},
                 ${SCREEN_WIDTH * 0.9} ${SCREEN_HEIGHT * 1.1},
                 ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 1}
             L ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 3}
             L 0 ${SCREEN_HEIGHT * 3}
             Z`}
            fill="#1356CC"
            stroke="#000000"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  waveOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1000,
    elevation: 1000,
  },
  waveContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
