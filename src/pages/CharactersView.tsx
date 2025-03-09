import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  Chip,
  Divider,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Autocomplete,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import PlaceIcon from '@mui/icons-material/Place';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import HelpIcon from '@mui/icons-material/Help';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import { AssetManager } from '../services/assetManager';
import { Character } from '../store';
import MarkdownContent from '../components/MarkdownContent';

export const CharactersView: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imageAssets, setImageAssets] = useState<string[]>([]);
  
  const { 
    characters, 
    addCharacter, 
    updateCharacter, 
    deleteCharacter, 
    saveDataToIndexedDB,
    locations
  } = useStore();
  
  // New character form data
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    type: 'npc' as 'npc' | 'merchant' | 'enemy' | 'player',
    locationId: '',
    descriptionType: 'markdown' as 'markdown' | 'image' | 'pdf',
    descriptionAssetName: '',
    hp: 10 as number | string  // Modified to allow string during editing
  });
  
  // Currently editing character id
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  
  // Load image assets
  useEffect(() => {
    if (isAddDialogOpen || isEditDialogOpen) {
      const loadAssets = async () => {
        const imageAssetsData = await AssetManager.getAssets('images');
        setImageAssets(imageAssetsData.map(asset => asset.name));
      };
      loadAssets();
    }
  }, [isAddDialogOpen, isEditDialogOpen]);
  
  // Add a new character
  const handleAddCharacter = () => {
    const character: Omit<Character, 'id'> = {
      name: newCharacter.name,
      description: newCharacter.description,
      type: newCharacter.type,
      hp: typeof newCharacter.hp === 'string' 
           ? (parseInt(newCharacter.hp) || 1) 
           : (newCharacter.hp || 1)  // Ensure we always have a valid number
    };
    
    if (newCharacter.locationId) {
      character.locationId = newCharacter.locationId;
    }
    
    character.descriptionType = newCharacter.descriptionType;
    
    if (newCharacter.descriptionAssetName) {
      character.descriptionAssetName = newCharacter.descriptionAssetName;
    }
    
    addCharacter(character);
    
    setIsAddDialogOpen(false);
    resetCharacterForm();
    showSnackbar('Character added successfully');
  };
  
  // Reset the character form
  const resetCharacterForm = () => {
    setNewCharacter({
      name: '',
      description: '',
      type: 'npc',
      locationId: '',
      descriptionType: 'markdown',
      descriptionAssetName: '',
      hp: 10
    });
  };
  
  // Open edit dialog for a character
  const handleEditCharacter = (characterId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (character) {
      setEditingCharacter(characterId);
      setNewCharacter({
        name: character.name,
        description: character.description,
        type: character.type,
        locationId: character.locationId || '',
        descriptionType: character.descriptionType || 'markdown',
        descriptionAssetName: character.descriptionAssetName || '',
        hp: character.hp
      });
      setIsEditDialogOpen(true);
    }
  };
  
  // Save edited character
  const handleSaveCharacter = () => {
    if (editingCharacter) {
      const characterUpdate: Partial<Omit<Character, 'id'>> = {
        name: newCharacter.name,
        description: newCharacter.description,
        type: newCharacter.type,
        hp: typeof newCharacter.hp === 'string' 
            ? (parseInt(newCharacter.hp) || 1) 
            : (newCharacter.hp || 1),  // Ensure we always have a valid number
        descriptionType: newCharacter.descriptionType
      };
      
      if (newCharacter.locationId) {
        characterUpdate.locationId = newCharacter.locationId;
      }
      
      if (newCharacter.descriptionAssetName) {
        characterUpdate.descriptionAssetName = newCharacter.descriptionAssetName;
      }
      
      updateCharacter(editingCharacter, characterUpdate);
      
      setIsEditDialogOpen(false);
      resetCharacterForm();
      showSnackbar('Character updated successfully');
    }
  };
  
  // Confirm and delete a character
  const handleDeleteCharacter = (characterId: string) => {
    if (window.confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      deleteCharacter(characterId);
      showSnackbar('Character deleted successfully');
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
  
  // Render a character card
  const renderCharacterCard = (character: Character) => {
    const location = character.locationId 
      ? locations.find(loc => loc.id === character.locationId)
      : null;
      
    return (
      <Grid item xs={12} sm={6} md={5} key={character.id}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6">
                  {character.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    icon={
                      character.type === 'npc' ? <PersonIcon /> : 
                      character.type === 'merchant' ? <StoreIcon /> : 
                      character.type === 'enemy' ? <SportsKabaddiIcon /> :
                      <VideogameAssetIcon />
                    }
                    label={
                      character.type === 'npc' ? 'NPC' : 
                      character.type === 'merchant' ? 'Merchant' : 
                      character.type === 'enemy' ? 'Enemy' : 'Player'
                    }
                    size="small"
                    color={
                      character.type === 'npc' ? 'primary' : 
                      character.type === 'merchant' ? 'secondary' : 
                      character.type === 'enemy' ? 'error' : 
                      'success'
                    }
                    variant="outlined"
                  />
                  
                  {location && (
                    <Chip
                      icon={<PlaceIcon />}
                      label={location.name}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                  <Chip
                    label={`HP: ${character.hp}`}
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
                
                <Box sx={{ mt: 1, mb: 2 }}>
                  {character.descriptionType === 'markdown' && (
                    <MarkdownContent 
                      content={character.description} 
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
                  )}
                  {character.descriptionType !== 'markdown' && (
                    <Typography variant="body2" color="text.secondary">
                      {character.description}
                    </Typography>
                  )}
                </Box>
                
                {character.inventory && character.inventory.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      <InventoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Inventory ({character.inventory.length})
                    </Typography>
                    <List dense>
                      {character.inventory.slice(0, 3).map((item: any) => (
                        <ListItem key={item.id} disablePadding>
                          <ListItemText 
                            primary={item.name} 
                            secondary={`Qty: ${item.quantity}${item.price ? ` - Price: ${item.price}` : ''}`} 
                          />
                        </ListItem>
                      ))}
                      {character.inventory.length > 3 && (
                        <ListItem disablePadding>
                          <ListItemText 
                            primary={`+ ${character.inventory.length - 3} more items`} 
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </>
                )}
              </Box>
              
              <Box>
                <IconButton onClick={() => handleEditCharacter(character.id)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteCharacter(character.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Characters</Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="success" 
            startIcon={<SaveIcon />} 
            onClick={handleSaveData}
            disabled={isSaving}
            sx={{ mr: 2 }}
          >
            {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              resetCharacterForm();
              setIsAddDialogOpen(true);
            }}
          >
            Add Character
          </Button>
        </Box>
      </Box>
      
      {characters.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Characters Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Add your first character to get started.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Character
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {characters.map(character => renderCharacterCard(character))}
        </Grid>
      )}
      
      {/* Add Character Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Character</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Name"
                fullWidth
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Character Type</InputLabel>
                <Select
                  value={newCharacter.type}
                  label="Character Type"
                  onChange={(e) => setNewCharacter({ 
                    ...newCharacter, 
                    type: e.target.value as 'npc' | 'merchant' | 'enemy' | 'player' 
                  })}
                >
                  <MenuItem value="npc">NPC</MenuItem>
                  <MenuItem value="merchant">Merchant</MenuItem>
                  <MenuItem value="enemy">Enemy</MenuItem>
                  <MenuItem value="player">Player Character</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Hit Points (HP)"
                fullWidth
                value={newCharacter.hp}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for easier editing
                  if (value === '') {
                    setNewCharacter({
                      ...newCharacter,
                      hp: ''
                    });
                  } else {
                    // Try to parse as integer, but don't force conversion yet
                    const parsed = parseInt(value);
                    if (!isNaN(parsed)) {
                      setNewCharacter({
                        ...newCharacter,
                        hp: parsed
                      });
                    }
                  }
                }}
                onBlur={() => {
                  // When field loses focus, ensure we have a valid number
                  const hp = newCharacter.hp;
                  if (hp === '' || hp === null || isNaN(Number(hp))) {
                    setNewCharacter({
                      ...newCharacter,
                      hp: 1
                    });
                  }
                }}
                helperText="Minimum value is 1"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={locations}
                value={locations.find(loc => loc.id === newCharacter.locationId) || null}
                onChange={(_, newValue) => setNewCharacter({ 
                  ...newCharacter, 
                  locationId: newValue?.id || '' 
                })}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
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
                  value={newCharacter.descriptionType}
                  label="Description Type"
                  onChange={(e) => setNewCharacter({ 
                    ...newCharacter, 
                    descriptionType: e.target.value as 'markdown' | 'image' | 'pdf' 
                  })}
                >
                  <MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {newCharacter.descriptionType === 'markdown' ? (
              <>
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
                    multiline
                    rows={6}
                    fullWidth
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                  />
                </Grid>
                
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
                    <MarkdownContent content={newCharacter.description} />
                  </Paper>
                </Grid>
              </>
            ) : newCharacter.descriptionType === 'image' || newCharacter.descriptionType === 'pdf' ? (
              <>
                <Grid item xs={12}>
                  <Autocomplete
                    options={imageAssets}
                    value={newCharacter.descriptionAssetName || null}
                    onChange={(_, newValue) => setNewCharacter({ 
                      ...newCharacter, 
                      descriptionAssetName: newValue || '' 
                    })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Description Asset"
                        fullWidth
                        helperText={`Select a ${newCharacter.descriptionType} file from assets`}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Brief Description"
                    multiline
                    rows={3}
                    fullWidth
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                    helperText="Add a brief description text to show in lists"
                  />
                </Grid>
              </>
            ) : null}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCharacter} 
            variant="contained"
            disabled={!newCharacter.name}
          >
            Add Character
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Character Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Character</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Name"
                fullWidth
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Character Type</InputLabel>
                <Select
                  value={newCharacter.type}
                  label="Character Type"
                  onChange={(e) => setNewCharacter({ 
                    ...newCharacter, 
                    type: e.target.value as 'npc' | 'merchant' | 'enemy' | 'player' 
                  })}
                >
                  <MenuItem value="npc">NPC</MenuItem>
                  <MenuItem value="merchant">Merchant</MenuItem>
                  <MenuItem value="enemy">Enemy</MenuItem>
                  <MenuItem value="player">Player Character</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Hit Points (HP)"
                fullWidth
                value={newCharacter.hp}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for easier editing
                  if (value === '') {
                    setNewCharacter({
                      ...newCharacter,
                      hp: ''
                    });
                  } else {
                    // Try to parse as integer, but don't force conversion yet
                    const parsed = parseInt(value);
                    if (!isNaN(parsed)) {
                      setNewCharacter({
                        ...newCharacter,
                        hp: parsed
                      });
                    }
                  }
                }}
                onBlur={() => {
                  // When field loses focus, ensure we have a valid number
                  const hp = newCharacter.hp;
                  if (hp === '' || hp === null || isNaN(Number(hp))) {
                    setNewCharacter({
                      ...newCharacter,
                      hp: 1
                    });
                  }
                }}
                helperText="Minimum value is 1"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={locations}
                value={locations.find(loc => loc.id === newCharacter.locationId) || null}
                onChange={(_, newValue) => setNewCharacter({ 
                  ...newCharacter, 
                  locationId: newValue?.id || '' 
                })}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
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
                  value={newCharacter.descriptionType}
                  label="Description Type"
                  onChange={(e) => setNewCharacter({ 
                    ...newCharacter, 
                    descriptionType: e.target.value as 'markdown' | 'image' | 'pdf' 
                  })}
                >
                  <MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {newCharacter.descriptionType === 'markdown' ? (
              <>
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
                    multiline
                    rows={6}
                    fullWidth
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                  />
                </Grid>
                
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
                    <MarkdownContent content={newCharacter.description} />
                  </Paper>
                </Grid>
              </>
            ) : newCharacter.descriptionType === 'image' || newCharacter.descriptionType === 'pdf' ? (
              <>
                <Grid item xs={12}>
                  <Autocomplete
                    options={imageAssets}
                    value={newCharacter.descriptionAssetName || null}
                    onChange={(_, newValue) => setNewCharacter({ 
                      ...newCharacter, 
                      descriptionAssetName: newValue || '' 
                    })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Description Asset"
                        fullWidth
                        helperText={`Select a ${newCharacter.descriptionType} file from assets`}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Brief Description"
                    multiline
                    rows={3}
                    fullWidth
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                    helperText="Add a brief description text to show in lists"
                  />
                </Grid>
              </>
            ) : null}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveCharacter} 
            variant="contained"
            disabled={!newCharacter.name}
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
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* Include the AudioTrackPanel */}
      <AudioTrackPanel />
    </Box>
  );
}; 