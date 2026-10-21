// app/(tabs)/map.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AddCountryModal from '../components/AddCountryModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AddPresetModal from '../components/AddPresetModal';
import HoldPresetModal from '../components/HoldPresetModal';
import {
  useCountryPresetStore,
  Country,
  Preset,
} from './_layout';

const HOURS = Array.from({ length: 25 }, (_, i) =>
  (i % 24).toString().padStart(2, '0')
);

// Geometry of the time bar (must match styles below)
const TIME_BAR_WIDTH = 1225; // width of timeBarContainer
const TICK_WIDTH = 25; // width of each timeMarker
const TICK_GAP = 25; // gap between markers (timeBarContainer.gap)
const SLOT_WIDTH = TICK_WIDTH + TICK_GAP; // distance between hour centers

// center of "00" as a percentage of the bar
const FIRST_CENTER_PERCENT = (TICK_WIDTH / 2 / TIME_BAR_WIDTH) * 100;
// distance between centers of consecutive hours as a percentage
const SLOT_PERCENT = (SLOT_WIDTH / TIME_BAR_WIDTH) * 100;

type SleepSegment = { start: number; length: number }; // start in column space 0–23

// --- Helpers for Match logic ----------------------------------------

const hourToColumnIndex = (localHour: number, timezoneDiff: number) =>
  (localHour - timezoneDiff + 24) % 24;

const buildSleepMaskForCountry = (
  country: Country,
  baseTimezoneId: number
): boolean[] => {
  const mask = Array(24).fill(false);
  const { sleepStart, sleepEnd, timezoneId } = country;

  let totalLength = (sleepEnd - sleepStart + 24) % 24;
  if (totalLength === 0) return mask;

  const timezoneDiff = timezoneId - baseTimezoneId;
  const startCol = hourToColumnIndex(sleepStart, timezoneDiff);

  for (let i = 0; i < totalLength; i++) {
    const col = (startCol + i) % 24;
    mask[col] = true;
  }

  return mask;
};

const buildMatchSegments = (
  countries: Country[],
  baseTimezoneId: number
): SleepSegment[] => {
  if (countries.length === 0) return [];

  const sleepMasks = countries.map((c) =>
    buildSleepMaskForCountry(c, baseTimezoneId)
  );
  const columns = 24;
  const matchMask = Array(columns).fill(true);

  // A column is "match" only if NO country is sleeping there
  for (let h = 0; h < columns; h++) {
    for (let c = 0; c < countries.length; c++) {
      if (sleepMasks[c][h]) {
        matchMask[h] = false;
        break;
      }
    }
  }

  // Convert boolean mask to contiguous segments (can be 0,1,2,... segments)
  const segments: SleepSegment[] = [];
  let currentStart: number | null = null;
  let length = 0;

  for (let h = 0; h <= columns; h++) {
    const isMatch = h < columns ? matchMask[h] : false; // sentinel false to flush last segment

    if (isMatch) {
      if (currentStart === null) {
        currentStart = h;
        length = 1;
      } else {
        length++;
      }
    } else if (currentStart !== null) {
      segments.push({ start: currentStart, length });
      currentStart = null;
      length = 0;
    }
  }

  return segments;
};

export default function MapScreen() {
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit target: when not null, we are editing this country
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

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

  // Generic delete target (country or preset)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'country' | 'preset';
    id: number;
    name: string;
  } | null>(null);

  const {
    countries,
    presets,
    currentPresetId,
    addCountryToCurrentPreset,
    deleteCountryFromCurrentPreset,
    updateCountry,
    setCurrentPresetId,
    addPreset,
    renamePreset,
    deletePreset,
    isEditingMap,
    setIsEditingMap,
    getNextPresetDefaultName,
  } = useCountryPresetStore();

  const currentPreset = presets.find((p) => p.id === currentPresetId) ?? null;

  const defaultPresetNameForAdd = getNextPresetDefaultName();
  const defaultPresetNameForEdit =
    presetModalTargetId !== null ? `Preset ${presetModalTargetId}` : '';

  // Build ordered list of Country objects for the current preset
  const countriesForPreset: Country[] = currentPreset
    ? currentPreset.countryIds
        .map((id) => countries.find((c) => c.id === id) || null)
        .filter((c): c is Country => c !== null)
    : [];

  const hasCountries = countriesForPreset.length > 0;
  const baseTimezoneId = hasCountries ? countriesForPreset[0].timezoneId : 0;
  const matchSegments = hasCountries
    ? buildMatchSegments(countriesForPreset, baseTimezoneId)
    : [];

  const handleDeleteCountry = (countryId: number) => {
    deleteCountryFromCurrentPreset(countryId);
  };

  const renderTimeBarRow = (country: Country, index: number) => {
    const timezoneDiff = country.timezoneId - baseTimezoneId;

    const getSleepSegments = (): SleepSegment[] => {
      const { sleepStart, sleepEnd } = country;

      let totalLength = (sleepEnd - sleepStart + 24) % 24;
      if (totalLength === 0) return [];

      const startCol = hourToColumnIndex(sleepStart, timezoneDiff);

      if (startCol + totalLength <= 24) {
        return [{ start: startCol, length: totalLength }];
      }

      const firstLength = 24 - startCol;
      const secondLength = totalLength - firstLength;

      return [
        { start: startCol, length: firstLength },
        { start: 0, length: secondLength },
      ];
    };

    const getSleepWidth = (segment: SleepSegment) => {
      return segment.length * SLOT_PERCENT;
    };

    const getSleepLeft = (segment: SleepSegment) => {
      const columnIndex = segment.start;
      return FIRST_CENTER_PERCENT + columnIndex * SLOT_PERCENT;
    };

    const sleepSegments = getSleepSegments();

    return (
      <View key={country.id ?? index} style={styles.countryRow}>
        {/* Empty name frame (same height as name) so spacing matches NameLayer */}
        <View style={styles.countryNameContainer} />

        {/* Actual timeline row */}
        <View style={styles.columnContent}>
          <View style={styles.timeBarContainer}>
            {/* Sleep segments */}
            {sleepSegments.map((segment, segIndex) => (
              <View
                key={`s-${country.id}-${segIndex}`}
                style={[
                  styles.sleepFrame,
                  {
                    left: `${getSleepLeft(segment)}%`,
                    width: `${getSleepWidth(segment)}%`,
                  },
                ]}
              />
            ))}

            {/* Match segments: same for every row, based on ALL countries */}
            {matchSegments.map((segment, segIndex) => (
              <View
                key={`m-${segIndex}`}
                style={[
                  styles.matchFrame,
                  {
                    left: `${getSleepLeft(segment)}%`,
                    width: `${getSleepWidth(segment)}%`,
                  },
                ]}
              />
            ))}

            {HOURS.map((_, i) => {
              const offsetHour = ((i + timezoneDiff + 24) % 24)
                .toString()
                .padStart(2, '0');
              return (
                <View key={i} style={styles.timeMarker}>
                  <Text style={styles.timeText}>{offsetHour}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
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
    const contentWidth = maxRight + 60; // + fudge for "+" button

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

  const isEditModal = editingCountry !== null;
  const isCountryModalVisible = showAddModal || isEditModal;

  return (
    <View style={styles.container}>
      <View style={styles.mapOuterFrame}>
        {/* Vertical scroll inside fixed viewport */}
        <ScrollView
          style={styles.verticalScroll}
          contentContainerStyle={styles.verticalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mapContent}>
            {hasCountries ? (
              <>
                {/* Back layer: names + empty row spacers + (optional) fake button spacer */}
                <View style={styles.nameLayer}>
                  <View style={styles.contentFrame}>
                    {countriesForPreset.map((country) => (
                      <View key={country.id} style={styles.countryRow}>
                        <View style={styles.countryNameContainer}>
                          <Text style={styles.countryName}>{country.name}</Text>
                        </View>
                        {/* Empty row area to match the timeline row height */}
                        <View style={styles.rowSpacer} />
                      </View>
                    ))}
                    {/* Spacer to match real buttons row ONLY when not editing */}
                    {!isEditingMap && <View style={styles.buttonsSpacer} />}
                  </View>
                </View>

                {/* Front layer: horizontally scrollable rows + buttons (only when not editing) */}
                <View style={styles.rowLayer}>
                  <View style={styles.contentFrame}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.rowsScrollView}
                    >
                      <View style={styles.rowsScrollContent}>
                        {countriesForPreset.map((country, index) =>
                          renderTimeBarRow(country, index)
                        )}
                      </View>
                    </ScrollView>

                    {/* Hide Add / Edit buttons in edit mode */}
                    {!isEditingMap && (
                      <View style={styles.outerButtonFrame}>
                        <TouchableOpacity
                          style={styles.addCountryButton}
                          onPress={() => setShowAddModal(true)}
                        >
                          <Text style={styles.buttonText}>+ Add Time Zone</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            if (hasCountries) {
                              setIsEditingMap(true);
                            }
                          }}
                        >
                          <Text style={styles.buttonText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* THIRD LAYER: edit overlay (delete left, edit right), independent of horizontal scroll */}
                {isEditingMap && (
                  <View
                    pointerEvents="box-none"
                    style={styles.editOverlayLayer}
                  >
                    <View style={styles.contentFrame}>
                      {countriesForPreset.map((country) => (
                        <View key={country.id} style={styles.editOverlayRow}>
                          {/* Delete on the left */}
                          <TouchableOpacity
                            style={styles.deleteBubble}
                            onPress={() =>
                              setDeleteTarget({
                                type: 'country',
                                id: country.id,
                                name: country.name,
                              })
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteBubbleText}>−</Text>
                          </TouchableOpacity>

                          <View style={{ flex: 1 }} />

                          {/* Edit on the right */}
                          <TouchableOpacity
                            style={styles.editPencilButton}
                            onPress={() => {
                              setEditingCountry(country);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.pencilInnerBubble}>
                              <Svg
                                width={25}
                                height={25}
                                viewBox="0 0 25 25"
                                fill="none"
                              >
                                <Path
                                  d="M12.4998 8.33349L4.1665 16.6668V20.8335L8.33317 20.8335L16.6665 12.5001M12.4998 8.33349L15.488 5.34531L15.4898 5.34354C15.9011 4.93221 16.1072 4.72617 16.3447 4.64901C16.5539 4.58103 16.7793 4.58103 16.9885 4.64901C17.2258 4.72612 17.4316 4.93192 17.8423 5.34267L19.6546 7.15496C20.0672 7.56747 20.2735 7.77383 20.3508 8.01167C20.4188 8.22088 20.4187 8.44624 20.3508 8.65545C20.2735 8.89313 20.0675 9.09917 19.6556 9.5111L19.6547 9.51198L16.6665 12.5001M12.4998 8.33349L16.6665 12.5001"
                                  stroke="black"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : isEditingMap ? (
              // Special state: editing, but no countries in this preset
              <View style={styles.emptyEditContainer}>
                <View style={styles.emptyEditBox}>
                  <Text style={styles.emptyEditText}>
                    This preset doesn&apos;t have any countries.
                  </Text>
                  <Text style={styles.emptyEditSubText}>
                    Tap &quot;Close&quot; below to exit edit mode.
                  </Text>
                </View>
              </View>
            ) : (
              // Placeholder when there are no countries in the current preset
              <View style={styles.placeholderContainer}>
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderText}>
                    Add a country to display
                  </Text>
                </View>

                <View style={styles.outerButtonFrame}>
                  <TouchableOpacity
                    style={styles.addCountryButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Text style={styles.buttonText}>+ Add Country</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} disabled>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Presets / Cancel Edit footer */}
      <View
        style={styles.outerPresetFrame}
        onLayout={(e) => setPresetBarWidth(e.nativeEvent.layout.width)}
      >
        {isEditingMap ? (
          <View style={styles.editFooter}>
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={() => setIsEditingMap(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelEditText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            ref={presetScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.innerPresetFrame}
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
        )}
      </View>

      {/* Country add/edit modal */}
      <AddCountryModal
        visible={isCountryModalVisible}
        mode={isEditModal ? 'edit' : 'add'}
        initialData={
          isEditModal && editingCountry
            ? {
                timezoneId: editingCountry.timezoneId,
                name: editingCountry.name,
                bedTime: editingCountry.sleepStart,
                wakeUpTime: editingCountry.sleepEnd,
              }
            : undefined
        }
        onClose={() => {
          setShowAddModal(false);
          setEditingCountry(null);
        }}
        onSave={(data) => {
          if (editingCountry) {
            updateCountry(editingCountry.id, data);
          } else {
            addCountryToCurrentPreset(data);
          }
          setShowAddModal(false);
          setEditingCountry(null);
        }}
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
            // field empty in ADD mode -> create with default name from addPreset()
            addPreset();
          } else if (
            presetModalMode === 'edit' &&
            presetModalTargetId !== null
          ) {
            // field empty in EDIT mode -> reset to this preset's default name
            const defaultName = `Preset ${presetModalTargetId}`;
            renamePreset(presetModalTargetId, defaultName);
          }
          setShowPresetModal(false);
        }}
        onSaveCustom={(name) => {
          if (presetModalMode === 'add') {
            // non-empty in ADD -> use as custom name
            addPreset(name);
          } else if (
            presetModalMode === 'edit' &&
            presetModalTargetId !== null
          ) {
            // non-empty in EDIT -> rename to custom
            renamePreset(presetModalTargetId, name);
          }
          setShowPresetModal(false);
        }}
      />

      {/* Hold-preset modal (press + hold on preset pill) */}
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

      <DeleteConfirmationModal
        visible={deleteTarget !== null}
        type={deleteTarget?.type ?? 'country'}
        name={deleteTarget?.name ?? ''}
        onConfirm={() => {
          if (!deleteTarget) return;

          if (deleteTarget.type === 'country') {
            // Country deletion unchanged
            handleDeleteCountry(deleteTarget.id);
          } else if (deleteTarget.type === 'preset') {
            // Compute which preset should become active *before* deletion
            const deletedId = deleteTarget.id;
            let nextPresetId: number | null = null;

            if (deletedId === currentPresetId) {
              const idx = presets.findIndex((p) => p.id === deletedId);
              if (idx > 0) {
                // Select the preset to the left
                nextPresetId = presets[idx - 1].id;
              } else if (idx === 0 && presets.length > 1) {
                // If it's the first one, fall back to what is now first after removal
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapOuterFrame: {
    height: 646,
    paddingHorizontal: 30,
    paddingVertical: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  verticalScroll: {
    width: '100%',
  },
  verticalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mapContent: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentFrame: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  countryRow: {
    position: 'relative',
    height: 82,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  countryNameContainer: {
    height: 30,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryName: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  rowSpacer: {
    height: 50,
    width: '100%',
  },
  nameLayer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLayer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsSpacer: {
    height: 40,
    width: '100%',
  },
  rowsScrollView: {
    width: '100%',
  },
  rowsScrollContent: {
    minWidth: 1225,
    gap: 15,
  },
  columnContent: {
    height: 50,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    borderRadius: 10,
    backgroundColor: '#FFF',
    minWidth: 1225,
  },
  timeBarContainer: {
    flexDirection: 'row',
    height: 50,
    width: 1225,
    position: 'relative',
    gap: 25,
  },
  sleepFrame: {
    position: 'absolute',
    height: 50,
    paddingTop: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 5,
    backgroundColor: '#FF7D7D',
  },
  matchFrame: {
    position: 'absolute',
    height: 50,
    paddingTop: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 5,
    backgroundColor: '#99FF9D',
  },
  timeMarker: {
    width: 25,
    height: 50,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timeText: {
    color: '#111',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 22,
    paddingBottom: 3,
  },
  outerButtonFrame: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 5,
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

  // THIRD LAYER: edit overlay
  editOverlayLayer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlayRow: {
    height: 82,
    width: '100%',
    flexDirection: 'row',
  },

  // Delete bubble (colors + shadow like pencil bubble, red minus)
  deleteBubble: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#b4b4b4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    left: 0,
    top: 13,
  },
  deleteBubbleText: {
    color: '#d45151ff',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },

  // Edit pencil bubble (from Builder)
  editPencilButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    right: 0,
    top: 13,
  },
  pencilInnerBubble: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#b4b4b4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  outerPresetFrame: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 25,
    paddingBottom: 50,
    paddingTop: 10,
  },
  innerPresetFrame: {
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  presetButton: {
    height: 35,
    paddingHorizontal: 25.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FFF',
  },
  activePresetButton: {
    backgroundColor: '#AED6F3',
  },
  presetText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  activePresetText: {
    color: '#000',
  },
  presetAddButton: {
    width: 40,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FFF',
  },
  presetAddText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Edit footer
  editFooter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditButton: {
    height: 35,
    backgroundColor: '#FFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 38,
  },
  cancelEditText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },

  placeholderContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  placeholderBox: {
    height: 82,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderText: {
    color: '#AAA',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Empty state *while editing* (no countries)
  emptyEditContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEditBox: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#111',
    maxWidth: 320,
  },
  emptyEditText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyEditSubText: {
    color: '#AAA',
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
  },
});
