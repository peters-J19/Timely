// app/components/AddCountryModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import InfoModal from './InfoModal';

interface AddCountryModalProps {
  visible: boolean;
  mode?: 'add' | 'edit';
  initialData?: {
    timezoneId: number;  // integer offset -12..12
    name: string;
    bedTime: number;     // 0–23
    wakeUpTime: number;  // 0–23
  };
  onClose: () => void;
  onSave: (data: {
    timezoneId: number;  // integer offset -12..12
    name: string;
    bedTime: number;     // 0–23
    wakeUpTime: number;  // 0–23
  }) => void;
}

// -------- Time zone data --------

const TIMEZONES_MAP: Record<number, string> = {
  [-12]: 'UTC−12:00 — Baker Island',
  [-11]: 'UTC−11:00 — Samoa',
  [-10]: 'UTC−10:00 — Hawaii (Honolulu)',
  [-9]: 'UTC−09:00 — Alaska (Anchorage)',
  [-8]: 'UTC−08:00 — Pacific Time (Los Angeles)',
  [-7]: 'UTC−07:00 — Mountain Time (Denver)',
  [-6]: 'UTC−06:00 — Central Time (Chicago)',
  [-5]: 'UTC−05:00 — Eastern Time (New York)',
  [-4]: 'UTC−04:00 — Atlantic Time (Halifax)',
  [-3]: 'UTC−03:00 — Buenos Aires',
  [-2]: 'UTC−02:00 — South Georgia',
  [-1]: 'UTC−01:00 — Azores',
  [0]: 'UTC±00:00 — GMT (London)',
  [1]: 'UTC+01:00 — Central Europe (Berlin, Paris)',
  [2]: 'UTC+02:00 — Eastern Europe (Athens, Cairo)',
  [3]: 'UTC+03:00 — Moscow, Dubai',
  [4]: 'UTC+04:00 — Baku, Tbilisi',
  [5]: 'UTC+05:00 — Pakistan (Karachi)',
  [6]: 'UTC+06:00 — Bangladesh (Dhaka)',
  [7]: 'UTC+07:00 — Bangkok, Jakarta',
  [8]: 'UTC+08:00 — Beijing, Singapore',
  [9]: 'UTC+09:00 — Tokyo, Seoul',
  [10]: 'UTC+10:00 — Sydney, Melbourne',
  [11]: 'UTC+11:00 — Solomon Islands',
  [12]: 'UTC+12:00 — New Zealand (Auckland)',
};

type TimezoneOption = {
  id: number;
  label: string;
};

const TIMEZONE_OPTIONS: TimezoneOption[] = Object.entries(TIMEZONES_MAP)
  .map(([id, label]) => ({ id: Number(id), label }))
  .sort((a, b) => a.id - b.id);

// ----- Time-wheel constants -----
const HOUR_VALUES = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LOOP_MULTIPLIER = 21;
const HOUR_WHEEL_DATA = Array.from(
  { length: HOUR_VALUES.length * HOUR_LOOP_MULTIPLIER },
  (_, index) => HOUR_VALUES[index % HOUR_VALUES.length],
);

const TIME_ITEM_HEIGHT = 36;
const TIME_VISIBLE_ROWS = 5;
const TIME_CENTER_OFFSET = Math.floor(TIME_VISIBLE_ROWS / 2);

export default function AddCountryModal({
  visible,
  mode = 'add',
  initialData,
  onClose,
  onSave,
}: AddCountryModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [timezoneId, setTimezoneId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [bedTime, setBedTime] = useState('00:00');
  const [wakeUpTime, setWakeUpTime] = useState('08:00');
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  const [infoMode, setInfoMode] = useState<'timezone' | 'sleep' | null>(null);

  const selectedTimezoneLabel =
    timezoneId !== null
      ? TIMEZONE_OPTIONS.find((tz) => tz.id === timezoneId)?.label ?? ''
      : '';

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] =
    useState<'bed' | 'wake' | null>(null);
  const [timePickerInitialHour, setTimePickerInitialHour] = useState(0);

  useEffect(() => {
    if (!visible) return;

    if (mode === 'edit' && initialData) {
      setStep(1);
      setTimezoneId(initialData.timezoneId);
      setName(initialData.name);
      setBedTime(`${initialData.bedTime.toString().padStart(2, '0')}:00`);
      setWakeUpTime(`${initialData.wakeUpTime.toString().padStart(2, '0')}:00`);
      setShowTimezoneDropdown(false);
      setTimePickerVisible(false);
      setActiveTimeField(null);
      setInfoMode(null);
    } else {
      resetForm();
    }
  }, [visible, mode, initialData]);

  const handleValidNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const parseHourFromTime = (time: string) => {
    const [h] = time.split(':');
    const n = parseInt(h, 10);
    if (Number.isNaN(n) || n < 0 || n > 23) return 0;
    return n;
  };

  const handleSave = () => {
    const tz =
      timezoneId !== null
        ? TIMEZONE_OPTIONS.find((t) => t.id === timezoneId)
        : undefined;

    const bedHour = parseHourFromTime(bedTime);
    const wakeHour = parseHourFromTime(wakeUpTime);

    onSave({
      timezoneId: tz?.id ?? 0,
      name,
      bedTime: bedHour,
      wakeUpTime: wakeHour,
    });

    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setTimezoneId(null);
    setName('');
    setBedTime('00:00');
    setWakeUpTime('08:00');
    setShowTimezoneDropdown(false);
    setTimePickerVisible(false);
    setActiveTimeField(null);
    setInfoMode(null);
  };

  const handleSelectTimezone = (id: number) => {
    setTimezoneId(id);
    setShowTimezoneDropdown(false);
  };

  const openTimePicker = (field: 'bed' | 'wake') => {
    setActiveTimeField(field);
    const currentTime = field === 'bed' ? bedTime : wakeUpTime;
    const hour = parseHourFromTime(currentTime);
    setTimePickerInitialHour(hour);
    setTimePickerVisible(true);
  };

  const handleConfirmTime = (hour: number) => {
    const formatted = `${hour.toString().padStart(2, '0')}:00`;
    if (activeTimeField === 'bed') {
      setBedTime(formatted);
    } else if (activeTimeField === 'wake') {
      setWakeUpTime(formatted);
    }
    setTimePickerVisible(false);
    setActiveTimeField(null);
  };

  const handleCloseTimePicker = () => {
    setTimePickerVisible(false);
    setActiveTimeField(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {step === 1 ? (
            <Step1
              timezoneId={timezoneId}
              timezoneLabel={selectedTimezoneLabel}
              name={name}
              onNameChange={setName}
              onNext={handleValidNext}
              onClose={handleClose}
              showTimezoneDropdown={showTimezoneDropdown}
              onTimezonePress={() =>
                setShowTimezoneDropdown(!showTimezoneDropdown)
              }
              onSelectTimezone={handleSelectTimezone}
              onInfoPress={() => setInfoMode('timezone')}
            />
          ) : (
            <Step2
              bedTime={bedTime}
              wakeUpTime={wakeUpTime}
              onBack={handleBack}
              onSave={handleSave}
              onClose={handleClose}
              onBedTimePress={() => openTimePicker('bed')}
              onWakeUpTimePress={() => openTimePicker('wake')}
              onInfoPress={() => setInfoMode('sleep')}
            />
          )}

          {timePickerVisible && (
            <TimePickerOverlay
              initialHour={timePickerInitialHour}
              onConfirm={handleConfirmTime}
              onClose={handleCloseTimePicker}
            />
          )}
        </View>

        {/* Info overlay on top of the whole AddCountryModal */}
        <InfoModal
          visible={infoMode !== null}
          variant={infoMode === 'sleep' ? 'sleep' : 'timezone'}
          onClose={() => setInfoMode(null)}
        />
      </View>
    </Modal>
  );
}

// ---------- STEP 1 ----------

interface Step1Props {
  timezoneId: number | null;
  timezoneLabel: string;
  name: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
  onClose: () => void;
  showTimezoneDropdown: boolean;
  onTimezonePress: () => void;
  onSelectTimezone: (id: number) => void;
  onInfoPress: () => void;
}

function Step1({
  timezoneId,
  timezoneLabel,
  name,
  onNameChange,
  onNext,
  onClose,
  showTimezoneDropdown,
  onTimezonePress,
  onSelectTimezone,
  onInfoPress,
}: Step1Props) {
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [showErrorBorder, setShowErrorBorder] = useState(false);

  const borderIdRef = useRef(0);
  const messageIdRef = useRef(0);

  const handleNextPress = () => {
    if (timezoneId !== null && name) {
      borderIdRef.current += 1;
      messageIdRef.current += 1;
      setShowErrorBorder(false);
      setShowErrorMessage(false);
      onNext();
      return;
    }

    borderIdRef.current += 1;
    const thisBorderId = borderIdRef.current;
    setShowErrorBorder(true);
    setTimeout(() => {
      if (borderIdRef.current === thisBorderId) {
        setShowErrorBorder(false);
      }
    }, 100);

    messageIdRef.current += 1;
    const thisMessageId = messageIdRef.current;
    setShowErrorMessage(true);
    setTimeout(() => {
      if (messageIdRef.current === thisMessageId) {
        setShowErrorMessage(false);
      }
    }, 3000);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.modalContent}>
        {/* HEADER: info icon left, close right */}
        <View style={styles.modalHeaderRow}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={onInfoPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.infoBubble}>
              <Text style={styles.infoBubbleText}>i</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputsContainer}>
          <TouchableOpacity
            style={styles.timezoneDropdown}
            onPress={onTimezonePress}
          >
            <Text
              style={[
                styles.inputText,
                !timezoneLabel && styles.placeholderText,
              ]}
            >
              {timezoneLabel || '[ Please Select a Time Zone ]'}
            </Text>
            <Text style={styles.dropdownIcon}>
              {showTimezoneDropdown ? '▴' : '▾'}
            </Text>
          </TouchableOpacity>

          {showTimezoneDropdown && (
            <View style={styles.timezoneDropdownOverlay}>
              <View style={styles.dropdownList}>
                <FlatList
                  data={TIMEZONE_OPTIONS}
                  keyExtractor={(item) => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => onSelectTimezone(item.id)}
                    >
                      <View style={styles.dropdownItemInner}>
                        <Text style={styles.dropdownItemText}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          )}

          <View style={styles.nameInputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder={isNameFocused ? '' : '[ Please enter a name ]'}
              placeholderTextColor="#d0d0d0"
              value={name}
              onChangeText={onNameChange}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
            />
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.nextButtonRow}>
          <View style={styles.nextButtonSpacer} />
          <TouchableOpacity
            style={[
              styles.nextButtonOverlay,
              showErrorBorder && styles.nextButtonErrorBorder,
            ]}
            onPress={handleNextPress}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorMessageContainer}>
          {showErrorMessage && (
            <Text style={styles.errorMessageText}>
              Please complete all the fields!
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ---------- STEP 2 ----------

interface Step2Props {
  bedTime: string;
  wakeUpTime: string;
  onBack: () => void;
  onSave: () => void;
  onClose: () => void;
  onBedTimePress: () => void;
  onWakeUpTimePress: () => void;
  onInfoPress: () => void;
}

function Step2({
  bedTime,
  wakeUpTime,
  onBack,
  onSave,
  onClose,
  onBedTimePress,
  onWakeUpTimePress,
  onInfoPress,
}: Step2Props) {
  return (
    <View style={styles.modalContent}>
      {/* HEADER: info icon left, close right */}
      <View style={styles.modalHeaderRow}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={onInfoPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.infoBubble}>
            <Text style={styles.infoBubbleText}>i</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>
          Please enter what time you go to{'\n'}bed and when you wake up:
        </Text>
      </View>

      <View style={styles.labelsContainer}>
        <Text style={styles.label}>Bed Time</Text>
        <Text style={styles.label}>Wake Up</Text>
      </View>

      <View style={styles.inputsContainer}>
        <View style={styles.timeInputsRow}>
          <TouchableOpacity
            style={styles.timeInput}
            onPress={onBedTimePress}
            activeOpacity={0.85}
          >
            <Text style={styles.timeInputText}>{bedTime}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeInput}
            onPress={onWakeUpTimePress}
            activeOpacity={0.85}
          >
            <Text style={styles.timeInputText}>{wakeUpTime}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.largerSpacer} />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- TIME PICKER OVERLAY ----------

interface TimePickerOverlayProps {
  initialHour: number;
  onConfirm: (hour: number) => void;
  onClose: () => void;
}

function TimePickerOverlay({
  initialHour,
  onConfirm,
  onClose,
}: TimePickerOverlayProps) {
  const middleLoop = Math.floor(HOUR_LOOP_MULTIPLIER / 2);
  const centerIndexInitial =
    middleLoop * HOUR_VALUES.length + (initialHour || 0);
  const topIndexInitial = centerIndexInitial - TIME_CENTER_OFFSET;

  const [selectedIndex, setSelectedIndex] = useState(centerIndexInitial);
  const flatListRef = useRef<FlatList<number> | null>(null);

  const handleMomentumEnd = (e: any) => {
    const offsetY = e?.nativeEvent?.contentOffset?.y ?? 0;
    const topIndex = Math.round(offsetY / TIME_ITEM_HEIGHT);
    const centerIndex = topIndex + TIME_CENTER_OFFSET;
    setSelectedIndex(centerIndex);
  };

  const selectedHour =
    HOUR_WHEEL_DATA[selectedIndex] ?? (initialHour || 0);

  return (
    <View style={styles.timePickerOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerTitle}>Select time</Text>

        <View style={styles.timePickerWheelWrapper}>
          <View style={styles.timePickerHighlight} pointerEvents="none" />
          <FlatList
            style={styles.timePickerList}
            ref={flatListRef}
            data={HOUR_WHEEL_DATA}
            keyExtractor={(_, index) => `hour-${index}`}
            showsVerticalScrollIndicator={false}
            scrollEnabled
            bounces
            snapToInterval={TIME_ITEM_HEIGHT}
            decelerationRate="normal"
            snapToAlignment="center"
            initialScrollIndex={topIndexInitial}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({
              length: TIME_ITEM_HEIGHT,
              offset: TIME_ITEM_HEIGHT * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const isSelected = index === selectedIndex;
              const label = `${item.toString().padStart(2, '0')}:00`;
              return (
                <View
                  style={[
                    styles.timePickerItem,
                    isSelected && styles.timePickerItemSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.timePickerItemText,
                      isSelected && styles.timePickerItemTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            }}
          />
        </View>

        <View style={styles.timePickerButtonsRow}>
          <TouchableOpacity
            style={styles.timePickerCancelButton}
            onPress={onClose}
          >
            <Text style={styles.timePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timePickerConfirmButton}
            onPress={() => onConfirm(selectedHour)}
          >
            <Text style={styles.timePickerConfirmText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------- STYLES ----------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 25,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    width: '100%',
  },

  // Header row: info bubble left, close button right
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    top: -5,
  },
  infoButton: {
    paddingBottom: 4,
  },
  infoBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2F80ED', // nice blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  infoBubbleText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  closeButton: {
    paddingBottom: 4,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  inputsContainer: {
    gap: 15,
    marginBottom: 10,
  },
  timezoneDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4a4a4a',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  inputText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'center',
  },
  placeholderText: {
    color: '#d0d0d0',
  },
  dropdownIcon: {
    color: '#FFF',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 1,
  },
  timezoneDropdownOverlay: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  dropdownList: {
    width: '100%',
    maxHeight: 220,
    backgroundColor: '#333',
    borderRadius: 20,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  dropdownItem: {
    paddingVertical: 0,
    alignItems: 'center',
  },
  dropdownItemInner: {
    width: '85%',
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    paddingVertical: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  nameInputContainer: {
    backgroundColor: '#4a4a4a',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  nameInput: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  spacer: {
    height: 10,
  },

  nextButtonRow: {
    marginTop: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonSpacer: {
    width: '70%',
    maxWidth: 260,
    minWidth: 160,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#00a3a3',
  },
  nextButtonOverlay: {
    position: 'absolute',
    width: '70%',
    maxWidth: 260,
    minWidth: 160,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#00a3a3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonErrorBorder: {
    borderWidth: 3,
    borderColor: '#FF4A4A',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  errorMessageContainer: {
    height: 20,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessageText: {
    color: '#FF4A4A',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  explanationContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  explanationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'center',
  },
  timeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeInput: {
    backgroundColor: '#4a4a4a',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
  },
  timeInputText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  largerSpacer: {
    height: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#00a3a3',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6ba369',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // time picker overlay
  timePickerOverlay: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    width: '80%',
    maxWidth: 280,
    backgroundColor: '#111',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  timePickerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 12,
  },
  timePickerWheelWrapper: {
    height: TIME_ITEM_HEIGHT * TIME_VISIBLE_ROWS,
    width: '100%',
    overflow: 'hidden',
  },
  timePickerList: {
    width: '100%',
  },
  timePickerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TIME_ITEM_HEIGHT * TIME_CENTER_OFFSET,
    height: TIME_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#555',
  },
  timePickerItem: {
    height: TIME_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerItemSelected: {},
  timePickerItemText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  timePickerItemTextSelected: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  timePickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#00a3a3',
    alignItems: 'center',
  },
  timePickerCancelText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  timePickerConfirmText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
