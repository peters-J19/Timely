// app/components/InfoModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';

interface InfoModalProps {
  visible: boolean;
  variant:
    | 'timezone'
    | 'sleep'
    | 'presetName'
    | 'presetHold'
    | 'cylinderTab'
    | 'mapTab';
  onClose: () => void;
}

export default function InfoModal({ visible, variant, onClose }: InfoModalProps) {
  if (!visible) return null;

  const headingText =
    variant === 'timezone'
      ? 'Time Zone & Name'
      : variant === 'sleep'
      ? 'Bed Time & Wake Time'
      : variant === 'presetName'
      ? 'Preset Names'
      : variant === 'presetHold'
      ? 'Preset Options'
      : variant === 'cylinderTab'
      ? 'Cylinder View'
      : 'Map View';

  const bodyText =
    variant === 'timezone'
      ? [
          'Choose the time zone you want to visualize and give it a clear label.',
          'This can be a country, a city, a person who lives there, or something simple like “Home”.',
          'Pick whatever name makes it easy to recognize this line at a glance.',
        ]
      : variant === 'sleep'
      ? [
          'These times tell the app when this country or person is usually asleep and when they are awake.',
          'We use them to shade sleep sections and highlight “match” sections where nobody is sleeping.',
          'That way you can quickly see when everyone is available at the same time across different time zones.',
        ]
      : variant === 'presetName'
      ? [
          'Presets let you save specific combinations of countries or places.',
          'Giving each preset a short, clear name makes it much easier to switch between different setups later.',
          'If you leave this blank and tap “Save”, a simple default name will be created for you automatically.',
        ]
      : variant === 'presetHold'
      ? [
          'From here you can either rename this preset or delete it completely.',
          'Renaming helps you keep track of what this preset is used for without changing any of its countries.',
          'Deleting a preset will also remove all countries saved to it, so you would need to add them again later if you want them back.',
        ]
      : variant === 'cylinderTab'
      ? [
          'The Cylinder view stacks each country or person as a rotating 24-hour cylinder so you can compare times at a glance.',
          'When you set a time for one place, the cylinders show what local time it is everywhere else, focusing on the hour-by-hour differences between time zones.',
          'Use this view when you are asking, “If it is this time here, what time is it for everyone else?” and want a quick visual answer.',
          'The day-night shading and circular motion add a more immersive feel, helping you sense where each person is in their day while still staying focused on precise time conversion.',
        ]
      : [
          'The Map view lays out each country or person as a 24-hour timeline from left to right.',
          'You can easily see when each one is sleeping or awake and how their mornings, afternoons, and nights overlap across time zones.',
          'Red sections mark the hours when that specific timeline is asleep, while the green areas show periods when nobody is sleeping and everyone is awake at the same time.',
          'As you add countries, adjust bed and wake times, or switch presets, this map layout updates so you can scan across and spot the best shared time to connect.',
        ];

  return (
    <View style={styles.overlay} pointerEvents="auto">
      {/* Tap outside to close */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          <View style={styles.headingContainer}>
            <Text style={styles.headingText}>{headingText}</Text>
          </View>

          <View style={styles.bodyContainer}>
            {bodyText.map((paragraph, index) => (
              <Text key={index} style={styles.bodyText}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FFF',
    paddingVertical: 11,
    paddingHorizontal: 11,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    width: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingBottom: 0,
    top: 0,
    right: 0,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headingContainer: {
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  headingText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  bodyContainer: {
    marginTop: 6,
    gap: 8,
  },
  bodyText: {
    color: '#DDD',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 5,
  },
});
