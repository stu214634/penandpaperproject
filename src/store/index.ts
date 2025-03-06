import { create } from 'zustand';
import { Howl } from 'howler';
import { AssetManager } from '../services/assetManager';

// Get data from IndexedDB asynchronously, with empty arrays as fallbacks
const getLocationsData = async () => {
  const customLocations = await AssetManager.getDataObject<CustomLocation[]>('locations.json');
  return customLocations || [];
};

const getCharactersData = async () => {
  const customCharacters = await AssetManager.getDataObject<Character[]>('characters.json');
  return customCharacters || [];
};

// Initialize with empty data, will be populated after async loading
const initialLocations: CustomLocation[] = [];
const initialCharacters: Character[] = [];

export interface CustomLocation {
  id: string;
  name: string;
  description: string;
  backgroundMusic?: string;
  entrySound?: string;
  mixWithParent?: boolean;
  coordinates?: [number, number];
  inventory?: Item[];
  sublocations?: CustomLocation[];
  parentLocationId?: string;
  connectedLocations?: string[];
}

interface Character {
  id: string;
  name: string;
  description: string;
  type: 'npc' | 'merchant';
  inventory?: Item[];
}

interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price?: number;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  howl?: Howl;
}

interface ActiveTrack {
  id: string;
  howl: Howl;
  name: string;
  volume: number;
  isMuted: boolean;
  locationId: string;
}

interface StoreState {
  locations: CustomLocation[];
  mapConfig: {
    worldWidth: number;
    worldHeight: number;
  };
  characters: Character[];
  audioTracks: AudioTrack[];
  currentLocation?: CustomLocation;
  currentHowl: Howl | null;
  volume: number;
  isPlaying: boolean;
  activeTracks: ActiveTrack[];
  hasAssets: boolean;
  isLoading: boolean;
  addLocation: (location: Omit<CustomLocation, 'id'>) => void;
  updateLocation: (locationId: string, locationData: Partial<Omit<CustomLocation, 'id'>>) => void;
  deleteLocation: (locationId: string) => void;
  addCharacter: (character: Omit<Character, 'id'>) => void;
  updateCharacter: (characterId: string, characterData: Partial<Omit<Character, 'id'>>) => void;
  deleteCharacter: (characterId: string) => void;
  addAudioTrack: (track: Omit<AudioTrack, 'id'>) => void;
  setCurrentLocation: (locationId: string) => void;
  playTrack: (url: string, options?: { replace?: boolean, locationId?: string }) => void;
  stopTrack: () => void;
  getSublocationsByParentId: (parentLocationId: string) => CustomLocation[];
  getAllTopLevelLocations: () => CustomLocation[];
  setVolume: (volume: number) => void;
  toggleMuteTrack: (trackId: string) => void;
  stopIndividualTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  refreshAssets: () => void;
  saveDataToIndexedDB: () => Promise<{ success: boolean; message: string }>;
  exportToZip: () => Promise<{ success: boolean; message: string; url?: string }>;
}

export const useStore = create<StoreState>((set, get) => {
  // Initialize assets asynchronously
  const initializeStore = async () => {
    try {
      set({ isLoading: true });
      
      // Check if any assets exist
      const hasAudioAssets = await AssetManager.hasAssets('audio');
      const hasImageAssets = await AssetManager.hasAssets('images');
      const hasDataAssets = await AssetManager.hasAssets('data');
      
      const hasAssets = hasAudioAssets || hasImageAssets || hasDataAssets;
      
      // If assets exist, load them
      if (hasAssets) {
        const locations = await getLocationsData();
        const characters = await getCharactersData();
        
        set({
          locations,
          characters,
          hasAssets,
          isLoading: false
        });
      } else {
        set({
          hasAssets,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error initializing store:', error);
      set({ isLoading: false });
    }
  };
  
  // Start loading assets
  initializeStore();
  
  return {
    locations: initialLocations,
    mapConfig: {
      worldWidth: 1000,
      worldHeight: 1000
    },
    characters: initialCharacters,
    audioTracks: [],
    currentLocation: undefined,
    currentHowl: null,
    volume: 0.7,
    isPlaying: false,
    activeTracks: [],
    hasAssets: false,
    isLoading: true,

    addLocation: (location) => {
      const newLocation = { ...location, id: crypto.randomUUID() };
      set((state) => ({
        locations: [...state.locations, newLocation],
      }));
    },

    updateLocation: (locationId, locationData) => {
      set((state) => ({
        locations: state.locations.map(loc => 
          loc.id === locationId 
            ? { ...loc, ...locationData } 
            : loc
        )
      }));
    },
    
    deleteLocation: (locationId) => {
      set((state) => {
        // Filter out the location and any sublocations
        const removeLocationAndSublocations = (locations: CustomLocation[], idToRemove: string): CustomLocation[] => {
          return locations.filter(loc => {
            if (loc.id === idToRemove) return false;
            
            // If this location has sublocations, filter those as well
            if (loc.sublocations && loc.sublocations.length > 0) {
              loc.sublocations = removeLocationAndSublocations(loc.sublocations, idToRemove);
            }
            
            return true;
          });
        };
        
        return { 
          locations: removeLocationAndSublocations(state.locations, locationId),
          // Clear current location if it was the deleted one
          currentLocation: state.currentLocation?.id === locationId 
            ? undefined 
            : state.currentLocation
        };
      });
    },

    addCharacter: (character) => {
      const newCharacter = { ...character, id: crypto.randomUUID() };
      set((state) => ({
        characters: [...state.characters, newCharacter],
      }));
    },
    
    updateCharacter: (characterId, characterData) => {
      set((state) => ({
        characters: state.characters.map(char => 
          char.id === characterId 
            ? { ...char, ...characterData } 
            : char
        )
      }));
    },
    
    deleteCharacter: (characterId) => {
      set((state) => ({
        characters: state.characters.filter(char => char.id !== characterId)
      }));
    },

    addAudioTrack: (track) => {
      const newTrack = {
        ...track,
        id: crypto.randomUUID(),
        howl: new Howl({ src: [track.url], html5: true }),
      };
      set((state) => ({
        audioTracks: [...state.audioTracks, newTrack],
      }));
    },

    setCurrentLocation: (locationId) => {
      const location = get().locations.find((loc) => loc.id === locationId);
      set({ currentLocation: location });
    },

    setVolume: (volume) => {
      const { currentHowl, activeTracks } = get();
      
      console.log(`Setting volume to ${volume} for ${activeTracks.length} active tracks`);
      
      // Update volume for all active tracks that aren't individually muted
      activeTracks.forEach(track => {
        if (!track.isMuted) {
          track.howl.volume(volume);
        }
      });
      
      // Update volume for the main currentHowl if it exists and isn't in activeTracks
      if (currentHowl && !activeTracks.some(t => t.howl === currentHowl)) {
        currentHowl.volume(volume);
      }
      
      // Update the volume state and each track's volume property
      set(state => ({
        volume,
        activeTracks: state.activeTracks.map(track => ({
          ...track,
          volume: track.isMuted ? track.volume : volume // Keep original volume if muted
        }))
      }));
    },

    playTrack: async (url: string, options?: { replace?: boolean, locationId?: string }) => {
      const { currentHowl, volume, activeTracks, locations } = get();
      const replace = options?.replace ?? true;
      const locationId = options?.locationId || '';

      // Extract just the filename without the path
      const trackName = url.split('/').pop() || 'Unknown track';

      // Get the asset URL from the AssetManager (handles IndexedDB lookup)
      const assetUrl = await AssetManager.getAssetUrl('audio', trackName);
      
      // If no asset URL was returned (file not found), skip playing
      if (!assetUrl) {
        console.warn(`Audio file not found: ${trackName}`);
        return;
      }

      // Prevent duplicates
      if (activeTracks.some(t => t.locationId === locationId)) {
        console.log('Track for this location already playing, skipping');
        return;
      }

      // Find the current location to understand parent-child relationships
      const currentLocation = locations.find(loc => loc.id === locationId);
      const isSubLocation = !!currentLocation?.parentLocationId;
      
      // For mixWithParent (replace=false) situations:
      if (!replace) {
        console.log("Keeping parent track, this is a mixed sublocation");
        
        // We want to keep the parent track but stop any other sublocation tracks
        // Find the parent location ID for filtering
        const parentLocationId = currentLocation?.parentLocationId;
        
        // Find tracks to stop: any sublocation tracks that are not from the parent or this location
        const tracksToStop = activeTracks.filter(track => {
          // If this track is for this location, keep it
          if (track.locationId === locationId) return false;
          
          // If this track is for the parent location, keep it
          if (track.locationId === parentLocationId) return false;
          
          // If this is not a location-specific track (e.g. main theme), keep it
          if (!track.locationId) return false;
          
          // Otherwise, stop it
          return true;
        });
        
        // Stop the identified tracks
        tracksToStop.forEach(track => {
          console.log(`Stopping track: ${track.name} for location: ${track.locationId}`);
          track.howl.fade(track.volume, 0, 1000);
          track.howl.once('fade', () => track.howl.stop());
        });
        
        // Filter the active tracks list
        set({ 
          activeTracks: activeTracks.filter(track => 
            !tracksToStop.some(trackToStop => trackToStop.id === track.id)
          ) 
        });
      }
      // For main location changes (replace=true)
      else {
        console.log("Replacing all tracks, this is a main location change");
        // Stop all existing tracks
        activeTracks.forEach(track => {
          track.howl.fade(track.volume, 0, 2000);
          track.howl.once('fade', () => {
            track.howl.stop();
          });
        });
        set({ activeTracks: [] });
        if (currentHowl) {
          currentHowl.fade(currentHowl.volume(), 0, 2000);
          currentHowl.once('fade', () => {
            currentHowl.stop();
          });
        }
      }

      // Create new track with the asset URL
      const newHowl = new Howl({
        src: [assetUrl],
        loop: true,
        volume: replace ? 0 : volume, // Start at 0 if replacing for fade-in
        onplay: () => {
          set((state) => ({
            activeTracks: [...state.activeTracks, {
              id: url, // Keep using the original url as ID for consistency
              howl: newHowl,
              name: trackName,
              volume,
              isMuted: false,
              locationId
            }]
          }));
        },
        onend: () => {
          set((state) => ({
            activeTracks: state.activeTracks.filter(t => t.id !== url)
          }));
        }
      });

      // Fade in if replacing (main location)
      if (replace) {
        newHowl.fade(0, volume, 2000);
      }

      newHowl.play();
    },

    stopTrack: () => {
      const { currentHowl, volume } = get();
      if (currentHowl) {
        currentHowl.stop();
        set({ currentHowl: null, isPlaying: false });
      }
    },

    getSublocationsByParentId: (parentLocationId) => {
      return get().locations.filter(loc => loc.parentLocationId === parentLocationId);
    },

    getAllTopLevelLocations: () => {
      return get().locations.filter(loc => !loc.parentLocationId);
    },

    toggleMuteTrack: (trackId) => {
      set((state) => ({
        activeTracks: state.activeTracks.map(track => {
          if (track.id === trackId) {
            const newMuted = !track.isMuted;
            track.howl.volume(newMuted ? 0 : track.volume);
            return { ...track, isMuted: newMuted };
          }
          return track;
        })
      }));
    },

    stopIndividualTrack: (trackId) => {
      set((state) => {
        const track = state.activeTracks.find(t => t.id === trackId);
        if (track) {
          track.howl.fade(track.volume, 0, 2000);
          track.howl.once('fade', () => track.howl.stop());
          return {
            activeTracks: state.activeTracks.filter(t => t.id !== trackId)
          };
        }
        return state;
      });
    },
    
    setTrackVolume: (trackId, volume) => {
      set((state) => {
        const updatedTracks = state.activeTracks.map(track => {
          if (track.id === trackId) {
            // If track is not muted, apply the new volume
            if (!track.isMuted) {
              track.howl.volume(volume);
            }
            // Update the track's volume property regardless of mute state
            return { ...track, volume };
          }
          return track;
        });
        
        return { activeTracks: updatedTracks };
      });
    },

    refreshAssets: async () => {
      try {
        set({ isLoading: true });
        
        const customLocations = await getLocationsData();
        const customCharacters = await getCharactersData();
        
        const hasAudioAssets = await AssetManager.hasAssets('audio');
        const hasImageAssets = await AssetManager.hasAssets('images');
        const hasDataAssets = await AssetManager.hasAssets('data');
        
        set({
          locations: customLocations,
          characters: customCharacters,
          hasAssets: hasAudioAssets || hasImageAssets || hasDataAssets,
          isLoading: false
        });
        
        // Stop all playing tracks
        const { activeTracks, currentHowl } = get();
        
        activeTracks.forEach(track => {
          track.howl.fade(track.volume, 0, 500);
          track.howl.once('fade', () => track.howl.stop());
        });
        
        if (currentHowl) {
          currentHowl.fade(currentHowl.volume(), 0, 500);
          currentHowl.once('fade', () => currentHowl.stop());
        }
        
        set({ activeTracks: [], currentHowl: null });
      } catch (error) {
        console.error('Error refreshing assets:', error);
        set({ isLoading: false });
      }
    },
    
    saveDataToIndexedDB: async () => {
      try {
        set({ isLoading: true });
        
        // Save locations.json
        const locationsResult = await AssetManager.saveDataObject('locations.json', get().locations);
        if (!locationsResult.success) {
          set({ isLoading: false });
          return locationsResult;
        }
        
        // Save characters.json
        const charactersResult = await AssetManager.saveDataObject('characters.json', get().characters);
        if (!charactersResult.success) {
          set({ isLoading: false });
          return charactersResult;
        }
        
        set({ isLoading: false });
        return { 
          success: true, 
          message: 'Successfully saved all data to IndexedDB.' 
        };
      } catch (error) {
        console.error('Error saving data to IndexedDB:', error);
        set({ isLoading: false });
        return { 
          success: false, 
          message: `Error saving data: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    },
    
    exportToZip: async () => {
      try {
        set({ isLoading: true });
        
        // First, save current state to IndexedDB
        const saveResult = await get().saveDataToIndexedDB();
        if (!saveResult.success) {
          set({ isLoading: false });
          return saveResult;
        }
        
        // Export to zip
        const exportResult = await AssetManager.exportToZip();
        set({ isLoading: false });
        
        if (!exportResult.success || !exportResult.zipBlob) {
          return exportResult;
        }
        
        // Create a download URL for the zip file
        const url = URL.createObjectURL(exportResult.zipBlob);
        
        return {
          ...exportResult,
          url
        };
      } catch (error) {
        console.error('Error exporting to zip:', error);
        set({ isLoading: false });
        return { 
          success: false, 
          message: `Error exporting data: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    },
  };
}); 