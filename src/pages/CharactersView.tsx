import React from 'react';
import { useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useStore } from '../store';

export const CharactersView: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    type: 'npc' as 'npc' | 'merchant',
  });

  const { characters, addCharacter } = useStore();

  const handleAddCharacter = () => {
    addCharacter({
      name: newCharacter.name,
      description: newCharacter.description,
      type: newCharacter.type,
    });
    setIsAddDialogOpen(false);
    setNewCharacter({ name: '', description: '', type: 'npc' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Characters</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Character
        </Button>
      </Box>

      <Grid container spacing={3}>
        {characters.map((character) => (
          <Grid item xs={12} sm={6} md={4} key={character.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {character.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type: {character.type.charAt(0).toUpperCase() + character.type.slice(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {character.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Character</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newCharacter.name}
            onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newCharacter.description}
            onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newCharacter.type}
              label="Type"
              onChange={(e) => setNewCharacter({ ...newCharacter, type: e.target.value as 'npc' | 'merchant' })}
            >
              <MenuItem value="npc">NPC</MenuItem>
              <MenuItem value="merchant">Merchant</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCharacter} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 