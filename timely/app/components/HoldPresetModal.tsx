// app/components/HoldPresetModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import InfoModal from './InfoModal';

interface HoldPresetModalProps {
  visible: boolean;
  presetName: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export default function HoldPresetModal({
  visible,
  presetName,
  onClose,
  onRename,
  onDelete,
}: HoldPresetModalProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
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
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          {/* Title / message: just the preset name */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{presetName}</Text>
          </View>

          {/* Buttons stacked vertically */}
          <View style={styles.buttonsColumn}>
            <TouchableOpacity
              style={styles.renameButton}
              onPress={onRename}
              activeOpacity={0.85}
            >
              <Text style={styles.renameButtonText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info overlay for hold-preset options */}
        <InfoModal
          visible={showInfo}
          variant="presetHold"
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
    width: 280,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FFF',
    paddingVertical: 25,
    paddingHorizontal: 20,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },

  // Header row: info bubble left, close button right
  modalHeaderRow: {
    width: '100%',
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
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  titleContainer: {
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  titleText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonsColumn: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  renameButton: {
    minWidth: 150,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#00a3a3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameButtonText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    minWidth: 150,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#A13D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
