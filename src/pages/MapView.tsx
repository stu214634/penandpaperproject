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
  DialogContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlaceIcon from '@mui/icons-material/Place';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useStore } from '../store';
import { CustomLocation } from '../store';
import NorthIcon from '@mui/icons-material/North';
import { Howl } from 'howler';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import { AssetDropZone } from '../components/AssetDropZone';
import { AssetManager } from '../services/assetManager';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

export const MapView: React.FC = () => {
  const locations = useStore((state) => state.locations);
  const playTrack = useStore((state) => state.playTrack);
  const stopTrack = useStore((state) => state.stopTrack);
  const getSublocationsByParentId = useStore((state) => state.getSublocationsByParentId);
  const getAllTopLevelLocations = useStore((state) => state.getAllTopLevelLocations);
  const refreshAssets = useStore((state) => state.refreshAssets);
  const hasAssets = useStore((state) => state.hasAssets);
  const isLoading = useStore((state) => state.isLoading);
  
  // State for location and details
  const [selectedLocation, setSelectedLocation] = useState<CustomLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Asset manager panel is shown by default if no assets are available
  const [showAssetManager, setShowAssetManager] = useState(!hasAssets);
  
  // Additional state for image loading
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Additional checks for the empty state
  const hasLocations = locations.length > 0;
  
  // Reference to the map container for calculating relative coordinates
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Background image handling with state
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Effect to load the image when the selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const loadImage = async () => {
        setIsImageLoading(true);
        try {
          const url = await AssetManager.getAssetUrl('images', `${selectedLocation.id}.jpg`);
          setImageUrl(url);
        } catch (error) {
          console.error('Error loading image:', error);
        } finally {
          setIsImageLoading(false);
        }
      };
      loadImage();
    }
  }, [selectedLocation?.id]);
  
  // Handle location selection
  const handleLocationClick = async (location: CustomLocation, e: React.MouseEvent) => {
    e.stopPropagation();
    
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
          title={sublocation.name}
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
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translate(-50%, -50%) scale(1.2)',
              }
            }}
            onClick={(e) => handleLocationClick(sublocation, e)}
          >
            <PlaceIcon 
              color={isSelected ? "primary" : "error"} 
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

  // Normal render with locations
  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      width: '100%',
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Image with Zoom and Pan */}
      {selectedLocation && (
        <TransformWrapper
          key="main-map"
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          wheel={{ step: 0.1 }}
          limitToBounds={false}
          disablePadding={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
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
                  ref={mapContainerRef}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `
                        radial-gradient(
                          circle at center,
                          transparent 30%,
                          rgba(45, 45, 45, 0.9) 100%
                        )
                      `,
                      pointerEvents: 'none',
                      zIndex: 2,
                      mixBlendMode: 'multiply',
                      boxShadow: 'inset 0 0 50px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {/* Background image with loading state and fallback */}
                  {isImageLoading ? (
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
                        Loading image...
                      </Typography>
                    </Box>
                  ) : !imageUrl ? (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'text.secondary',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <ImageNotSupportedIcon sx={{ fontSize: 64, mb: 2 }} />
                      <Typography variant="h6" align="center">
                        No image available for {selectedLocation.name}
                      </Typography>
                      <Typography variant="body2" align="center" sx={{ mt: 1, maxWidth: '80%' }}>
                        To add an image, include "{selectedLocation.id}.jpg" in the images folder of your assets zip file.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={selectedLocation.name}
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
                    </Box>
                  )}
                  {renderLocationMarkers()}
                  {getDirectionalArrows()}
                </Box>
              </TransformComponent>
              
              {/* Zoom Controls */}
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  backgroundColor: 'rgba(30, 30, 30, 0.8)',
                  zIndex: 10,
                  width: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                  Map Controls
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Zoom In" arrow placement="top">
                    <IconButton 
                      onClick={() => zoomIn()} 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Zoom Out" arrow placement="top">
                    <IconButton 
                      onClick={() => zoomOut()} 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Reset View" arrow placement="top">
                    <IconButton 
                      onClick={() => resetTransform()} 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      <RestartAltIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    mt: 1,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                  onClick={() => setShowAssetManager(!showAssetManager)}
                >
                  {showAssetManager ? 'Hide Assets' : 'Manage Assets'}
                </Button>
              </Paper>
            </>
          )}
        </TransformWrapper>
      )}

      {/* Location Selection Panel */}
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
          <Typography variant="body1">
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
    </Box>
  );
}; 