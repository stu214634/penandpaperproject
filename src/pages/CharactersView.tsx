import React, { useState } from 'react';
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
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useStore } from '../store';
import { AudioTrackPanel } from '../components/AudioTrackPanel';

export const CharactersView: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    characters, 
    addCharacter, 
    updateCharacter, 
    deleteCharacter, 
    saveDataToIndexedDB 
  } = useStore();
  
  // New character form data
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    type: 'npc' as 'npc' | 'merchant',
  });
  
  // Currently editing character id
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  
  // Add a new character
  const handleAddCharacter = () => {
    addCharacter({
      name: newCharacter.name,
      description: newCharacter.description,
      type: newCharacter.type,
    });
    
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
      });
      setIsEditDialogOpen(true);
    }
  };
  
  // Save edited character
  const handleSaveCharacter = () => {
    if (editingCharacter) {
      updateCharacter(editingCharacter, {
        name: newCharacter.name,
        description: newCharacter.description,
        type: newCharacter.type,
      });
      
      setIsEditDialogOpen(false);
      resetCharacterForm();
      setEditingCharacter(null);
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
  const renderCharacterCard = (character: any) => {
    return (
      <Grid item xs={12} sm={6} md={4} key={character.id}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6">
                  {character.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    icon={character.type === 'npc' ? <PersonIcon /> : <StoreIcon />}
                    label={character.type === 'npc' ? 'NPC' : 'Merchant'}
                    size="small"
                    color={character.type === 'npc' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {character.description}
                </Typography>
                
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
            {isSaving ? 'Saving...' : 'Save Changes'}
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
                    type: e.target.value as 'npc' | 'merchant' 
                  })}
                >
                  <MenuItem value="npc">NPC</MenuItem>
                  <MenuItem value="merchant">Merchant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
              />
            </Grid>
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
                    type: e.target.value as 'npc' | 'merchant' 
                  })}
                >
                  <MenuItem value="npc">NPC</MenuItem>
                  <MenuItem value="merchant">Merchant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
              />
            </Grid>
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
        message={snackbarMessage}
      />
      
      {/* Include the AudioTrackPanel */}
      <AudioTrackPanel />
    </Box>
  );
}; 