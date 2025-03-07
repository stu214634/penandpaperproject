# Pen & Paper RPG Companion Tool

A digital companion for tabletop RPG sessions featuring interactive maps, ambient audio management, character management, and location tracking.

## Features

- **Interactive Maps**: Pan, zoom, and navigate between connected locations
- **Location Management**: Create a hierarchy of locations and sublocations
- **NPC Management**: Create and assign NPCs and merchants to specific locations
- **Audio Integration**: Set background music and entry sounds for each location
- **Asset Management**: Import and manage your own images and audio files

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Audio**: Howler.js
- **UI**: Material-UI (MUI)
- **Build**: Vite
- **Map Interaction**: react-zoom-pan-pinch

## Installation

```bash
git clone https://github.com/stu214634/penandpaperproject.git
cd penandpaperproject
npm install
npm run dev
```

## Data Structure

### Locations
Locations are defined hierarchically with support for sublocations:

```json
{
  "id": "forest_clearing",
  "name": "Ancient Forest Clearing",
  "description": "A mystical forest clearing...",
  "backgroundMusic": "forest_ambience.mp3",
  "entrySound": "forest_entry.mp3",
  "coordinates": [45, 32],
  "connectedLocations": ["forest_path", "cave_entrance"],
  "sublocations": [...]
}
```

### Characters/NPCs
Characters (NPCs and merchants) can be assigned to specific locations:

```json
{
  "id": "village_blacksmith",
  "name": "Grimforge the Blacksmith",
  "description": "A burly dwarf with a flowing red beard...",
  "type": "merchant",
  "locationId": "village_square",
}
```

## Usage

### Map View
- Navigate the interactive map with pan and zoom controls
- View locations and their connections
- Click on locations to view details and assigned NPCs
- Toggle edit mode to add, move, or modify locations
- View NPCs assigned to the current location and its sublocations

### Character View
- Create and manage NPCs and merchants
- Assign characters to specific locations

### Asset Management
- Import custom images for maps
- Import audio files for ambience and sound effects
- Export/import your campaign data for backup or sharing

## License

MIT
