/**
 * This file is used to pre-cache important lazy-loaded modules
 * to avoid "Failed to fetch dynamically imported module" errors.
 */
export function preloadRouteComponents(): void {
  // Pre-cache these important route components by importing them
  // but don't actually wait for them to load
  import('./pages/MapView');
  import('./pages/LocationsView');
  import('./pages/CharactersView');
  import('./components/CombatsView');
  import('./pages/CombatSessionView');
  
  console.log('Preloading critical components...');
} 