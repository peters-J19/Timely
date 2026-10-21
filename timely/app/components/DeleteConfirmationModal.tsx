import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';

interface DeleteConfirmationModalProps {
  visible: boolean;
  type: 'country' | 'preset';
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  visible,
  type,
  name,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.messageFrame}>
            <Text style={styles.messageText}>
              {`Are you sure you want to delete ${type} "${name}"?`}
            </Text>
          </View>

          <View style={styles.buttonsFrame}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>DELETE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    width: 300,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 20,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  messageFrame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonsFrame: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#A13D3D',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#4a4a4a',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
});
