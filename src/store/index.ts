import { create } from 'zustand';
import { Howl } from 'howler';
import charactersData from '../data/characters.json';
import locationsData from '../data/locations.json';

// Cast JSON data to the correct types
const typedCharactersData: Character[] = charactersData as Character[];
const typedLocationsData: CustomLocation[] = locationsData as CustomLocation[];

export interface CustomLocation {
  id: string;
  name: string;
  description: string;
  backgroundMusic?: string;
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
  addLocation: (location: Omit<CustomLocation, 'id'>) => void;
  addCharacter: (character: Omit<Character, 'id'>) => void;
  addAudioTrack: (track: Omit<AudioTrack, 'id'>) => void;
  setCurrentLocation: (locationId: string) => void;
  playTrack: (url: string) => void;
  stopTrack: () => void;
  getSublocationsByParentId: (parentLocationId: string) => CustomLocation[];
  getAllTopLevelLocations: () => CustomLocation[];
  setVolume: (volume: number) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  locations: typedLocationsData,
  mapConfig: {
    worldWidth: 1000,
    worldHeight: 1000
  },
  characters: typedCharactersData,
  audioTracks: [],
  currentLocation: undefined,
  currentHowl: null,
  volume: 0.7,
  isPlaying: false,

  addLocation: (location) => {
    const newLocation = { ...location, id: crypto.randomUUID() };
    set((state) => ({
      locations: [...state.locations, newLocation],
    }));
  },

  addCharacter: (character) => {
    const newCharacter = { ...character, id: crypto.randomUUID() };
    set((state) => ({
      characters: [...state.characters, newCharacter],
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
    const { currentHowl } = get();
    if (currentHowl) {
      currentHowl.volume(volume);
    }
    set({ volume });
  },

  playTrack: (url: string) => {
    const { currentHowl, volume } = get();
    
    // Fade out and stop existing track
    if (currentHowl) {
      currentHowl.fade(volume, 0, 2000);
      currentHowl.once('fade', () => {
        currentHowl.stop();
      });
    }

    // Create new looped track
    const newHowl = new Howl({
      src: [url],
      loop: true, // Enable infinite looping
      volume: volume,
      onplay: () => {
        set({ currentHowl: newHowl, isPlaying: true });
      },
      onend: () => {
        set({ isPlaying: false });
      }
    });

    // Start playback with fade-in
    newHowl.fade(0, volume, 2000);
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
})); 