import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Card,
  CardContent,
  Chip,
  Grid,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import AddIcon from '@mui/icons-material/Add';
import { useStore } from '../store';
import { Combat, Character } from '../store';

// Interface for a combat participant with initiative value
interface CombatParticipant {
  id: string;
  character: Character;
  initiative: number;
  isPlayerCharacter: boolean;
  currentHp: number;
}

interface CombatSessionViewProps {
  combat: Combat;
  onClose: () => void;
}

export const CombatSessionView: React.FC<CombatSessionViewProps> = ({ combat, onClose }) => {
  const { characters, playTrack, stopIndividualTrack } = useStore();
  
  // State for combat participants with initiative
  const [participants, setParticipants] = useState<CombatParticipant[]>([]);
  // Track the current participant's index
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  // State for adding new participants
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Character | null>(null);
  const [newInitiative, setNewInitiative] = useState<number>(10);
  // Background image url
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  
  // Initialize combat on mount
  useEffect(() => {
    initializeCombat();
    
    // Clean up when unmounting
    return () => {
      // Stop any audio we started in this component
      stopAllCombatAudio(); // Use centralized function to stop audio
    };
  }, []);
  
  const initializeCombat = async () => {
    // Stop any existing audio tracks for this combat
    stopAllCombatAudio();
    
    // Play entry sound if available
    if (combat.entrySound) {
      const entrySoundName = combat.entrySound.split('/').pop() || combat.entrySound;
      const entrySoundPath = `/audio/${entrySoundName}`;
      playTrack(entrySoundPath, { 
        replace: false,
        loop: false,
        locationId: `combat-entry-${combat.id}`
      });
    }
    
    // Play background music if available
    if (combat.backgroundMusic) {
      const musicName = combat.backgroundMusic.split('/').pop() || combat.backgroundMusic;
      const musicPath = `/audio/${musicName}`;
      playTrack(musicPath, { 
        replace: false,
        loop: true,
        locationId: `combat-bgm-${combat.id}`
      });
    }
    
    // Load background image if available
    if (combat.backgroundImage) {
      try {
        const imageUrl = await getBackgroundImageUrl(combat.backgroundImage);
        setBackgroundImageUrl(imageUrl);
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }
    
    // Initialize participants with random initiative values
    const initialParticipants: CombatParticipant[] = [
      // Add player characters
      ...combat.playerCharacters.map(char => ({
        id: `${char.id}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for each instance
        character: char,
        initiative: Math.floor(Math.random() * 20) + 1, // Random initiative 1-20
        isPlayerCharacter: true,
        currentHp: char.hp,
      })),
      
      // Add enemy characters
      ...combat.enemies.map(char => ({
        id: `${char.id}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for each instance
        character: char,
        initiative: Math.floor(Math.random() * 20) + 1, // Random initiative 1-20
        isPlayerCharacter: false,
        currentHp: char.hp,
      })),
    ];
    
    // Sort by initiative (highest to lowest)
    const sortedParticipants = initialParticipants.sort((a, b) => b.initiative - a.initiative);
    setParticipants(sortedParticipants);
  };
  
  const getBackgroundImageUrl = async (imageName: string): Promise<string> => {
    // Get image URL from the AssetManager
    const url = await import('../services/assetManager').then(module => {
      return module.AssetManager.getAssetUrl('images', imageName);
    });
    return url || '';
  };
  
  const handleNextTurn = () => {
    // Move to the next participant in the initiative order
    setCurrentTurnIndex(prevIndex => {
      // Loop back to the beginning if we reach the end
      return (prevIndex + 1) % participants.length;
    });
  };
  
  const handleSetInitiative = (participantId: string, value: number) => {
    // Update initiative for a participant
    const updatedParticipants = participants.map(p => 
      p.id === participantId ? { ...p, initiative: value } : p
    );
    
    // Sort by initiative (highest to lowest)
    const sortedParticipants = updatedParticipants.sort((a, b) => b.initiative - a.initiative);
    
    // Find new index of the current turn participant
    const currentParticipant = participants[currentTurnIndex];
    const newCurrentIndex = sortedParticipants.findIndex(p => p.id === currentParticipant.id);
    
    setParticipants(sortedParticipants);
    setCurrentTurnIndex(newCurrentIndex >= 0 ? newCurrentIndex : 0);
  };
  
  const handleUpdateHP = (participantId: string, newHp: number) => {
    setParticipants(prev => 
      prev.map(p => p.id === participantId ? { ...p, currentHp: newHp } : p)
    );
  };
  
  const handleAddParticipant = () => {
    if (!newParticipant) return;
    
    const newEntry: CombatParticipant = {
      id: `${newParticipant.id}-${Math.random().toString(36).substring(2, 9)}`,
      character: newParticipant,
      initiative: newInitiative,
      isPlayerCharacter: newParticipant.type === 'player',
      currentHp: newParticipant.hp,
    };
    
    // Add and sort
    const updatedParticipants = [...participants, newEntry].sort((a, b) => b.initiative - a.initiative);
    
    setParticipants(updatedParticipants);
    setShowAddParticipantDialog(false);
    setNewParticipant(null);
    setNewInitiative(10);
  };
  
  const handleRemoveParticipant = (participantId: string) => {
    // Remove participant and adjust current turn if needed
    const participantIndex = participants.findIndex(p => p.id === participantId);
    const isCurrentTurn = participantIndex === currentTurnIndex;
    
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    
    // If we removed the current turn, or a participant before the current turn
    let newTurnIndex = currentTurnIndex;
    if (participantIndex <= currentTurnIndex) {
      // If we removed the last participant and it was the current turn
      if (isCurrentTurn && participantIndex === participants.length - 1) {
        newTurnIndex = 0; // Loop back to the first participant
      } else {
        // Otherwise, decrement the turn index (it shifts up by one)
        newTurnIndex = Math.max(0, currentTurnIndex - 1);
      }
    }
    
    setParticipants(updatedParticipants);
    setCurrentTurnIndex(newTurnIndex);
  };
  
  const getCurrentParticipant = () => {
    return participants.length > 0 ? participants[currentTurnIndex] : null;
  };
  
  const currentParticipant = getCurrentParticipant();
  
  // Add a function to stop all combat-related audio
  const stopAllCombatAudio = () => {
    if (combat.entrySound) {
      const entrySoundName = combat.entrySound.split('/').pop() || combat.entrySound;
      const entrySoundPath = `/audio/${entrySoundName}`;
      stopIndividualTrack(entrySoundPath);
    }
    if (combat.backgroundMusic) {
      const musicName = combat.backgroundMusic.split('/').pop() || combat.backgroundMusic;
      const musicPath = `/audio/${musicName}`;
      stopIndividualTrack(musicPath);
    }
  }
  
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: 'background.paper',
      pb: 10 // Add padding to the bottom of the entire container
    }}>
      {/* Background image if available */}
      {backgroundImageUrl && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            zIndex: 0
          }} 
        />
      )}
      
      {/* Header with combat name and close button */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 1,
        position: 'relative'
      }}>
        <Typography variant="h5" component="h1">
          {combat.name}
        </Typography>
        <Box>
          <Chip 
            label={`Difficulty: ${combat.difficulty || 'Medium'}`}
            color="primary"
            sx={{ mr: 1 }}
          />
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Main content area */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'auto',
        position: 'relative',
        zIndex: 1,
        pb: 6 // Add padding to the bottom to prevent overlap with audio controls
      }}>
        {/* Initiative tracker panel (left side) */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: 300, 
            display: 'flex', 
            flexDirection: 'column',
            m: 2,
            overflow: 'hidden',
            borderRadius: 2
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Initiative Order</Typography>
          </Box>
          
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {participants.map((participant, index) => (
              <ListItem 
                key={participant.id}
                secondaryAction={
                  <TextField
                    type="number"
                    size="small"
                    value={participant.initiative}
                    onChange={(e) => handleSetInitiative(participant.id, Number(e.target.value))}
                    sx={{ width: 70 }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                }
                sx={{ 
                  bgcolor: index === currentTurnIndex ? 'action.selected' : 'transparent',
                  borderLeft: index === currentTurnIndex ? 4 : 0,
                  borderColor: 'primary.main'
                }}
              >
                <ListItemIcon>
                  {participant.isPlayerCharacter ? (
                    <PersonIcon color="primary" />
                  ) : (
                    <SportsKabaddiIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={participant.character.name}
                  secondary={`HP: ${participant.currentHp}/${participant.character.hp}`}
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', mb: 8 }}>
            <Button 
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddParticipantDialog(true)}
            >
              Add
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNextTurn}
            >
              Next Turn
            </Button>
          </Box>
        </Paper>
        
        {/* Current turn details panel (right side) */}
        <Box sx={{ 
          flexGrow: 1, 
          m: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {currentParticipant ? (
            <Card elevation={3} sx={{ flexGrow: 1, borderRadius: 2 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: 1,
                  borderColor: 'divider'
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: currentParticipant.isPlayerCharacter ? 'primary.main' : 'error.main',
                      mr: 2
                    }}
                  >
                    {currentParticipant.isPlayerCharacter ? <PersonIcon /> : <SportsKabaddiIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{currentParticipant.character.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {currentParticipant.isPlayerCharacter ? 'Player Character' : 'Enemy'}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Character Details</Typography>
                    <Typography variant="body2" paragraph>
                      {currentParticipant.character.description}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Combat Stats</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Hit Points:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <TextField
                          type="number"
                          size="small"
                          value={currentParticipant.currentHp}
                          onChange={(e) => handleUpdateHP(currentParticipant.id, Number(e.target.value))}
                          sx={{ width: 80, mr: 2 }}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <Typography variant="body2">/ {currentParticipant.character.hp}</Typography>
                      </Box>
                    </Box>
                    
                    {/* Character inventory if any */}
                    {currentParticipant.character.inventory && currentParticipant.character.inventory.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Inventory:</Typography>
                        <List dense>
                          {currentParticipant.character.inventory.map(item => (
                            <ListItem key={item.id}>
                              <ListItemText 
                                primary={item.name}
                                secondary={`Quantity: ${item.quantity}${item.price ? ` • Price: ${item.price}` : ''}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleRemoveParticipant(currentParticipant.id)}
                  >
                    Remove from Combat
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleNextTurn}
                  >
                    Next Turn
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" color="textSecondary" align="center">
                No participants in combat.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddParticipantDialog(true)}
                sx={{ mt: 2 }}
              >
                Add Participants
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
      
      {/* Add participant dialog */}
      <Dialog open={showAddParticipantDialog} onClose={() => setShowAddParticipantDialog(false)}>
        <DialogTitle>Add Combat Participant</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Autocomplete
              options={characters}
              getOptionLabel={(character) => `${character.name} (${character.type})`}
              renderOption={(props, character) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {character.type === 'player' ? (
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                    ) : (
                      <SportsKabaddiIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Box>
                      <Typography variant="body1">{character.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        HP: {character.hp}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              onChange={(_, value) => setNewParticipant(value)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Character" 
                  fullWidth 
                  margin="normal"
                />
              )}
            />
            
            <TextField
              label="Initiative"
              type="number"
              fullWidth
              margin="normal"
              value={newInitiative}
              onChange={(e) => setNewInitiative(Number(e.target.value))}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddParticipantDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddParticipant}
            variant="contained"
            disabled={!newParticipant}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 