import React, { useState, useRef, useEffect } from 'react';
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
  SpeedDialAction
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useStore } from '../store';
import { CustomLocation } from '../store';
import NorthIcon from '@mui/icons-material/North';
import { Howl } from 'howler';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import { AssetDropZone } from '../components/AssetDropZone';
import { AssetManager } from '../services/assetManager';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
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
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';

export const MapView: React.FC = () => {
  const locations = useStore((state) => state.locations);
  const playTrack = useStore((state) => state.playTrack);
  const stopTrack = useStore((state) => state.stopTrack);
  const getSublocationsByParentId = useStore((state) => state.getSublocationsByParentId);
  const getAllTopLevelLocations = useStore((state) => state.getAllTopLevelLocations);
  const refreshAssets = useStore((state) => state.refreshAssets);
  const hasAssets = useStore((state) => state.hasAssets);
  const isLoading = useStore((state) => state.isLoading);
  
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
    const updateLocation = useStore.getState().updateLocation;
    updateLocation(locationId, { coordinates: [x, y] });
    
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
    <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Edit mode toggle button */}
      <SpeedDial
        ariaLabel="Edit mode"
        sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}
        icon={<SpeedDialIcon icon={<EditIcon />} openIcon={<CancelIcon />} />}
        onClick={toggleEditMode}
        open={editMode}
        direction="up"
      >
        {editMode && (
          <SpeedDialAction
            icon={<SaveIcon />}
            tooltipTitle="Save Changes"
            onClick={() => {
              const saveResult = useStore.getState().saveDataToIndexedDB();
              setEditMode(false);
            }}
          />
        )}
      </SpeedDial>

      {/* Edit mode status indicator */}
      {editMode && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(25, 118, 210, 0.9)',
            color: 'white',
            zIndex: 999,
            borderRadius: 2,
            maxWidth: '300px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EditIcon sx={{ mr: 1 }} />
            <Typography variant="body1" fontWeight="bold">
              Edit Mode
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            • Click on map to add new locations
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            • Drag locations to reposition
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            • Click on a location to edit its details
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic', opacity: 0.8 }}>
            Pan and zoom are disabled in edit mode
          </Typography>
        </Paper>
      )}

      {/* Edit location dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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
              {editingLocation && editingLocation.coordinates && (
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
              <FormControl fullWidth>
                <InputLabel>Background Map Image</InputLabel>
                <Select
                  value={editingLocation.imageUrl || ''}
                  label="Background Map Image"
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    imageUrl: e.target.value || undefined
                  })}
                >
                  <MenuItem value="">None</MenuItem>
                  {imageAssets.map(asset => (
                    <MenuItem key={asset} value={asset}>
                      {asset}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Background Music</InputLabel>
                <Select
                  value={editingLocation.backgroundMusic || ''}
                  label="Background Music"
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    backgroundMusic: e.target.value || undefined
                  })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioAssets.map(asset => (
                    <MenuItem key={asset} value={asset}>
                      {asset}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Entry Sound</InputLabel>
                <Select
                  value={editingLocation.entrySound || ''}
                  label="Entry Sound"
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    entrySound: e.target.value || undefined
                  })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioAssets.map(asset => (
                    <MenuItem key={asset} value={asset}>
                      {asset}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingLocation.mixWithParent || false}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation,
                      mixWithParent: e.target.checked
                    })}
                  />
                }
                label="Mix audio with parent location"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {editingLocation && (
            <Button 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this location? This cannot be undone.')) {
                  const deleteLocation = useStore.getState().deleteLocation;
                  deleteLocation(editingLocation.id);
                  useStore.getState().saveDataToIndexedDB();
                  setShowEditDialog(false);
                  setEditingLocation(null);
                }
              }}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (editingLocation) {
                const updateLocation = useStore.getState().updateLocation;
                updateLocation(editingLocation.id, editingLocation);
                useStore.getState().saveDataToIndexedDB();
                setShowEditDialog(false);
                setEditingLocation(null);
              }
            }} 
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location sidebar drawer */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          height: 'auto',
          maxHeight: 'calc(100% - 40px)',
          width: 280,
          backgroundColor: 'rgba(35, 35, 35, 0.85)',
          color: 'white',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        <Box sx={{ 
          p: 2, 
          pb: 1,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Campaign Locations
          </Typography>
          
          <Tooltip title="Manage Assets" arrow>
            <IconButton 
              size="small" 
              onClick={() => setShowAssetManager(true)}
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {getAllTopLevelLocations().length > 0 ? (
          <>
            <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(0,0,0,0.3)' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Click on a location to view it on the map
              </Typography>
            </Box>
            
            <Box 
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 1,
                py: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.1)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }} component="nav">
                {getAllTopLevelLocations().map((location) => renderLocationItem(location))}
              </List>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error.main" paragraph>
              No locations found in your campaign data.
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              color="primary"
              onClick={() => setShowAssetManager(true)}
            >
              Import Data
            </Button>
          </Box>
        )}
        
        {selectedLocation && (
          <Box sx={{ 
            p: 2,
            bgcolor: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedLocation.name}
            </Typography>
            {selectedLocation.description && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1, color: 'rgba(255,255,255,0.8)' }}>
                {selectedLocation.description}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Details Panel - Non-modal */}
      {selectedLocation && showDetails && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            p: 2,
            width: 300,
            maxHeight: 'calc(100% - 40px)',
            overflowY: 'auto',
            backgroundColor: 'rgba(45, 45, 45, 0.9)',
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {selectedLocation.name}
            </Typography>
            <IconButton size="small" onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="h6" gutterBottom>
            {selectedLocation.name}
          </Typography>          
          <Typography variant="body1" paragraph>
            {selectedLocation.description}
          </Typography>
          
          {selectedLocation.parentLocationId && (
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              This is a sublocation of {locations.find(loc => loc.id === selectedLocation.parentLocationId)?.name}
            </Typography>
          )}
        </Paper>
      )}

      {/* Asset Manager Dialog */}
      <Dialog
        open={showAssetManager}
        onClose={() => setShowAssetManager(false)}
        maxWidth="md"
        fullWidth
      >
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

      <AudioTrackPanel />

      {/* Map container */}
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          position: 'relative', 
          height: '100%',
          cursor: editMode ? 'crosshair' : 'default'
        }}
      >
        {isLoading || isImageLoading ? (
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
            // Disable pan and zoom when in edit mode
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
                    onClick={editMode ? handleMapClick : undefined}
                    onDragOver={editMode ? handleDragOver : undefined}
                    onDrop={editMode ? handleDrop : undefined}
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
      </Box>
    </Box>
  );
}; 