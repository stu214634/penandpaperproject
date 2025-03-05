# Pen & Paper RPG Companion Tool

A digital companion for tabletop RPG sessions featuring interactive maps, ambient audio management, and location tracking.

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Audio**: Howler.js
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
