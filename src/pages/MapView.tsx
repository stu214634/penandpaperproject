import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  IconButton, 
  List,
  ListItem,
  ListItemText,
  Collapse,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Grid,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Drawer,
  Tabs,
  Tab,
  Chip,
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useStore } from '../store';
import { CustomLocation, Character, Item, Combat } from '../store';
import NorthIcon from '@mui/icons-material/North';
import { Howl } from 'howler';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import { AssetDropZone } from '../components/AssetDropZone';
import { AssetManager } from '../services/assetManager';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import { 
  PlaceOutlined as PlaceIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  MusicNote as MusicNoteIcon,
  Person as PersonIcon,
  Store as MerchantIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

export const MapView: React.FC = () => {
  const navigate = useNavigate();
  const locations = useStore((state) => state.locations);
  const playTrack = useStore((state) => state.playTrack);
  const stopTrack = useStore((state) => state.stopTrack);
  const getSublocationsByParentId = useStore((state) => state.getSublocationsByParentId);
  const getAllTopLevelLocations = useStore((state) => state.getAllTopLevelLocations);
  const refreshAssets = useStore((state) => state.refreshAssets);
  const hasAssets = useStore((state) => state.hasAssets);
  const isLoading = useStore((state) => state.isLoading);
  const characters = useStore((state) => state.characters);
  const combats = useStore((state) => state.combats);
  const saveDataToIndexedDB = useStore((state) => state.saveDataToIndexedDB);
  
  // Get only the selected location ID from the store
  const selectedLocationId = useStore((state) => state.selectedLocationId);
  const setSelectedLocationId = useStore((state) => state.setSelectedLocationId);
  
  // State for location and details
  const [selectedLocation, setSelectedLocation] = useState<CustomLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Asset manager panel is shown by default if no assets are available
  const [showAssetManager, setShowAssetManager] = useState(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CustomLocation | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Additional state for image loading
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // State for audio assets
  const [audioAssets, setAudioAssets] = useState<string[]>([]);
  
  // State for image assets
  const [imageAssets, setImageAssets] = useState<string[]>([]);
  
  // Additional checks for the empty state
  const hasLocations = locations.length > 0;
  
  // Background image handling with state
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // State for expanded NPC sections
  const [expandedNpcSections, setExpandedNpcSections] = useState<{[key: string]: boolean}>({});
  
  // State for selected NPC and its details panel
  const [selectedNpc, setSelectedNpc] = useState<Character | null>(null);
  const [showNpcDetails, setShowNpcDetails] = useState(false);
  
  // State for selected Combat and its details panel
  const [selectedCombat, setSelectedCombat] = useState<Combat | null>(null);
  const [showCombatDetails, setShowCombatDetails] = useState(false);
  
  // Additional state for the UI
  const [detailsTab, setDetailsTab] = useState(0);
  
  // Additional state for description dialog
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  
  // Effect to initialize the selected location from the saved state
  useEffect(() => {
    if (locations.length > 0) {
      if (selectedLocationId) {
        // If we have a saved location ID, try to load that location
        const savedLocation = locations.find(loc => loc.id === selectedLocationId);
        if (savedLocation) {
          setSelectedLocation(savedLocation);
          setShowDetails(true);
        } else {
          // If saved location doesn't exist anymore, load the first location
          const topLocations = getAllTopLevelLocations();
          if (topLocations.length > 0) {
            setSelectedLocation(topLocations[0]);
            setSelectedLocationId(topLocations[0].id);
          }
        }
      } else {
        // No saved location, load the first one
        const topLocations = getAllTopLevelLocations();
        if (topLocations.length > 0) {
          setSelectedLocation(topLocations[0]);
          setSelectedLocationId(topLocations[0].id);
        }
      }
    }
  }, [locations, selectedLocationId]);
  
  // Effect to load the image when the selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const loadImage = async () => {
        setIsImageLoading(true);
        try {
          // Use the location's imageUrl property if available
          if (selectedLocation.imageUrl) {
            const url = await AssetManager.getAssetUrl('images', selectedLocation.imageUrl);
            setImageUrl(url);
          } else {
            // Clear the image URL if no image is selected
            setImageUrl('');
          }
        } catch (error) {
          console.error('Error loading image:', error);
          setImageUrl('');
        } finally {
          setIsImageLoading(false);
        }
      };
      loadImage();
      
      // Save the selected location ID in the store
      setSelectedLocationId(selectedLocation.id);
    }
  }, [selectedLocation?.id, selectedLocation?.imageUrl]);
  
  // Load available audio assets when the edit dialog opens
  useEffect(() => {
    if (showEditDialog) {
      const loadAudioAssets = async () => {
        try {
          const assets = await AssetManager.getAssets('audio');
          setAudioAssets(assets.map(asset => asset.name));
        } catch (error) {
          console.error('Failed to load audio assets:', error);
          setAudioAssets([]);
        }
      };
      
      const loadImageAssets = async () => {
        try {
          const assets = await AssetManager.getAssets('images');
          setImageAssets(assets.map(asset => asset.name));
        } catch (error) {
          console.error('Failed to load image assets:', error);
          setImageAssets([]);
        }
      };
      
      loadAudioAssets();
      loadImageAssets();
    }
  }, [showEditDialog]);
  
  // Handle location selection
  const handleLocationClick = async (location: CustomLocation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If in edit mode, show edit dialog instead of regular selection
    if (editMode) {
      setEditingLocation(location);
      setShowEditDialog(true);
      return;
    }
    
    if (selectedLocation?.id !== location.id) {
      setSelectedLocation(location);
      setShowDetails(true);
      
      // Play entry sound if available
      if (location.entrySound) {
        const soundUrl = await AssetManager.getAssetUrl('audio', location.entrySound);
        
        // Only try to play the sound if a URL was returned
        if (soundUrl) {
          const locationSound = new Howl({
            src: [soundUrl],
            loop: false,
            volume: useStore.getState().volume,
          });
          locationSound.play();
        }
      }
      
      if (location.backgroundMusic) {
        // Use AssetManager to check if the audio exists before trying to play it
        const audioPath = `/audio/${location.backgroundMusic}`;
        const isSublocation = !!location.parentLocationId;
        // Only pass replace: false if this is a sublocation with mixWithParent: true
        const replace = !(isSublocation && location.mixWithParent === true);
        playTrack(audioPath, { 
          replace: replace, 
          locationId: location.id 
        });
      }
    } else {
      setShowDetails(!showDetails);
    }
  };

  // Handle asset import
  const handleAssetImport = async () => {
    // Refresh the data in the store
    await refreshAssets();
    
    // Reset the selected location to force a re-render
    if (selectedLocation) {
      const locationId = selectedLocation.id;
      setSelectedLocation(null);
      
      // Find the location in the refreshed data
      setTimeout(() => {
        const refreshedLocation = locations.find(loc => loc.id === locationId);
        if (refreshedLocation) {
          setSelectedLocation(refreshedLocation);
        }
      }, 100);
    }
  };
  
  // Handle map click to add a new location in edit mode
  const handleMapClick = (e: React.MouseEvent) => {
    if (!editMode || !selectedLocation || !imageRef.current || !mapContainerRef.current) return;
    
    // Get mouse coordinates relative to the image
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Create a new location with default values
    const newLocationData: Omit<CustomLocation, 'id'> = {
      name: 'New Location',
      description: 'Add a description',
      coordinates: [x, y],
      parentLocationId: selectedLocation.id,
    };
    
    // Add the new location to the store
    const addLocation = useStore.getState().addLocation;
    addLocation(newLocationData);
    
    // Save to IndexedDB
    useStore.getState().saveDataToIndexedDB();
  };
  
  // Handle location drag events
  const handleDragStart = (locationId: string, e: React.DragEvent) => {
    if (!editMode) return;
    
    // Set a transparent drag image (prevents the default element preview)
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    e.dataTransfer.setData('locationId', locationId);
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    if (!editMode || !imageRef.current || !mapContainerRef.current) return;
    e.preventDefault();
    
    const locationId = e.dataTransfer.getData('locationId');
    if (!locationId) return;
    
    // Get the location to update
    const locations = useStore.getState().locations;
    const locationToUpdate = locations.find(loc => loc.id === locationId);
    if (!locationToUpdate) return;
    
    // Calculate new coordinates
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Update location coordinates
    const updateLocationFn = useStore.getState().updateLocation;
    updateLocationFn(locationId, { coordinates: [x, y] });
    
    // Save to IndexedDB
    useStore.getState().saveDataToIndexedDB();
    
    setIsDragging(false);
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    // Close edit dialog if open
    if (showEditDialog) {
      setShowEditDialog(false);
      setEditingLocation(null);
    }
  };
  
  // Function to save data
  const handleSaveData = async () => {
    const result = await saveDataToIndexedDB();
    alert(result.message);
  };
  
  // Render location markers on the map
  const renderLocationMarkers = () => {
    if (!selectedLocation) return null;

    const sublocations = getSublocationsByParentId(selectedLocation.id);

    return sublocations.map((sublocation) => {
      if (!sublocation.coordinates) return null;

      const [relX, relY] = sublocation.coordinates;
      const isSelected = selectedLocation?.id === sublocation.id;

      return (
        <Tooltip 
          key={sublocation.id} 
          title={editMode ? "Drag to move, click to edit" : sublocation.name}
          arrow
          placement="top"
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${relX * 100}%`,
              top: `${relY * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              cursor: editMode ? 'move' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translate(-50%, -50%) scale(1.2)',
              }
            }}
            onClick={(e) => handleLocationClick(sublocation, e)}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(sublocation.id, e)}
          >
            <PlaceIcon 
              color={isSelected ? "primary" : editMode ? "secondary" : "error"} 
              sx={{ 
                fontSize: isSelected ? '2.5rem' : '2rem',
                filter: 'drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.9))'
              }} 
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textAlign: 'center',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.5))'
              }}
            >
              {sublocation.name}
            </Typography>
          </Box>
        </Tooltip>
      );
    });
  };
  
  // Recursive function to render location hierarchy
  const renderLocationItem = (location: CustomLocation, depth = 0) => {
    const sublocations = getSublocationsByParentId(location.id);
    const hasSublocations = sublocations.length > 0;
    
    return (
      <React.Fragment key={location.id}>
        <ListItem 
          disablePadding 
          sx={{ pl: depth * 2 }}
        >
          <ListItemButton 
            selected={selectedLocation?.id === location.id}
            onClick={(e) => handleLocationClick(location, e)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PlaceIcon />
            </ListItemIcon>
            <ListItemText primary={location.name} />
            {hasSublocations && (
              <IconButton 
                size="small" 
              >
              </IconButton>
            )}
          </ListItemButton>
        </ListItem>
        
        {hasSublocations && (
          <Collapse in={selectedLocation?.id === location.id} timeout="auto" unmountOnExit>
            <List disablePadding>
              {sublocations.map((subloc) => renderLocationItem(subloc, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  // Add new helper function inside the component
  const calculateEdgeIntersection = (
    currentX: number,
    currentY: number,
    dx: number,
    dy: number
  ) => {
    let tMin = Infinity;
    let edgeX = currentX + dx;
    let edgeY = currentY + dy;

    // Check horizontal boundaries
    if (dx !== 0) {
      // x=0 boundary
      const tX0 = (0 - currentX) / dx;
      if (tX0 > 0) {
        const y = currentY + tX0 * dy;
        if (y >= 0 && y <= 1 && tX0 < tMin) {
          tMin = tX0;
          edgeX = 0;
          edgeY = y;
        }
      }

      // x=1 boundary
      const tX1 = (1 - currentX) / dx;
      if (tX1 > 0) {
        const y = currentY + tX1 * dy;
        if (y >= 0 && y <= 1 && tX1 < tMin) {
          tMin = tX1;
          edgeX = 1;
          edgeY = y;
        }
      }
    }

    // Check vertical boundaries
    if (dy !== 0) {
      // y=0 boundary
      const tY0 = (0 - currentY) / dy;
      if (tY0 > 0) {
        const x = currentX + tY0 * dx;
        if (x >= 0 && x <= 1 && tY0 < tMin) {
          tMin = tY0;
          edgeX = x;
          edgeY = 0;
        }
      }

      // y=1 boundary
      const tY1 = (1 - currentY) / dy;
      if (tY1 > 0) {
        const x = currentX + tY1 * dx;
        if (x >= 0 && x <= 1 && tY1 < tMin) {
          tMin = tY1;
          edgeX = x;
          edgeY = 1;
        }
      }
    }

    return { x: edgeX, y: edgeY };
  };

  // Add these helper functions at the top of the component
  const normalizeCoordinate = (coord: number, max: number) => {
    return Math.min(Math.max(coord / max, 0), 1);
  };

  // Update the getDirectionalArrows function
  const getDirectionalArrows = () => {
    if (!selectedLocation) return null;

    const worldWidth = useStore.getState().mapConfig.worldWidth;
    const worldHeight = useStore.getState().mapConfig.worldHeight;
    const circleRadius = 0.3; // Increased from 0.1 to 30% of container size

    return locations
      .filter(loc => 
        selectedLocation.connectedLocations?.includes(loc.id) &&
        loc.id !== selectedLocation.id
      )
      .map(connectedLoc => {
        if (!selectedLocation.coordinates || !connectedLoc.coordinates) return null;

        // Get original coordinates
        const [currentX, currentY] = selectedLocation.coordinates;
        const [targetX, targetY] = connectedLoc.coordinates;

        // Calculate direction vector
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        
        // Calculate angle for rotation
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI) + 90;

        // Calculate normalized position on circle
        const distance = Math.sqrt(dx*dx + dy*dy);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Get normalized coordinates for MAP CENTER (0.5, 0.5)
        const mapCenterX = 0.5;
        const mapCenterY = 0.5;

        // Position on circle edge relative to map center
        const arrowX = mapCenterX + normalizedDx * circleRadius;
        const arrowY = mapCenterY + normalizedDy * circleRadius;

        return (
          <Tooltip 
            key={`tooltip-${connectedLoc.id}`}
            title={`${connectedLoc.name} (${distance.toFixed(1)} meters)`}
            placement="top"
            arrow
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleLocationClick(connectedLoc, e);
              }}
              sx={{
                position: 'absolute',
                zIndex: 10,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.8)'
                },
                left: `${arrowX * 100}%`,
                top: `${arrowY * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <NorthIcon 
                fontSize="large" 
                sx={{ transform: `rotate(${angleDeg}deg)` }} 
              />
            </IconButton>
          </Tooltip>
        );
      });
  };
  
  // Toggle expanded state for NPC sections
  const toggleNpcSection = (sectionId: string) => {
    setExpandedNpcSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Get characters for a specific location
  const getCharactersByLocationId = (locationId: string) => {
    return characters.filter(char => char.locationId === locationId);
  };
  
  // Get all characters in a location and its sublocations
  const getAllCharactersInLocationHierarchy = (locationId: string) => {
    const directCharacters = getCharactersByLocationId(locationId);
    const sublocations = getSublocationsByParentId(locationId);
    
    let allCharacters = [...directCharacters];
    
    // Recursively get characters from sublocations
    sublocations.forEach(sublocation => {
      const sublocationCharacters = getAllCharactersInLocationHierarchy(sublocation.id);
      allCharacters = [...allCharacters, ...sublocationCharacters];
    });
    
    return allCharacters;
  };
  
  // Handle clicking on an NPC to show its details
  const handleNpcClick = (npc: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNpc(npc);
    setShowNpcDetails(true);
  };
  
  // Modify the renderNpcsPanel function to include click handlers
  const renderNpcsPanel = () => {
    if (!selectedLocation) return null;
    
    const directNpcs = getCharactersByLocationId(selectedLocation.id);
    const allNpcs = getAllCharactersInLocationHierarchy(selectedLocation.id);
    const hasSublocationsWithNpcs = allNpcs.length > directNpcs.length;
    
    if (allNpcs.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No NPCs in this location
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <List dense>
          {directNpcs.length > 0 && (
            <>
              <ListItem>
                <ListItemText 
                  primary={`NPCs in ${selectedLocation.name}`} 
                  primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                />
              </ListItem>
              {directNpcs.map(npc => (
                <ListItem 
                  key={npc.id} 
                  button 
                  onClick={(e) => handleNpcClick(npc, e)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    {npc.type === 'npc' ? <PersonIcon fontSize="small" /> : 
                     npc.type === 'merchant' ? <MerchantIcon fontSize="small" /> :
                     <SportsKabaddiIcon color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary={npc.name} secondary={npc.description} />
                </ListItem>
              ))}
              {hasSublocationsWithNpcs && <Divider sx={{ my: 1 }} />}
            </>
          )}
          
          {hasSublocationsWithNpcs && renderSublocationsNpcs(selectedLocation.id)}
        </List>
      </Box>
    );
  };
  
  // Modify the renderSublocationsNpcs function to include click handlers
  const renderSublocationsNpcs = (locationId: string) => {
    const sublocations = getSublocationsByParentId(locationId);
    
    return (
      <>
        {sublocations.map(sublocation => {
          const npcs = getCharactersByLocationId(sublocation.id);
          
          if (npcs.length === 0) {
            return null;
          }
          
          const sectionId = `npc-section-${sublocation.id}`;
          const isExpanded = expandedNpcSections[sectionId] || false;
          
          return (
            <Box key={sublocation.id}>
              <ListItem 
                button 
                onClick={() => toggleNpcSection(sectionId)}
                sx={{ pl: 2 }}
              >
                <ListItemText 
                  primary={sublocation.name} 
                  primaryTypographyProps={{ variant: 'subtitle2' }}
                />
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItem>
              
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {npcs.map(npc => (
                    <ListItem 
                      key={npc.id}
                      button
                      onClick={(e) => handleNpcClick(npc, e)}
                      sx={{ pl: 4, cursor: 'pointer' }}
                    >
                      <ListItemIcon>
                        {npc.type === 'npc' ? <PersonIcon fontSize="small" /> : 
                         npc.type === 'merchant' ? <MerchantIcon fontSize="small" /> :
                         <SportsKabaddiIcon color="error" fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText primary={npc.name} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
              
              {renderSublocationsNpcs(sublocation.id)}
            </Box>
          );
        })}
      </>
    );
  };

  // Create a function to render the NPC details panel
  const renderNpcDetailsPanel = () => {
    if (!selectedNpc) return null;
    
    const locationName = locations.find(loc => loc.id === selectedNpc.locationId)?.name || 'Unknown';
    const updateCharacter = useStore.getState().updateCharacter;
    
    // Function to add new item in edit mode
    const handleAddItem = () => {
      if (!selectedNpc || !editMode) return;
      
      const newItem: Item = {
        id: crypto.randomUUID(),
        name: 'New Item',
        description: 'Item description',
        quantity: 1
      };
      
      const updatedInventory = [...(selectedNpc.inventory || []), newItem];
      updateCharacter(selectedNpc.id, { inventory: updatedInventory });
      setSelectedNpc({...selectedNpc, inventory: updatedInventory});
    };
    
    // Function to update item in edit mode
    const handleUpdateItem = (itemId: string, itemData: Partial<Item>) => {
      if (!selectedNpc || !editMode) return;
      
      const updatedInventory = (selectedNpc.inventory || []).map(item => 
        item.id === itemId ? {...item, ...itemData} : item
      );
      
      updateCharacter(selectedNpc.id, { inventory: updatedInventory });
      setSelectedNpc({...selectedNpc, inventory: updatedInventory});
    };
    
    // Function to delete item in edit mode
    const handleDeleteItem = (itemId: string) => {
      if (!selectedNpc || !editMode) return;
      
      const updatedInventory = (selectedNpc.inventory || []).filter(item => item.id !== itemId);
      updateCharacter(selectedNpc.id, { inventory: updatedInventory });
      setSelectedNpc({...selectedNpc, inventory: updatedInventory});
    };
    
    return (
      <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{selectedNpc.name}</Typography>
          <IconButton onClick={() => setShowNpcDetails(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">{selectedNpc.type === 'npc' ? 'NPC' : 
         selectedNpc.type === 'merchant' ? 'Merchant' : 'Enemy'}</Typography>
        <Typography variant="body2" paragraph>{selectedNpc.description}</Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Location:</Typography>
          <Typography variant="body2">{locationName}</Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Inventory</Typography>
          {editMode && (
            <IconButton size="small" onClick={handleAddItem} color="primary">
              <AddIcon />
            </IconButton>
          )}
        </Box>
        
        {(!selectedNpc.inventory || selectedNpc.inventory.length === 0) ? (
          <Typography variant="body2" color="text.secondary">No items in inventory</Typography>
        ) : (
          <List dense>
            {selectedNpc.inventory.map((item: Item) => (
              <ListItem 
                key={item.id}
                secondaryAction={editMode ? (
                  <IconButton edge="end" size="small" onClick={() => handleDeleteItem(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : null}
              >
                <ListItemText 
                  primary={
                    editMode ? (
                      <TextField
                        size="small"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        fullWidth
                        variant="standard"
                        margin="dense"
                      />
                    ) : item.name
                  }
                  secondary={
                    <>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          fullWidth
                          variant="standard"
                          margin="dense"
                          multiline
                        />
                      ) : item.description}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Box>
                          Qty: {editMode ? (
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                              variant="standard"
                              sx={{ width: 50 }}
                            />
                          ) : item.quantity}
                        </Box>
                        {item.price !== undefined && (
                          <Box>
                            Price: {editMode ? (
                              <TextField
                                size="small"
                                type="number"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(item.id, { price: parseInt(e.target.value) || 0 })}
                                variant="standard"
                                sx={{ width: 60 }}
                              />
                            ) : item.price}
                          </Box>
                        )}
                        {editMode && item.price === undefined && (
                          <Button 
                            size="small" 
                            onClick={() => handleUpdateItem(item.id, { price: 0 })}
                          >
                            Add Price
                          </Button>
                        )}
                      </Box>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  };
  
  // Get combats for a specific location and its sublocations
  const getCombatsByLocationHierarchy = (locationId: string) => {
    const directCombats = combats.filter(combat => combat.locationId === locationId);
    const sublocations = getSublocationsByParentId(locationId);
    
    let allCombats = [...directCombats];
    
    // Recursively get combats from sublocations
    sublocations.forEach(sublocation => {
      const sublocationCombats = getCombatsByLocationHierarchy(sublocation.id);
      allCombats = [...allCombats, ...sublocationCombats];
    });
    
    return allCombats;
  };
  
  // Handle clicking on a combat to show its details
  const handleCombatClick = (combat: Combat, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCombat(combat);
    setShowCombatDetails(true);
  };
  
  // Render the combats panel showing combats in the current location
  const renderCombatsPanel = () => {
    if (!selectedLocation) return null;
    
    const directCombats = combats.filter(combat => combat.locationId === selectedLocation.id);
    const allCombats = getCombatsByLocationHierarchy(selectedLocation.id);
    const hasSublocationsWithCombats = allCombats.length > directCombats.length;
    
    if (allCombats.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No combats in this location
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <List dense>
          {directCombats.length > 0 && (
            <>
              <ListItem>
                <ListItemText 
                  primary={`Combats in ${selectedLocation.name}`} 
                  primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                />
              </ListItem>
              {directCombats.map(combat => (
                <ListItem 
                  key={combat.id} 
                  button 
                  onClick={(e) => handleCombatClick(combat, e)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <SportsKabaddiIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={combat.name} 
                    secondary={`Difficulty: ${combat.difficulty || 'Medium'}`} 
                  />
                </ListItem>
              ))}
              {hasSublocationsWithCombats && <Divider sx={{ my: 1 }} />}
            </>
          )}
          
          {hasSublocationsWithCombats && renderSubLocationsCombats(selectedLocation.id)}
        </List>
      </Box>
    );
  };
  
  // Render combats in sublocations
  const renderSubLocationsCombats = (locationId: string) => {
    const sublocations = getSublocationsByParentId(locationId);
    
    return (
      <>
        {sublocations.map(sublocation => {
          const locationCombats = combats.filter(combat => combat.locationId === sublocation.id);
          
          if (locationCombats.length === 0) {
            return null;
          }
          
          const sectionId = `combat-section-${sublocation.id}`;
          const isExpanded = expandedNpcSections[sectionId] || false;
          
          return (
            <Box key={sublocation.id}>
              <ListItem 
                button 
                onClick={() => toggleNpcSection(sectionId)}
                sx={{ pl: 2 }}
              >
                <ListItemText 
                  primary={sublocation.name} 
                  primaryTypographyProps={{ variant: 'subtitle2' }}
                />
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItem>
              
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {locationCombats.map(combat => (
                    <ListItem 
                      key={combat.id}
                      button
                      onClick={(e) => handleCombatClick(combat, e)}
                      sx={{ pl: 4, cursor: 'pointer' }}
                    >
                      <ListItemIcon>
                        <SportsKabaddiIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={combat.name}
                        secondary={`Difficulty: ${combat.difficulty || 'Medium'}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
              
              {renderSubLocationsCombats(sublocation.id)}
            </Box>
          );
        })}
      </>
    );
  };
  
  // Render the combat details panel
  const renderCombatDetailsPanel = () => {
    if (!selectedCombat) return null;
    
    const locationName = locations.find(loc => loc.id === selectedCombat.locationId)?.name || 'Unknown';
    
    return (
      <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{selectedCombat.name}</Typography>
          <IconButton onClick={() => setShowCombatDetails(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">
          Difficulty: {selectedCombat.difficulty || 'Medium'}
        </Typography>
        <Typography variant="body2" paragraph>{selectedCombat.description}</Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Location:</Typography>
          <Typography variant="body2">{locationName}</Typography>
        </Box>
        
        {/* Add Start Combat button at the top of the details */}
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          startIcon={<SportsKabaddiIcon />}
          onClick={() => {
            setShowCombatDetails(false);
            // Navigate to the combat session view with the selected combat ID
            navigate('/combat-session', { state: { combatId: selectedCombat.id } });
          }}
          sx={{ mb: 3 }}
        >
          Start Combat
        </Button>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2">Player Characters:</Typography>
        {selectedCombat.playerCharacters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No player characters assigned</Typography>
        ) : (
          <List dense>
            {selectedCombat.playerCharacters.map(character => (
              <ListItem key={character.id}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={character.name} />
              </ListItem>
            ))}
          </List>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2">Enemies:</Typography>
        {selectedCombat.enemies.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No enemies assigned</Typography>
        ) : (
          <List dense>
            {/* Group enemies by name and count them */}
            {Object.entries(
              selectedCombat.enemies.reduce((acc, enemy) => {
                acc[enemy.id] = acc[enemy.id] || { enemy, count: 0 };
                acc[enemy.id].count++;
                return acc;
              }, {} as Record<string, { enemy: Character, count: number }>)
            ).map(([id, { enemy, count }]) => (
              <ListItem key={id}>
                <ListItemIcon>
                  <SportsKabaddiIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${enemy.name} ${count > 1 ? `(x${count})` : ''}`} 
                  secondary={`HP: ${enemy.hp}`}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {selectedCombat.rewards && selectedCombat.rewards.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Rewards:</Typography>
            <List dense>
              {selectedCombat.rewards.map(item => (
                <ListItem key={item.id}>
                  <ListItemText 
                    primary={item.name} 
                    secondary={`Quantity: ${item.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );
  };
  
  // Loading state for the entire application
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          height: 'calc(100vh - 64px)', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your campaign...
        </Typography>
      </Box>
    );
  }

  // Render the empty state when no assets or locations are available
  if (!hasLocations) {
    return (
      <Box 
        sx={{ 
          height: 'calc(100vh - 64px)', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          backgroundColor: 'background.default'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 600,
            width: '100%',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(45, 45, 45, 0.9)',
          }}
        >
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
            Welcome to Pen & Paper Project
          </Typography>
          
          <Typography variant="body1" paragraph align="center">
            No campaign assets found. Please upload a zip file containing your campaign assets to get started.
          </Typography>
          
          <Typography variant="body2" paragraph align="center" color="text.secondary" sx={{ mb: 3 }}>
            Your zip file should contain an "audio" folder for sound files, an "images" folder for location images, 
            and a "data" folder with your "locations.json" and "characters.json" files.
          </Typography>
          
          <AssetDropZone onAssetImport={handleAssetImport} isFullPage={true} />
        </Paper>
      </Box>
    );
  }

  // Render the main map view
  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: 280, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <Tabs 
          value={showDetails ? 1 : 0} 
          onChange={(_, value) => setShowDetails(value === 1)}
          variant="fullWidth"
        >
          <Tab label="Locations" />
          <Tab label="Details" disabled={!selectedLocation} />
        </Tabs>
        
        {!showDetails ? (
          <List 
            sx={{ 
              overflowY: 'auto', 
              flexGrow: 1,
              '& .MuiListItemButton-root.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': {
                  bgcolor: 'primary.light',
                }
              }
            }}
          >
            {getAllTopLevelLocations().map((location) => renderLocationItem(location))}
          </List>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton 
                  size="small"
                  onClick={() => setShowDetails(false)}
                  sx={{ mr: 1 }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" noWrap>{selectedLocation?.name}</Typography>
                
                {editMode && (
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => {
                      if (selectedLocation) {
                        setEditingLocation(selectedLocation);
                        setShowEditDialog(true);
                      }
                    }}
                    sx={{ ml: 'auto' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              {selectedLocation?.description && (
                <Box
                  onClick={() => setShowDescriptionDialog(true)} 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {selectedLocation.description}
                  </Typography>
                  {selectedLocation.description.length > 200 && (
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Click to view full description
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
              {/* Location details tabs */}
              <Tabs 
                value={detailsTab} 
                onChange={(_, value) => setDetailsTab(value)}
                variant="fullWidth" 
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Info" />
                <Tab label="NPCs" />
                <Tab label="Combats" />
              </Tabs>
              
              {/* Info Panel */}
              {detailsTab === 0 && (
                <Box sx={{ p: 2 }}>
                  {selectedLocation?.backgroundMusic && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Background Music:</Typography>
                      <Chip 
                        icon={<MusicNoteIcon />} 
                        label={selectedLocation.backgroundMusic}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => {
                          if (selectedLocation?.backgroundMusic) {
                            playTrack(selectedLocation.backgroundMusic, { 
                              replace: true,
                              locationId: selectedLocation.id,
                              loop: true
                            });
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {selectedLocation?.entrySound && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Entry Sound:</Typography>
                      <Chip 
                        icon={<MusicNoteIcon />} 
                        label={selectedLocation.entrySound}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        onClick={() => {
                          if (selectedLocation?.entrySound) {
                            playTrack(selectedLocation.entrySound, { 
                              replace: false,
                              locationId: selectedLocation.id
                            });
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {selectedLocation?.connectedLocations && selectedLocation.connectedLocations.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Connected Locations:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {selectedLocation.connectedLocations.map(locId => {
                          const connectedLoc = locations.find(l => l.id === locId);
                          if (!connectedLoc) return null;
                          
                          return (
                            <Chip 
                              key={locId}
                              icon={<PlaceIcon />}
                              label={connectedLoc.name}
                              size="small"
                              color="info"
                              variant="outlined"
                              onClick={() => handleLocationClick(connectedLoc, {} as React.MouseEvent)}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* NPCs Panel */}
              {detailsTab === 1 && renderNpcsPanel()}
              
              {/* Combats Panel */}
              {detailsTab === 2 && renderCombatsPanel()}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Main content area */}
      <Box
        ref={mapContainerRef}
        sx={{
          position: 'relative',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'black',
          zIndex: 1,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleMapClick}
      >
        {isLoading ? (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading map...
            </Typography>
          </Box>
        ) : !imageUrl || !selectedLocation ? (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <ImageNotSupportedIcon sx={{ fontSize: 60, opacity: 0.7 }} />
            <Typography variant="body1" sx={{ mt: 2, opacity: 0.7 }}>
              No map image available
            </Typography>
          </Box>
        ) : (
          <TransformWrapper
            key="main-map"
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            minScale={0.5}
            maxScale={5}
            wheel={{ step: 0.1 }}
            limitToBounds={false}
            disablePadding={true}
            disabled={editMode}
          >
            {() => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0,
                  }}
                  contentStyle={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box 
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt={selectedLocation?.name || 'Map'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 1,
                      }}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                    />
                    {renderLocationMarkers()}
                    {getDirectionalArrows()}
                  </Box>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
        
        {/* Empty state */}
        {!hasLocations && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 400, p: 3, bgcolor: 'rgba(0,0,0,0.8)', color: 'white', borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                No locations found
              </Typography>
              <Typography variant="body1" paragraph>
                Your campaign doesn't have any locations yet. Import data or create locations in edit mode.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mr: 1 }}
                onClick={() => setShowAssetManager(true)}
              >
                Import Assets
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={toggleEditMode}
              >
                {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Edit Location Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Location
          <IconButton
            aria-label="close"
            onClick={() => setShowEditDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editingLocation && (
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={editingLocation.name}
                onChange={(e) => setEditingLocation({
                  ...editingLocation,
                  name: e.target.value
                })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={editingLocation.description}
                onChange={(e) => setEditingLocation({
                  ...editingLocation,
                  description: e.target.value
                })}
              />
              
              <Autocomplete
                multiple
                options={locations.filter(loc => loc.id !== editingLocation.id)}
                value={locations.filter(loc => editingLocation.connectedLocations?.includes(loc.id) || false)}
                onChange={(_, newValue) => setEditingLocation({
                  ...editingLocation,
                  connectedLocations: newValue.map(item => item.id)
                })}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Connected Locations"
                    fullWidth
                    helperText="Select locations that are connected to this one"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
              
              {editingLocation.coordinates && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="X Coordinate"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                    value={editingLocation.coordinates[0]}
                    onChange={(e) => {
                      if (editingLocation.coordinates) {
                        const x = parseFloat(e.target.value);
                        const y = editingLocation.coordinates[1];
                        setEditingLocation({
                          ...editingLocation,
                          coordinates: [x, y]
                        });
                      }
                    }}
                  />
                  <TextField
                    label="Y Coordinate"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                    value={editingLocation.coordinates[1]}
                    onChange={(e) => {
                      if (editingLocation.coordinates) {
                        const x = editingLocation.coordinates[0];
                        const y = parseFloat(e.target.value);
                        setEditingLocation({
                          ...editingLocation,
                          coordinates: [x, y]
                        });
                      }
                    }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (editingLocation) {
                const updateLocationFn = useStore.getState().updateLocation;
                updateLocationFn(editingLocation.id, {
                  name: editingLocation.name,
                  description: editingLocation.description,
                  coordinates: editingLocation.coordinates,
                  connectedLocations: editingLocation.connectedLocations
                });
                useStore.getState().saveDataToIndexedDB();
                setShowEditDialog(false);
              }
            }} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset Manager Dialog */}
      <Dialog open={showAssetManager} onClose={() => setShowAssetManager(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Asset Manager
            <IconButton 
              edge="end" 
              onClick={() => setShowAssetManager(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <AssetDropZone onAssetImport={handleAssetImport} />
        </DialogContent>
      </Dialog>

      {/* NPC Details Dialog */}
      <Dialog
        open={showNpcDetails}
        onClose={() => setShowNpcDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        {renderNpcDetailsPanel()}
      </Dialog>

      {/* Combat Details Dialog */}
      <Dialog
        open={showCombatDetails}
        onClose={() => setShowCombatDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        {renderCombatDetailsPanel()}
      </Dialog>

      {/* Description Dialog */}
      <Dialog
        open={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedLocation?.name} - Description
          <IconButton
            aria-label="close"
            onClick={() => setShowDescriptionDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedLocation?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDescriptionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 