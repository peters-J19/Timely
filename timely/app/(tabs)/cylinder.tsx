// app/(tabs)/cylinder.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AddCountryModal from '../components/AddCountryModal';
import AddPresetModal from '../components/AddPresetModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import HoldPresetModal from '../components/HoldPresetModal';
import { useCountryPresetStore, Preset } from './_layout';

export default function CylinderScreen() {
  const [showModal, setShowModal] = useState(false);

  // Preset add/edit modal state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetModalMode, setPresetModalMode] = useState<'add' | 'edit'>('add');
  const [presetModalInitialName, setPresetModalInitialName] = useState('');
  const [presetModalTargetId, setPresetModalTargetId] = useState<number | null>(
    null
  );

  // Hold-preset modal state
  const [showHoldPresetModal, setShowHoldPresetModal] = useState(false);
  const [heldPreset, setHeldPreset] = useState<Preset | null>(null);

  // Delete target (only presets here)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'preset';
    id: number;
    name: string;
  } | null>(null);

  const {
    addCountryToCurrentPreset,
    presets,
    currentPresetId,
    setCurrentPresetId,
    addPreset,
    renamePreset,
    deletePreset,
    getNextPresetDefaultName,
  } = useCountryPresetStore();

  const defaultPresetNameForAdd = getNextPresetDefaultName();
  const defaultPresetNameForEdit =
    presetModalTargetId !== null ? `Preset ${presetModalTargetId}` : '';

  const handleAddCountry = (data: {
    timezoneId: number;
    name: string;
    bedTime: number;
    wakeUpTime: number;
  }) => {
    // Write into the same shared model used by Map
    addCountryToCurrentPreset(data);
    setShowModal(false);
  };

  // --------- PRESET SCROLL BEHAVIOR ---------
  const presetScrollRef = useRef<ScrollView | null>(null);
  const [presetBarWidth, setPresetBarWidth] = useState(0);
  const presetLayouts = useRef<Record<number, { x: number; width: number }>>(
    {}
  );

  useEffect(() => {
    if (!presetBarWidth) return;
    const layout = presetLayouts.current[currentPresetId];
    if (!layout) return;

    const allLayouts = Object.values(presetLayouts.current);
    if (!allLayouts.length) return;

    const maxRight = allLayouts.reduce(
      (max, l) => Math.max(max, l.x + l.width),
      0
    );
    const contentWidth = maxRight + 60;

    const firstId = presets[0]?.id;
    const lastId = presets[presets.length - 1]?.id;

    let targetX = 0;

    if (currentPresetId === firstId) {
      targetX = 0;
    } else if (currentPresetId === lastId) {
      targetX = Math.max(contentWidth - presetBarWidth, 0);
    } else {
      targetX = layout.x + layout.width / 2 - presetBarWidth / 2;
      if (targetX < 0) targetX = 0;
      if (contentWidth > presetBarWidth) {
        const maxScroll = contentWidth - presetBarWidth;
        if (targetX > maxScroll) targetX = maxScroll;
      }
    }

    if (presetScrollRef.current) {
      presetScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, [currentPresetId, presets.length, presetBarWidth]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.cylinderStack}>
          <DayCylinder />
          <NightCylinder />

          <View style={styles.outerButtonFrame}>
            <TouchableOpacity
              style={styles.addCountryButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.buttonText}>+ Add Time Zone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              // intentionally a no-op placeholder (cylinder edit not implemented yet)
              onPress={() => {}}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View
        style={styles.presetContainer}
        onLayout={(e) => setPresetBarWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={presetScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetScrollContent}
        >
          {presets.map((preset) => {
            const isActive = preset.id === currentPresetId;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  isActive && styles.activePresetButton,
                ]}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  presetLayouts.current[preset.id] = { x, width };
                }}
                onPress={() => setCurrentPresetId(preset.id)}
                onLongPress={() => {
                  setHeldPreset(preset);
                  setShowHoldPresetModal(true);
                }}
                delayLongPress={400}
              >
                <Text
                  style={[
                    styles.presetText,
                    isActive && styles.activePresetText,
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.presetAddButton}
            onPress={() => {
              setPresetModalMode('add');
              setPresetModalInitialName('');
              setPresetModalTargetId(null);
              setShowPresetModal(true);
            }}
          >
            <Text style={styles.presetAddText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Add country (cylinder) */}
      <AddCountryModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddCountry}
      />

      {/* Preset add/edit modal */}
      <AddPresetModal
        visible={showPresetModal}
        mode={presetModalMode}
        initialName={presetModalInitialName}
        defaultName={
          presetModalMode === 'add'
            ? defaultPresetNameForAdd
            : defaultPresetNameForEdit || undefined
        }
        onClose={() => setShowPresetModal(false)}
        onUseDefault={() => {
          if (presetModalMode === 'add') {
            // ADD + empty -> default new preset name from addPreset()
            addPreset();
          } else if (
            presetModalMode === 'edit' &&
            presetModalTargetId !== null
          ) {
            // EDIT + empty -> default back to "Preset {id}"
            const defaultName = `Preset ${presetModalTargetId}`;
            renamePreset(presetModalTargetId, defaultName);
          }
          setShowPresetModal(false);
        }}
        onSaveCustom={(name) => {
          if (presetModalMode === 'add') {
            // ADD + non-empty -> custom
            addPreset(name);
          } else if (
            presetModalMode === 'edit' &&
            presetModalTargetId !== null
          ) {
            // EDIT + non-empty -> rename to custom
            renamePreset(presetModalTargetId, name);
          }
          setShowPresetModal(false);
        }}
      />

      {/* Hold-preset modal */}
      <HoldPresetModal
        visible={showHoldPresetModal && heldPreset !== null}
        presetName={heldPreset?.name ?? ''}
        onClose={() => {
          setShowHoldPresetModal(false);
          setHeldPreset(null);
        }}
        onRename={() => {
          if (!heldPreset) return;
          setShowHoldPresetModal(false);
          setPresetModalMode('edit');
          setPresetModalInitialName(heldPreset.name);
          setPresetModalTargetId(heldPreset.id);
          setShowPresetModal(true);
        }}
        onDelete={() => {
          if (!heldPreset) return;
          setShowHoldPresetModal(false);
          setDeleteTarget({
            type: 'preset',
            id: heldPreset.id,
            name: heldPreset.name,
          });
          setHeldPreset(null);
        }}
      />

      {/* Delete confirmation for presets */}
      <DeleteConfirmationModal
        visible={deleteTarget !== null}
        type={deleteTarget?.type ?? 'preset'}
        name={deleteTarget?.name ?? ''}
        onConfirm={() => {
          if (deleteTarget && deleteTarget.type === 'preset') {
            const deletedId = deleteTarget.id;
            let nextPresetId: number | null = null;

            if (deletedId === currentPresetId) {
              const idx = presets.findIndex((p) => p.id === deletedId);
              if (idx > 0) {
                // choose preset to the left
                nextPresetId = presets[idx - 1].id;
              } else if (idx === 0 && presets.length > 1) {
                // if it was the first, choose what becomes first after removal
                nextPresetId = presets[1].id;
              }
            }

            deletePreset(deletedId);

            if (nextPresetId !== null) {
              setCurrentPresetId(nextPresetId);
            }
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function DayCylinder() {
  return (
    <View style={styles.cylinderContainer}>
      <Image
        source={{
          uri: 'https://api.builder.io/api/v1/image/assets/TEMP/46198d807f84afdb013a99d6422b09267436083a?width=486',
        }}
        style={styles.dayCylinderImage}
      />
    </View>
  );
}

function NightCylinder() {
  return (
    <View style={styles.cylinderContainer}>
      <Image
        source={{
          uri: 'https://api.builder.io/api/v1/image/assets/TEMP/e7514c887d7d13f9270b6ff1e5297b61d73225b3?width=486',
        }}
        style={styles.nightCylinderImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 20,
    flexGrow: 1,
  },
  cylinderStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  cylinderContainer: {
    width: 280,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -5, // only a little closer together
  },
  dayCylinderImage: {
    width: 350, // a bit larger than before
    height: 125,
    resizeMode: 'contain',
  },
  nightCylinderImage: {
    width: 338, // a bit larger than before
    height: 118,
    resizeMode: 'contain',
  },

  // Button row (matches map.tsx)
  outerButtonFrame: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 5,
    marginTop: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  addCountryButton: {
    height: 35,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FFF',
    minWidth: 150,
  },
  editButton: {
    height: 35,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FFF',
    minWidth: 100,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    flexShrink: 1,
  },

  presetContainer: {
    paddingHorizontal: 25,
    paddingBottom: 50,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  presetScrollContent: {
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  presetButton: {
    height: 35,
    backgroundColor: '#FFF',
    borderRadius: 50,
    paddingHorizontal: 25.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePresetButton: {
    backgroundColor: '#AED6F3',
  },
  presetText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  activePresetText: {
    color: '#000',
  },
  presetAddButton: {
    width: 40,
    height: 35,
    backgroundColor: '#FFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetAddText: {
    color: '#000',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

export {};
