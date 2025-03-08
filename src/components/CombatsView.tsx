import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  Divider,
  ButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useStore } from '../store';
import { Combat, Character } from '../store';
import { AssetManager } from '../services/assetManager';

// Interface for enemy instances with count
interface EnemyInstance {
  character: Character;
  count: number;
}

export const CombatsView: React.FC = () => {
  const { combats, characters, locations, addCombat, updateCombat, deleteCombat } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCombat, setSelectedCombat] = useState<Combat | null>(null);
  const [audioAssets, setAudioAssets] = useState<string[]>([]);
  const [imageAssets, setImageAssets] = useState<string[]>([]);
  const [enemyInstances, setEnemyInstances] = useState<EnemyInstance[]>([]);
  const [editedCombat, setEditedCombat] = useState<Partial<Combat>>({
    name: '',
    description: '',
    descriptionType: 'markdown',
    playerCharacters: [],
    enemies: [],
    difficulty: 'medium',
  });

  // Filter characters by type
  const playerCharacters = characters.filter(char => char.type === 'player');
  const enemyCharacters = characters.filter(char => char.type === 'enemy');

  // Load audio assets when the dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const loadAssets = async () => {
        const audioAssetsData = await AssetManager.getAssets('audio');
        setAudioAssets(audioAssetsData.map(asset => asset.name));
        
        const imageAssetsData = await AssetManager.getAssets('images');
        setImageAssets(imageAssetsData.map(asset => asset.name));
      };
      loadAssets();
    }
  }, [isDialogOpen]);

  // Initialize enemy instances when the dialog opens or when editing a combat
  useEffect(() => {
    if (isDialogOpen && selectedCombat) {
      // Create a map to count occurrences of each enemy
      const enemyCounts = new Map<string, number>();
      const enemyMap = new Map<string, Character>();
      
      selectedCombat.enemies.forEach(enemy => {
        const count = enemyCounts.get(enemy.id) || 0;
        enemyCounts.set(enemy.id, count + 1);
        enemyMap.set(enemy.id, enemy);
      });
      
      // Convert to instances array
      const instances: EnemyInstance[] = [];
      enemyCounts.forEach((count, id) => {
        const character = enemyMap.get(id);
        if (character) {
          instances.push({ character, count });
        }
      });
      
      setEnemyInstances(instances);
    } else if (isDialogOpen && !selectedCombat) {
      // Reset for new combat
      setEnemyInstances([]);
    }
  }, [isDialogOpen, selectedCombat]);

  const handleAddClick = () => {
    setSelectedCombat(null);
    setEditedCombat({
      name: '',
      description: '',
      descriptionType: 'markdown',
      playerCharacters: [],
      enemies: [],
      difficulty: 'medium',
    });
    setEnemyInstances([]);
    setIsDialogOpen(true);
  };

  const handleEditClick = (combat: Combat) => {
    setSelectedCombat(combat);
    setEditedCombat({ ...combat });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (combatId: string) => {
    if (window.confirm('Are you sure you want to delete this combat?')) {
      deleteCombat(combatId);
    }
  };

  const handleSave = () => {
    if (!editedCombat.name) {
      alert('Please fill in all required fields');
      return;
    }

    // Expand enemy instances into flat array of enemies
    let expandedEnemies: Character[] = [];
    enemyInstances.forEach(instance => {
      for (let i = 0; i < instance.count; i++) {
        expandedEnemies.push(instance.character);
      }
    });

    const updatedCombat = {
      ...editedCombat,
      enemies: expandedEnemies
    };

    if (selectedCombat) {
      // Update existing combat
      updateCombat(selectedCombat.id, updatedCombat);
    } else {
      // Add new combat
      addCombat(updatedCombat as Omit<Combat, 'id'>);
    }

    setIsDialogOpen(false);
  };

  const handleCharacterSelection = (characterIds: string[], field: 'playerCharacters' | 'enemies') => {
    if (field === 'playerCharacters') {
      const selectedCharacters = characters.filter(char => characterIds.includes(char.id));
      setEditedCombat(prev => ({
        ...prev,
        playerCharacters: selectedCharacters
      }));
    }
  };

  const handleAddEnemy = (enemyId: string) => {
    const enemy = enemyCharacters.find(char => char.id === enemyId);
    if (!enemy) return;
    
    // Check if the enemy is already in instances
    const existingIndex = enemyInstances.findIndex(instance => instance.character.id === enemyId);
    
    if (existingIndex >= 0) {
      // Increment count for existing enemy
      const updatedInstances = [...enemyInstances];
      updatedInstances[existingIndex] = {
        ...updatedInstances[existingIndex],
        count: updatedInstances[existingIndex].count + 1
      };
      setEnemyInstances(updatedInstances);
    } else {
      // Add new enemy instance
      setEnemyInstances([...enemyInstances, { character: enemy, count: 1 }]);
    }
  };

  const handleRemoveEnemy = (enemyId: string) => {
    const existingIndex = enemyInstances.findIndex(instance => instance.character.id === enemyId);
    
    if (existingIndex >= 0) {
      const updatedInstances = [...enemyInstances];
      
      if (updatedInstances[existingIndex].count > 1) {
        // Decrement count
        updatedInstances[existingIndex] = {
          ...updatedInstances[existingIndex],
          count: updatedInstances[existingIndex].count - 1
        };
      } else {
        // Remove the instance completely
        updatedInstances.splice(existingIndex, 1);
      }
      
      setEnemyInstances(updatedInstances);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Combat Encounters</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Combat
        </Button>
      </Box>

      <Grid container spacing={3}>
        {combats.map((combat) => (
          <Grid item xs={12} md={6} key={combat.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {combat.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Difficulty: {combat.difficulty || 'Not set'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {combat.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Players ({combat.playerCharacters.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {combat.playerCharacters.map(pc => (
                          <Chip
                            key={pc.id}
                            label={`${pc.name} (HP: ${pc.hp})`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                        {combat.playerCharacters.length === 0 && (
                          <Typography variant="body2" color="text.secondary">No players assigned</Typography>
                        )}
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Enemies ({combat.enemies.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {/* Group enemies by ID for display */}
                        {Object.entries(combat.enemies.reduce((acc, enemy) => {
                          acc[enemy.id] = (acc[enemy.id] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)).map(([id, count]) => {
                          const enemy = combat.enemies.find(e => e.id === id);
                          return enemy ? (
                            <Chip
                              key={id}
                              label={`${enemy.name} ${count > 1 ? `(${count}) ` : ''}(HP: ${enemy.hp})`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                        {combat.enemies.length === 0 && (
                          <Typography variant="body2" color="text.secondary">No enemies assigned</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEditClick(combat)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(combat.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCombat ? 'Edit Combat' : 'New Combat'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={editedCombat.name || ''}
              onChange={(e) => setEditedCombat(prev => ({ ...prev, name: e.target.value }))}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={editedCombat.description || ''}
              onChange={(e) => setEditedCombat(prev => ({ ...prev, description: e.target.value }))}
            />

            <FormControl fullWidth>
              <InputLabel>Description Type</InputLabel>
              <Select
                value={editedCombat.descriptionType || 'markdown'}
                label="Description Type"
                onChange={(e) => setEditedCombat(prev => ({ ...prev, descriptionType: e.target.value as 'markdown' | 'image' | 'pdf' }))}
              >
                <MenuItem value="markdown">Markdown</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>

            {editedCombat.descriptionType !== 'markdown' && (
              <Autocomplete
                options={imageAssets}
                value={editedCombat.descriptionAssetName || null}
                onChange={(_, newValue) => setEditedCombat(prev => ({ ...prev, descriptionAssetName: newValue || undefined }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Description Asset"
                    helperText="Select an image or PDF file from assets"
                  />
                )}
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Player Characters</InputLabel>
              <Select
                multiple
                value={(editedCombat.playerCharacters || []).map(pc => pc.id)}
                label="Player Characters"
                onChange={(e) => handleCharacterSelection(e.target.value as string[], 'playerCharacters')}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const character = playerCharacters.find(c => c.id === id);
                      return character ? (
                        <Chip 
                          key={id} 
                          label={character.name} 
                          size="small" 
                          color="success"
                        />
                      ) : null;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                    },
                  },
                }}
              >
                {playerCharacters.map((character) => (
                  <MenuItem key={character.id} value={character.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{character.name}</span>
                      <Typography variant="body2" color="text.secondary">
                        HP: {character.hp}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                {playerCharacters.length === 0 && (
                  <MenuItem disabled>
                    No player characters available. Add some first.
                  </MenuItem>
                )}
              </Select>
              <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                Select multiple player characters (hold Ctrl/Cmd to select multiple)
              </Typography>
            </FormControl>

            {/* Enemies Section with Add/Remove functionality */}
            <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Enemies
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Autocomplete
                  options={enemyCharacters}
                  getOptionLabel={(character) => character.name}
                  renderOption={(props, character) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{character.name}</span>
                        <Typography variant="body2" color="text.secondary">
                          HP: {character.hp}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Enemy"/>
                  )}
                  onChange={(_, character) => {
                    if (character) {
                      handleAddEnemy(character.id);
                    }
                  }}
                  value={null}
                  noOptionsText="No enemy characters available. Add some first."
                />
              </FormControl>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Current Enemies:
              </Typography>
              
              {enemyInstances.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No enemies added to this combat. Select enemies above.
                </Typography>
              ) : (
                <List>
                  {enemyInstances.map((instance, index) => (
                    <ListItem key={index} divider={index < enemyInstances.length - 1}>
                      <ListItemText 
                        primary={instance.character.name} 
                        secondary={`HP: ${instance.character.hp}`} 
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          Quantity: {instance.count}
                        </Typography>
                        <ButtonGroup size="small">
                          <Button 
                            onClick={() => handleAddEnemy(instance.character.id)}
                            color="primary"
                          >
                            <AddIcon fontSize="small" />
                          </Button>
                          <Button 
                            onClick={() => handleRemoveEnemy(instance.character.id)}
                            color="error"
                          >
                            <RemoveIcon fontSize="small" />
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={editedCombat.difficulty || 'medium'}
                label="Difficulty"
                onChange={(e) => setEditedCombat(prev => ({ ...prev, difficulty: e.target.value as Combat['difficulty'] }))}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              options={locations}
              value={locations.find(loc => loc.id === editedCombat.locationId) || null}
              onChange={(_, newValue) => setEditedCombat(prev => ({ 
                ...prev, 
                locationId: newValue?.id || undefined 
              }))}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  helperText="Select a location for this combat"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            <Autocomplete
              options={audioAssets}
              value={editedCombat.entrySound || null}
              onChange={(_, newValue) => setEditedCombat(prev => ({ ...prev, entrySound: newValue || undefined }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Entry Sound"
                  helperText="Select an audio file from assets"
                />
              )}
            />

            <Autocomplete
              options={audioAssets}
              value={editedCombat.backgroundMusic || null}
              onChange={(_, newValue) => setEditedCombat(prev => ({ ...prev, backgroundMusic: newValue || undefined }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Background Music"
                  helperText="Select an audio file from assets"
                />
              )}
            />

            <Autocomplete
              options={imageAssets}
              value={editedCombat.backgroundImage || null}
              onChange={(_, newValue) => setEditedCombat(prev => ({ ...prev, backgroundImage: newValue || undefined }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Background Image"
                  helperText="Select an image file from assets"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 