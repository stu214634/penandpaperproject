import React, { useState, useRef } from 'react';
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
  Tooltip
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
import Slider from '@mui/material/Slider';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { Howl } from 'howler';

export const MapView: React.FC = () => {
  const locations = useStore((state) => state.locations);
  const playTrack = useStore((state) => state.playTrack);
  const stopTrack = useStore((state) => state.stopTrack);
  const getSublocationsByParentId = useStore((state) => state.getSublocationsByParentId);
  const getAllTopLevelLocations = useStore((state) => state.getAllTopLevelLocations);
  
  // State for location and details
  const [selectedLocation, setSelectedLocation] = useState<CustomLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Reference to the map container for calculating relative coordinates
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle location selection
  const handleLocationClick = (location: CustomLocation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (selectedLocation?.id !== location.id) {
      setSelectedLocation(location);
      setShowDetails(true);
      
      // Play entry sound if available
      if (location.entrySound) {
        const entrySound = new Howl({
          src: [`/audio/${location.entrySound}`],
          loop: false,
          volume: useStore.getState().volume,
        });
        entrySound.play();
      }
      
      if (location.backgroundMusic) {
        const audioPath = `/audio/${location.backgroundMusic}`;
        const isSublocation = !!location.parentLocationId;
        const replace = !(isSublocation && location.mixWithParent);
        playTrack(audioPath, { replace });
      }
    } else {
      setShowDetails(!showDetails);
    }
  };
  
  // Render location markers on the map
  const renderLocationMarkers = () => {
    if (!selectedLocation) return null;

    const sublocations = getSublocationsByParentId(selectedLocation.id);

    return sublocations.map((sublocation) => {
      if (!sublocation.coordinates) return null;

      const [relX, relY] = sublocation.coordinates;

      return (
        <Box
          key={sublocation.id}
          sx={{
            position: 'absolute',
            left: `${relX * 100}%`,
            top: `${relY * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            cursor: 'pointer',
          }}
          onClick={(e) => handleLocationClick(sublocation, e)}
        >
          <PlaceIcon 
            color="error" 
            sx={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.7))'
            }} 
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '2px 4px',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            {sublocation.name}
          </Typography>
        </Box>
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
  
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
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
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                }}
              >
                <Box 
                  ref={mapContainerRef}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
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
                  <img
                    src={`/images/${selectedLocation.id}.jpg`}
                    alt={selectedLocation.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
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
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(45, 45, 45, 0.9)',
                  zIndex: 10,
                  width: 150,
                }}
              >
                {/* Volume Slider */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <IconButton 
                    onClick={() => {
                      const { isPlaying } = useStore.getState();
                      if (isPlaying) {
                        stopTrack();
                      } else if (selectedLocation?.backgroundMusic) {
                        playTrack(`/audio/${selectedLocation.backgroundMusic}`);
                      }
                    }} 
                    size="small"
                    sx={{ padding: 0 }}
                  >
                    {useStore((state) => state.isPlaying) ? (
                      <VolumeUpIcon fontSize="small" />
                    ) : (
                      <VolumeOffIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Slider
                    value={useStore((state) => state.volume)}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => useStore.getState().setVolume(value as number)}
                    sx={{
                      color: 'white',
                      '& .MuiSlider-thumb': {
                        width: 12,
                        height: 12,
                      },
                    }}
                  />
                </Box>
                
                {/* Existing zoom buttons */}
                <IconButton onClick={() => zoomIn()} size="small">
                  <AddIcon />
                </IconButton>
                <IconButton onClick={() => zoomOut()} size="small">
                  <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => resetTransform()} size="small">
                  <RestartAltIcon />
                </IconButton>
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
          p: 2,
          maxWidth: 300,
          maxHeight: 'calc(100% - 40px)',
          overflowY: 'auto',
          backgroundColor: 'rgba(45, 45, 45, 0.9)',
          zIndex: 10,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Campaign Locations
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Click on locations to change the background.
        </Typography>
        
        <List sx={{ width: '100%', bgcolor: 'transparent' }} component="nav">
          {getAllTopLevelLocations().map((location) => renderLocationItem(location))}
        </List>
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
    </Box>
  );
}; 