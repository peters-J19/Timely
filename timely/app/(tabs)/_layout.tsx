// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React, {
  createContext,
  useContext,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import InfoModal from '../components/InfoModal';

/**
 * Shared data types
 */
export interface Country {
  id: number;
  name: string;
  timezoneId: number;   // -12..12 from AddCountryModal
  sleepStart: number;   // 0–23 (bed time)
  sleepEnd: number;     // 0–23 (wake time)
}

export interface Preset {
  id: number;
  name: string;
  countryIds: number[]; // ordered list of country IDs for this preset
}

export interface AddCountryPayload {
  timezoneId: number;   // -12..12 from modal
  name: string;
  bedTime: number;      // 0–23
  wakeUpTime: number;   // 0–23
}

interface CountryPresetContextValue {
  countries: Country[];
  presets: Preset[];
  currentPresetId: number;
  addCountryToCurrentPreset: (data: AddCountryPayload) => void;
  deleteCountryFromCurrentPreset: (countryId: number) => void;
  updateCountry: (countryId: number, data: AddCountryPayload) => void;
  setCurrentPresetId: (id: number) => void;
  addPreset: (name?: string) => void;   // supports optional custom name
  renamePreset: (presetId: number, name: string) => void;
  deletePreset: (presetId: number) => void;
  getNextPresetDefaultName: () => string;

  // map edit-mode
  isEditingMap: boolean;
  setIsEditingMap: (editing: boolean) => void;
}

/**
 * Context + hook
 */
const CountryPresetContext = createContext<CountryPresetContextValue | undefined>(
  undefined
);

export function useCountryPresetStore() {
  const ctx = useContext(CountryPresetContext);
  if (!ctx) {
    throw new Error(
      'useCountryPresetStore must be used within the TabLayout CountryPresetContext.Provider'
    );
  }
  return ctx;
}

/**
 * Helper: compute next preset ID using your strategy
 *
 * - If no presets -> 1
 * - If maxId < 20 -> maxId + 1
 * - If maxId >= 20:
 *    - If all IDs 1..maxId are used -> maxId + 1
 *    - Else -> smallest missing ID in 1..maxId
 */
function computeNextPresetId(presets: Preset[]): number {
  if (presets.length === 0) {
    return 1;
  }

  const ids = presets.map((p) => p.id);
  const maxId = Math.max(...ids);

  // Below 20: just keep incrementing
  if (maxId < 20) {
    return maxId + 1;
  }

  const used = new Set(ids);

  // If all IDs from 1..maxId are used, then no gaps => keep incrementing
  if (used.size === maxId) {
    return maxId + 1;
  }

  // Otherwise, find the smallest missing ID
  for (let i = 1; i <= maxId; i++) {
    if (!used.has(i)) {
      return i;
    }
  }

  // Fallback (shouldn't be hit, but just in case)
  return maxId + 1;
}

/**
 * Top tab bar
 */
interface TabBarProps {
  onShowCylinderInfo: () => void;
  onShowMapInfo: () => void;
}

function TabBar({ onShowCylinderInfo, onShowMapInfo }: TabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isEditingMap } = useCountryPresetStore();

  const isOnCylinder =
    pathname.endsWith('/cylinder') || pathname === '/cylinder';
  const isOnMap = pathname.endsWith('/map') || pathname === '/map';

  return (
    <View style={styles.topTabBar}>
      {/* Row with tabs in the exact same layout as before */}
      <View style={styles.tabsRow}>
        {/* Cylinder tab wrapper – same size as old tab, but now relative */}
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, isOnCylinder && styles.activeTab]}
            onPress={() => router.push('/(tabs)/cylinder')}
            disabled={isEditingMap}
          >
            <Text style={[styles.tabText, isOnCylinder && styles.activeTabText]}>
              Cylinder
            </Text>
          </TouchableOpacity>

          {isOnCylinder && (
            <TouchableOpacity
              style={styles.cylinderInfoButton}
              onPress={onShowCylinderInfo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.infoBubble}>
                <Text style={styles.infoBubbleText}>i</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Map tab wrapper – same size as old tab, but now relative */}
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, isOnMap && styles.activeTab]}
            onPress={() => router.push('/(tabs)/map')}
            disabled={isEditingMap}
          >
            <Text style={[styles.tabText, isOnMap && styles.activeTabText]}>
              Map
            </Text>
          </TouchableOpacity>

          {isOnMap && (
            <TouchableOpacity
              style={styles.mapInfoButton}
              onPress={onShowMapInfo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.infoBubble}>
                <Text style={styles.infoBubbleText}>i</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Layout + shared data provider
 */
export default function TabLayout() {
  // Master list of all countries (across all presets)
  const [countries, setCountries] = useState<Country[]>([]);

  // Start with a single preset following your naming rule
  const [presets, setPresets] = useState<Preset[]>([
    { id: 1, name: 'Preset 1', countryIds: [] },
  ]);

  const [currentPresetId, setCurrentPresetId] = useState<number>(1);

  // ID counter for countries (not user-visible, so can keep simple increment)
  const [nextCountryId, setNextCountryId] = useState<number>(1);

  // map edit-mode flag
  const [isEditingMap, setIsEditingMap] = useState(false);

  // Info modal for the two main tabs
  const [tabInfoVariant, setTabInfoVariant] = useState<'cylinderTab' | 'mapTab' | null>(null);

  const addCountryToCurrentPreset = (data: AddCountryPayload) => {
    const newId = nextCountryId;

    // 1) Add to global countries list
    setCountries((prev) => [
      ...prev,
      {
        id: newId,
        name: data.name,
        timezoneId: data.timezoneId,
        sleepStart: data.bedTime,
        sleepEnd: data.wakeUpTime,
      },
    ]);

    // 2) Append id into the current preset’s ordered list
    setPresets((prevPresets) => {
      const idx = prevPresets.findIndex((p) => p.id === currentPresetId);
      if (idx === -1) return prevPresets;

      const preset = prevPresets[idx];
      const updatedPreset: Preset = {
        ...preset,
        countryIds: [...preset.countryIds, newId],
      };

      const copy = [...prevPresets];
      copy[idx] = updatedPreset;
      return copy;
    });

    // 3) Increment ID counter
    setNextCountryId((prev) => prev + 1);
  };

  const deleteCountryFromCurrentPreset = (countryId: number) => {
    // 1) Remove the countryId from the *current* preset
    setPresets((prevPresets) => {
      const idx = prevPresets.findIndex((p) => p.id === currentPresetId);
      if (idx === -1) return prevPresets;

      const preset = prevPresets[idx];
      const updatedPreset: Preset = {
        ...preset,
        countryIds: preset.countryIds.filter((id) => id !== countryId),
      };

      const copy = [...prevPresets];
      copy[idx] = updatedPreset;
      return copy;
    });

    // 2) Always remove the country from the global list.
    //    By design, each countryId is "owned" by a single preset.
    setCountries((prevCountries) =>
      prevCountries.filter((c) => c.id !== countryId)
    );
  };

  const updateCountry = (countryId: number, data: AddCountryPayload) => {
    setCountries((prevCountries) =>
      prevCountries.map((c) =>
        c.id === countryId
          ? {
              ...c,
              name: data.name,
              timezoneId: data.timezoneId,
              sleepStart: data.bedTime,
              sleepEnd: data.wakeUpTime,
            }
          : c
      )
    );
  };

  // Supports custom name, with fallback to default "Preset {id}"
  const addPreset = (name?: string) => {
    setPresets((prev) => {
      const newId = computeNextPresetId(prev);
      const defaultName = `Preset ${newId}`;
      const newPreset: Preset = {
        id: newId,
        name: (name && name.trim()) || defaultName,
        countryIds: [],
      };

      // Select the newly created preset
      setCurrentPresetId(newId);

      return [...prev, newPreset];
    });
  };

  // Use the same logic so placeholder matches the real default
  const getNextPresetDefaultName = () => {
    const newId = computeNextPresetId(presets);
    return `Preset ${newId}`;
  };

  const renamePreset = (presetId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? {
              ...p,
              name: trimmed,
            }
          : p
      )
    );
  };

  const deletePreset = (presetId: number) => {
    setPresets((prevPresets) => {
      const index = prevPresets.findIndex((p) => p.id === presetId);
      if (index === -1) return prevPresets;

      const target = prevPresets[index];

      // Delete all countries that belong to this preset
      const idsToDelete = new Set(target.countryIds);
      setCountries((prevCountries) =>
        prevCountries.filter((c) => !idsToDelete.has(c.id))
      );

      const remaining = prevPresets.filter((p) => p.id !== presetId);

      if (remaining.length > 0) {
        // If we deleted the current preset, move selection to the neighbor
        setCurrentPresetId((prevCurrent) => {
          if (prevCurrent !== presetId) {
            // Deleted some other preset: keep current selection
            return prevCurrent;
          }

          // Deleted the current one:
          // - Prefer the preset to the left (index - 1)
          // - If there was no left neighbor (index === 0), pick the new first
          if (index > 0) {
            return remaining[index - 1].id;
          }
          return remaining[0].id;
        });

        return remaining;
      } else {
        // If somehow all presets are deleted, create a fresh default one
        const newPreset: Preset = {
          id: 1,
          name: 'Preset 1',
          countryIds: [],
        };

        setCurrentPresetId(newPreset.id);

        return [newPreset];
      }
    });
  };

  const contextValue: CountryPresetContextValue = {
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
    getNextPresetDefaultName,
    isEditingMap,
    setIsEditingMap,
  };

  return (
    <CountryPresetContext.Provider value={contextValue}>
      <View style={styles.container}>
        <TabBar
          onShowCylinderInfo={() => setTabInfoVariant('cylinderTab')}
          onShowMapInfo={() => setTabInfoVariant('mapTab')}
        />

        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="cylinder" />
          <Tabs.Screen name="map" />
        </Tabs>

        {/* Info modal for the main tabs */}
        <InfoModal
          visible={tabInfoVariant !== null}
          variant={tabInfoVariant === 'mapTab' ? 'mapTab' : 'cylinderTab'}
          onClose={() => setTabInfoVariant(null)}
        />
      </View>
    </CountryPresetContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topTabBar: {
    paddingHorizontal: 10,
    paddingTop: 64,
    paddingBottom: 10,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  // Row that keeps the tabs in the exact same layout as before
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  // Wrapper for each tab, matches the old tab size and acts as a relative anchor
  tabWrapper: {
    width: 125,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tab: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FFF',
  },
  activeTab: {
    backgroundColor: '#AED6F3',
  },
  tabText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  activeTabText: {
    color: '#000',
  },

  // Info icons positioned absolutely so they don't affect tab layout
  cylinderInfoButton: {
    position: 'absolute',
    left: -45,
    top: '50%',
    transform: [{ translateY: -13 }],
  },
  mapInfoButton: {
    position: 'absolute',
    right: -45,
    top: '50%',
    transform: [{ translateY: -13 }],
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
});
