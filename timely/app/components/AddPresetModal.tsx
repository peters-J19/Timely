// app/components/AddPresetModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
} from 'react-native';
import InfoModal from './InfoModal';

interface AddPresetModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialName?: string;
  defaultName?: string;          // used for "e.g. Preset X"
  onClose: () => void;
  onUseDefault?: () => void;     // called when field is empty
  onSaveCustom: (name: string) => void;
}

export default function AddPresetModal({
  visible,
  mode,
  initialName,
  defaultName,
  onClose,
  onUseDefault,
  onSaveCustom,
}: AddPresetModalProps) {
  const [name, setName] = useState(initialName ?? '');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [lockedDefaultName, setLockedDefaultName] = useState(
    defaultName && defaultName.trim().length > 0 ? defaultName : 'Preset 1'
  );
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setIsNameFocused(false);
    }

    setLockedDefaultName(
      defaultName && defaultName.trim().length > 0 ? defaultName : 'Preset 1'
    );
  }, [visible, initialName]);

  const handleSave = () => {
    const trimmed = name.trim();

    if (trimmed) {
      // User entered a custom name
      onSaveCustom(trimmed);
    } else if (onUseDefault) {
      // User left it blank -> use default name for this preset
      onUseDefault();
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const headingText =
    mode === 'add'
      ? 'Enter a custom preset name'
      : 'Update your custom preset name';

  const placeholderText = `e.g. ${lockedDefaultName}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modalContent}>
              {/* Header row: info bubble left, close button right */}
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setShowInfo(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.infoBubble}>
                    <Text style={styles.infoBubbleText}>i</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>

              {/* Heading text */}
              <View style={styles.headingContainer}>
                <Text style={styles.headingText}>{headingText}</Text>
              </View>

              {/* Name input */}
              <View style={styles.inputsContainer}>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    // Placeholder only if field is empty AND not focused
                    placeholder={
                      name.length === 0 && !isNameFocused
                        ? placeholderText
                        : ''
                    }
                    placeholderTextColor="#d0d0d0"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                  />
                </View>
              </View>

              {/* Save button */}
              <View style={styles.buttonsColumn}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Info overlay for preset naming */}
        <InfoModal
          visible={showInfo}
          variant="presetName"
          onClose={() => setShowInfo(false)}
        />
      </View>
    </Modal>
  );
}

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
    top: -4,
  },
  infoButton: {
    paddingBottom: 4,
  },
  infoBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2F80ED',
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
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  headingContainer: {
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  headingText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  inputsContainer: {
    gap: 15,
    marginBottom: 10,
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
  buttonsColumn: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    minWidth: 150,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: '#6ba369',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
