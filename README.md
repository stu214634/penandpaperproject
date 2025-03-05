# DM Companion

A web-based tool for Dungeon Masters to manage their campaign locations, characters, and ambient music.

## Features

- **Location Management**: Create and manage locations with descriptions and background music
- **Character Database**: Keep track of NPCs and merchants
- **Interactive Map**: Place and manage locations on a customizable map
- **Audio System**: Play background music and ambient sounds for different locations
- **Dashboard**: Get an overview of your campaign elements

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
   ```
   Get your Mapbox token from [Mapbox](https://www.mapbox.com/)

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Main view components
  ├── store/         # State management
  ├── theme.ts       # UI theme configuration
  └── App.tsx        # Main application component
```

## Technologies Used

- React 18
- TypeScript
- Vite
- Material-UI
- React Map GL
- Howler.js (audio)
- Zustand (state management)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
