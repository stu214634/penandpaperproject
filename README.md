# Pen & Paper RPG Companion Tool

A digital companion for tabletop RPG sessions featuring interactive maps, ambient audio management, and location tracking.

## Features

🌍 **Interactive Map System**
- Pan/Zoom map interface with fog-of-war effect
- Location tracking with coordinates
- Nested sublocations and parent-child relationships
- Dynamic location connections

🎵 **Ambient Audio Management**
- Background music per location
- Smooth audio crossfading between locations
- Volume control slider
- Loopable audio tracks
- 2-second fade-in/out transitions

📦 **Inventory System**
- Character inventories
- Merchant NPCs with item prices
- Item quantity management

👥 **Character Management**
- NPC/Merchant differentiation
- Character descriptions and profiles
- UUID-based entity management

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Audio**: Howler.js
- **Mapping**: React-map-gl (Mapbox)
- **UI**: Material-UI (MUI)
- **Build**: Vite

## Installation

```bash
git clone https://github.com/stu214634/penandpaperproject.git
cd penandpaperproject
npm install
npm run dev
```

## Data Structure

Locations are defined in `data/locations.json`:
```json
{
  "id": "forest_clearing",
  "name": "Ancient Forest Clearing",
  "description": "A mystical forest clearing...",
  "backgroundMusic": "/audio/forest_ambience.mp3",
  "coordinates": [45, 32],
  "inventory": [...],
  "sublocations": [...]
}
```

## Usage

1. **Map Navigation**
   - Left-click drag to pan
   - Mouse wheel to zoom
   - Click locations for details

2. **Audio Controls**
   - Volume slider in bottom-right
   - Speaker icon toggles mute
   - Automatic music transitions between locations

3. **Inventory Management**
   - Access character inventories through NPC interaction
   - Merchant shops show item prices
   - Drag-and-drop item transfer (WIP)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/foo`)
3. Commit changes (`git commit -am 'Add some foo'`)
4. Push to branch (`git push origin feature/foo`)
5. Open a Pull Request

## License

MIT © 2024 stu214634
