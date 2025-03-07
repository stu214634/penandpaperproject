import React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CardActions,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Tooltip,
  InputAdornment,
  Snackbar,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SaveIcon from '@mui/icons-material/Save';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import HelpIcon from '@mui/icons-material/Help';
import ImageIcon from '@mui/icons-material/Image';
import { useStore } from '../store';
import { AssetManager } from '../services/assetManager';
import { AudioTrackPanel } from '../components/AudioTrackPanel';

export const LocationsView: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    backgroundMusic: '',
    entrySound: '',
    imageUrl: '',
    parentLocationId: '',
    coordinates: [0, 0] as [number, number],
    mixWithParent: false,
  });
  
  // Currently edited location
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  
  // Available audio files
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  
  // Available image files
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  
  // Status for save operation
  const [isSaving, setIsSaving] = useState(false);
  
  // Expanded locations state
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const { 
    locations, 
    addLocation, 
    updateLocation,
    deleteLocation, 
    getAllTopLevelLocations, 
    getSublocationsByParentId, 
    saveDataToIndexedDB 
  } = useStore();
  
  const topLevelLocations = getAllTopLevelLocations();

  // Load audio files on component mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const audioAssets = await AssetManager.getAssets('audio');
        setAudioFiles(audioAssets.map(asset => asset.name));
        
        const imageAssets = await AssetManager.getAssets('images');
        setImageFiles(imageAssets.map(asset => asset.name));
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    };
    
    loadAssets();
  }, []);

  const handleAddLocation = () => {
    addLocation({
      name: newLocation.name,
      description: newLocation.description,
      backgroundMusic: newLocation.backgroundMusic || undefined,
      entrySound: newLocation.entrySound || undefined,
      imageUrl: newLocation.imageUrl || undefined,
      coordinates: newLocation.coordinates.every(coord => coord !== 0) ? newLocation.coordinates : undefined,
      parentLocationId: newLocation.parentLocationId || undefined,
      mixWithParent: newLocation.mixWithParent,
    });
    
    setIsAddDialogOpen(false);
    resetNewLocationForm();
    showSnackbar('Location added successfully');
  };
  
  const resetNewLocationForm = () => {
    setNewLocation({ 
      name: '', 
      description: '', 
      backgroundMusic: '', 
      entrySound: '',
      imageUrl: '',
      parentLocationId: '',
      coordinates: [0, 0],
      mixWithParent: false
    });
  };

  const toggleLocationExpand = (locationId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };
  
  // Open edit dialog for a location
  const handleEditLocation = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setEditingLocation(locationId);
      setNewLocation({
        name: location.name,
        description: location.description,
        backgroundMusic: location.backgroundMusic || '',
        entrySound: location.entrySound || '',
        imageUrl: location.imageUrl || '',
        parentLocationId: location.parentLocationId || '',
        coordinates: location.coordinates || [0, 0],
        mixWithParent: location.mixWithParent || false,
      });
      setIsEditDialogOpen(true);
    }
  };
  
  // Save edited location
  const handleSaveLocation = () => {
    if (editingLocation) {
      updateLocation(editingLocation, {
        name: newLocation.name,
        description: newLocation.description,
        backgroundMusic: newLocation.backgroundMusic || undefined,
        entrySound: newLocation.entrySound || undefined,
        imageUrl: newLocation.imageUrl || undefined,
        coordinates: newLocation.coordinates.every(coord => coord !== 0) ? newLocation.coordinates : undefined,
        parentLocationId: newLocation.parentLocationId || undefined,
        mixWithParent: newLocation.mixWithParent,
      });
      
      setIsEditDialogOpen(false);
      resetNewLocationForm();
      setEditingLocation(null);
      showSnackbar('Location updated successfully');
    }
  };
  
  // Confirm and delete a location
  const handleDeleteLocation = (locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location? This cannot be undone.')) {
      deleteLocation(locationId);
      showSnackbar('Location deleted successfully');
    }
  };
  
  // Save all data to IndexedDB
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const result = await saveDataToIndexedDB();
      showSnackbar(result.message);
    } catch (error) {
      showSnackbar(`Error saving data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show a snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Recursive function to render all locations with nested structure
  const renderLocation = (location: any, level = 0) => {
    const isExpanded = expandedLocations[location.id] || false;
    const sublocations = getSublocationsByParentId(location.id);
    const hasSublocations = sublocations.length > 0;
    
    return (
      <Box key={location.id} sx={{ mb: 2 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" component="div">
                  {location.name}
                </Typography>
                
                {location.imageUrl && (
                  <Box sx={{ 
                    mt: 1, 
                    mb: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: 140,
                    overflow: 'hidden',
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}>
                    <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                      Map Background:
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                      <img 
                        src={`/images/${location.imageUrl}`}
                        alt={`Map of ${location.name}`}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          objectFit: 'contain' 
                        }}
                        onError={async (e) => {
                          try {
                            if (location.imageUrl) {
                              const imageUrl = await AssetManager.getAssetUrl('images', location.imageUrl);
                              if (imageUrl) {
                                (e.target as HTMLImageElement).src = imageUrl;
                              }
                            }
                          } catch (error) {
                            console.error('Error loading location image:', error);
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {location.description}
                </Typography>
                
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {location.backgroundMusic && (
                    <Chip 
                      icon={<MusicNoteIcon />} 
                      label={`Music: ${location.backgroundMusic}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  
                  {location.entrySound && (
                    <Chip 
                      icon={<VolumeUpIcon />} 
                      label={`Sound: ${location.entrySound}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  
                  {location.coordinates && (
                    <Chip 
                      label={`Coords: ${location.coordinates[0]}, ${location.coordinates[1]}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  
                  {location.mixWithParent && (
                    <Chip 
                      label="Mixes with parent" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Box>
              
              <Box>
                <IconButton onClick={() => handleEditLocation(location.id)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteLocation(location.id)}>
                  <DeleteIcon />
                </IconButton>
                {hasSublocations && (
                  <IconButton onClick={() => toggleLocationExpand(location.id)}>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>
            </Box>
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
            <Button 
              size="small" 
              startIcon={<AddIcon />}
              onClick={() => {
                setNewLocation({
                  ...newLocation,
                  parentLocationId: location.id
                });
                setIsAddDialogOpen(true);
              }}
            >
              Add Sublocation
            </Button>
          </CardActions>
        </Card>
        
        {/* Sublocations */}
        {hasSublocations && isExpanded && (
          <Box sx={{ pl: 4, mt: 1 }}>
            {sublocations.map(subloc => renderLocation(subloc, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Locations</Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="success" 
            startIcon={<SaveIcon />} 
            onClick={handleSaveData}
            disabled={isSaving}
            sx={{ mr: 2 }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              resetNewLocationForm();
              setIsAddDialogOpen(true);
            }}
          >
            Add Location
          </Button>
        </Box>
      </Box>
      
      {locations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Locations Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Add your first location to get started.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Location
          </Button>
        </Paper>
      ) : (
        // Locations list
        <Box>
          {topLevelLocations.map(location => renderLocation(location))}
        </Box>
      )}
      
      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Location</InputLabel>
                <Select
                  value={newLocation.parentLocationId}
                  label="Parent Location"
                  onChange={(e) => setNewLocation({ ...newLocation, parentLocationId: e.target.value as string })}
                >
                  <MenuItem value="">
                    <em>None (Top-level)</em>
                  </MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Background Music</InputLabel>
                <Select
                  value={newLocation.backgroundMusic}
                  label="Background Music"
                  onChange={(e) => setNewLocation({ ...newLocation, backgroundMusic: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Entry Sound</InputLabel>
                <Select
                  value={newLocation.entrySound}
                  label="Entry Sound"
                  onChange={(e) => setNewLocation({ ...newLocation, entrySound: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Background Map Image</InputLabel>
                <Select
                  value={newLocation.imageUrl}
                  label="Background Map Image"
                  onChange={(e) => setNewLocation({ ...newLocation, imageUrl: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {imageFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Image to use as the background map for this location</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="X Coordinate"
                type="number"
                fullWidth
                value={newLocation.coordinates[0]}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: [parseFloat(e.target.value) || 0, newLocation.coordinates[1]] 
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">X:</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Y Coordinate"
                type="number"
                fullWidth
                value={newLocation.coordinates[1]}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: [newLocation.coordinates[0], parseFloat(e.target.value) || 0] 
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Y:</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newLocation.mixWithParent}
                    onChange={(e) => setNewLocation({ ...newLocation, mixWithParent: e.target.checked })}
                  />
                }
                label="Mix audio with parent location"
              />
              <Tooltip title="When enabled, entering this location will play its audio alongside the parent location's audio.">
                <IconButton size="small">
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLocation} 
            variant="contained"
            disabled={!newLocation.name}
          >
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Location</InputLabel>
                <Select
                  value={newLocation.parentLocationId}
                  label="Parent Location"
                  onChange={(e) => setNewLocation({ ...newLocation, parentLocationId: e.target.value as string })}
                >
                  <MenuItem value="">
                    <em>None (Top-level)</em>
                  </MenuItem>
                  {locations
                    .filter(loc => loc.id !== editingLocation) // Prevent selecting itself
                    .map((loc) => (
                      <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Background Music</InputLabel>
                <Select
                  value={newLocation.backgroundMusic}
                  label="Background Music"
                  onChange={(e) => setNewLocation({ ...newLocation, backgroundMusic: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Entry Sound</InputLabel>
                <Select
                  value={newLocation.entrySound}
                  label="Entry Sound"
                  onChange={(e) => setNewLocation({ ...newLocation, entrySound: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {audioFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Background Map Image</InputLabel>
                <Select
                  value={newLocation.imageUrl}
                  label="Background Map Image"
                  onChange={(e) => setNewLocation({ ...newLocation, imageUrl: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {imageFiles.map(file => (
                    <MenuItem key={file} value={file}>{file}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Image to use as the background map for this location</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="X Coordinate"
                type="number"
                fullWidth
                value={newLocation.coordinates[0]}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: [parseFloat(e.target.value) || 0, newLocation.coordinates[1]] 
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">X:</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Y Coordinate"
                type="number"
                fullWidth
                value={newLocation.coordinates[1]}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: [newLocation.coordinates[0], parseFloat(e.target.value) || 0] 
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Y:</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newLocation.mixWithParent}
                    onChange={(e) => setNewLocation({ ...newLocation, mixWithParent: e.target.checked })}
                  />
                }
                label="Mix audio with parent location"
              />
              <Tooltip title="When enabled, entering this location will play its audio alongside the parent location's audio.">
                <IconButton size="small">
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveLocation} 
            variant="contained"
            disabled={!newLocation.name}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
      
      {/* Include the AudioTrackPanel */}
      <AudioTrackPanel />
    </Box>
  );
}; 