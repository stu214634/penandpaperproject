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
  FormHelperText,
  Autocomplete
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
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '../store';
import { AssetManager } from '../services/assetManager';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import MarkdownContent from '../components/MarkdownContent';

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
    descriptionType: 'markdown' as 'markdown' | 'image' | 'pdf',
    parentLocationId: '',
    coordinates: [0, 0] as [number | string, number | string],
    mixWithParent: false,
    connectedLocations: [] as string[]
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

  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [viewingLocationDescription, setViewingLocationDescription] = useState<string>("");
  const [viewingLocationName, setViewingLocationName] = useState<string>("");

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
      descriptionType: newLocation.descriptionType,
      coordinates: typeof newLocation.coordinates[0] === 'number' && typeof newLocation.coordinates[1] === 'number' 
        ? newLocation.coordinates as [number, number] 
        : [0, 0],
      parentLocationId: newLocation.parentLocationId || undefined,
      mixWithParent: newLocation.mixWithParent,
      connectedLocations: newLocation.connectedLocations.length > 0 ? newLocation.connectedLocations : undefined
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
      descriptionType: 'markdown' as 'markdown' | 'image' | 'pdf',
      parentLocationId: '',
      coordinates: [0, 0] as [number | string, number | string],
      mixWithParent: false,
      connectedLocations: []
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
        descriptionType: location.descriptionType || 'markdown',
        parentLocationId: location.parentLocationId || '',
        coordinates: location.coordinates || [0, 0] as [number | string, number | string],
        mixWithParent: location.mixWithParent || false,
        connectedLocations: location.connectedLocations || []
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
        descriptionType: newLocation.descriptionType,
        coordinates: typeof newLocation.coordinates[0] === 'number' && typeof newLocation.coordinates[1] === 'number' 
          ? newLocation.coordinates as [number, number] 
          : [0, 0],
        parentLocationId: newLocation.parentLocationId || undefined,
        mixWithParent: newLocation.mixWithParent,
        connectedLocations: newLocation.connectedLocations.length > 0 ? newLocation.connectedLocations : undefined
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
                
                <Box
                  onClick={() => {
                    setViewingLocationDescription(location.description);
                    setViewingLocationName(location.name);
                    setShowDescriptionDialog(true);
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    borderRadius: 1,
                    p: 1,
                    mt: 1
                  }}
                >
                  <Box 
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <MarkdownContent 
                      content={location.description} 
                      sx={{
                        '& table': {
                          display: 'block',
                          maxWidth: '100%',
                          overflow: 'auto',
                          whiteSpace: 'nowrap',
                        },
                        '& th, & td': {
                          px: 1,
                          py: 0.5,
                          fontSize: '0.8rem',
                        }
                      }}
                    />
                  </Box>
                  {location.description.length > 100 && (
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Click to view full description
                    </Typography>
                  )}
                </Box>
                
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
                  
                  {location.connectedLocations && location.connectedLocations.length > 0 && (
                    <Chip 
                      label={`${location.connectedLocations.length} Connected Locations`}
                      size="small"
                      color="success"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        const connectedNames = location.connectedLocations
                          .map((id: string) => locations.find(loc => loc.id === id)?.name || 'Unknown')
                          .join(', ');
                        alert(`Connected to: ${connectedNames}`);
                      }}
                    />
                  )}

                  {hasSublocations && (
                    <Chip 
                      label={`${sublocations.length} Sublocations`}
                      size="small"
                      color="success"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        const sublocationNames = sublocations
                          .map((loc: any) => loc.name)
                          .join(', ');
                        alert(`Sublocations: ${sublocationNames}`);
                      }}
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
              <Autocomplete
                options={locations}
                value={locations.find(loc => loc.id === newLocation.parentLocationId) || null}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  parentLocationId: newValue?.id || '' 
                })}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Parent Location"
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Description Type</InputLabel>
                <Select
                  value={newLocation.descriptionType}
                  label="Description Type"
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    descriptionType: e.target.value as 'markdown' | 'image' | 'pdf' 
                  })}
                >
                  <MenuItem value="markdown">Markdown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Description</Typography>
                <Tooltip title={
                  <>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                      Markdown Table Example:
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}>
                      | Header 1 | Header 2 | Header 3 |\n
                      | -------- | -------- | -------- |\n
                      | Cell 1   | Cell 2   | Cell 3   |\n
                      | Cell 4   | Cell 5   | Cell 6   |
                    </Typography>
                  </>
                }>
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </Grid>

            {newLocation.descriptionType === 'markdown' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Preview
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    height: '200px', 
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <MarkdownContent content={newLocation.description} />
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={locations.filter(loc => loc.id !== newLocation.parentLocationId)}
                value={locations.filter(loc => newLocation.connectedLocations.includes(loc.id))}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={audioFiles}
                value={newLocation.backgroundMusic}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  backgroundMusic: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Background Music"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={audioFiles}
                value={newLocation.entrySound}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  entrySound: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Entry Sound"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={imageFiles}
                value={newLocation.imageUrl}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  imageUrl: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Background Image"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    label="X Coordinate"
                    fullWidth
                    value={newLocation.coordinates[0]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for easier editing
                      if (value === '') {
                        setNewLocation({
                          ...newLocation,
                          coordinates: ['', newLocation.coordinates[1]]
                        });
                      } else {
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                          setNewLocation({
                            ...newLocation,
                            coordinates: [parsed, newLocation.coordinates[1]]
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      // When field loses focus, ensure we have a valid number
                      const x = newLocation.coordinates[0];
                      if (x === '' || x === null || isNaN(Number(x))) {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [0, newLocation.coordinates[1]]
                        });
                      }
                    }}
                    InputProps={{
                      inputProps: { 
                        step: 0.01,
                      }
                    }}
                    helperText={newLocation.parentLocationId ? "Value between 0-1 (0.5 is center)" : undefined}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Y Coordinate"
                    fullWidth
                    value={newLocation.coordinates[1]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for easier editing
                      if (value === '') {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [newLocation.coordinates[0], '']
                        });
                      } else {
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                          setNewLocation({
                            ...newLocation,
                            coordinates: [newLocation.coordinates[0], parsed]
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      // When field loses focus, ensure we have a valid number
                      const y = newLocation.coordinates[1];
                      if (y === '' || y === null || isNaN(Number(y))) {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [newLocation.coordinates[0], 0]
                        });
                      }
                    }}
                    InputProps={{
                      inputProps: { 
                        step: 0.01,
                      }
                    }}
                    helperText={newLocation.parentLocationId ? "Value between 0-1 (0.5 is center)" : undefined}
                  />
                </Grid>
              </Grid>
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
              <Autocomplete
                options={locations.filter(loc => loc.id !== editingLocation)}
                value={locations.find(loc => loc.id === newLocation.parentLocationId) || null}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  parentLocationId: newValue?.id || '' 
                })}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Parent Location"
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Description Type</InputLabel>
                <Select
                  value={newLocation.descriptionType}
                  label="Description Type"
                  onChange={(e) => setNewLocation({ 
                    ...newLocation, 
                    descriptionType: e.target.value as 'markdown' | 'image' | 'pdf' 
                  })}
                >
                  <MenuItem value="markdown">Markdown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Description</Typography>
                <Tooltip title={
                  <>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                      Markdown Table Example:
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}>
                      | Header 1 | Header 2 | Header 3 |\n
                      | -------- | -------- | -------- |\n
                      | Cell 1   | Cell 2   | Cell 3   |\n
                      | Cell 4   | Cell 5   | Cell 6   |
                    </Typography>
                  </>
                }>
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </Grid>

            {newLocation.descriptionType === 'markdown' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Preview
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    height: '200px', 
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <MarkdownContent content={newLocation.description} />
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={locations.filter(loc => loc.id !== editingLocation && loc.id !== newLocation.parentLocationId)}
                value={locations.filter(loc => newLocation.connectedLocations.includes(loc.id))}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={audioFiles}
                value={newLocation.backgroundMusic}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  backgroundMusic: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Background Music"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={audioFiles}
                value={newLocation.entrySound}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  entrySound: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Entry Sound"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={imageFiles}
                value={newLocation.imageUrl}
                onChange={(_, newValue) => setNewLocation({ 
                  ...newLocation, 
                  imageUrl: newValue || '' 
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Background Image"
                    fullWidth
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    label="X Coordinate"
                    fullWidth
                    value={newLocation.coordinates[0]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for easier editing
                      if (value === '') {
                        setNewLocation({
                          ...newLocation,
                          coordinates: ['', newLocation.coordinates[1]]
                        });
                      } else {
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                          setNewLocation({
                            ...newLocation,
                            coordinates: [parsed, newLocation.coordinates[1]]
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      // When field loses focus, ensure we have a valid number
                      const x = newLocation.coordinates[0];
                      if (x === '' || x === null || isNaN(Number(x))) {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [0, newLocation.coordinates[1]]
                        });
                      }
                    }}
                    InputProps={{
                      inputProps: { 
                        step: 0.01,
                      }
                    }}
                    helperText={newLocation.parentLocationId ? "Value between 0-1 (0.5 is center)" : undefined}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Y Coordinate"
                    fullWidth
                    value={newLocation.coordinates[1]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for easier editing
                      if (value === '') {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [newLocation.coordinates[0], '']
                        });
                      } else {
                        const parsed = parseFloat(value);
                        if (!isNaN(parsed)) {
                          setNewLocation({
                            ...newLocation,
                            coordinates: [newLocation.coordinates[0], parsed]
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      // When field loses focus, ensure we have a valid number
                      const y = newLocation.coordinates[1];
                      if (y === '' || y === null || isNaN(Number(y))) {
                        setNewLocation({
                          ...newLocation,
                          coordinates: [newLocation.coordinates[0], 0]
                        });
                      }
                    }}
                    InputProps={{
                      inputProps: { 
                        step: 0.01,
                      }
                    }}
                    helperText={newLocation.parentLocationId ? "Value between 0-1 (0.5 is center)" : undefined}
                  />
                </Grid>
              </Grid>
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
      
      {/* Description Dialog */}
      <Dialog
        open={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {viewingLocationName} - Description
          <IconButton
            aria-label="close"
            onClick={() => setShowDescriptionDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <MarkdownContent content={viewingLocationDescription} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDescriptionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 