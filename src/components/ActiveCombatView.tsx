import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  SportsKabaddi as SportsKabaddiIcon,
  Person as PersonIcon,
  AddCircle as AddCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useStore } from '../store';
import { Combat, Character } from '../store';
import MarkdownContent from './MarkdownContent';

// Interface for combat participants with initiative
interface CombatParticipant {
  id: string; // Unique ID for this participant instance
  character: Character;
  initiative: number;
  currentHp: number;
  maxHp: number;
  notes: string;
  isPlayerCharacter: boolean;
}

interface ActiveCombatViewProps {
  combat: Combat;
  onClose: () => void;
}

export const ActiveCombatView: React.FC<ActiveCombatViewProps> = ({ combat, onClose }) => {
  const playTrack = useStore(state => state.playTrack);
  const stopIndividualTrack = useStore(state => state.stopIndividualTrack);
  const characters = useStore(state => state.characters);
  
  // Refs to track audio IDs
  const entrySoundTrackIdRef = useRef<string | null>(null);
  const bgmTrackIdRef = useRef<string | null>(null);
  const audioInitializedRef = useRef(false);
  
  // Combat state
  const [participants, setParticipants] = useState<CombatParticipant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [isAddParticipantDialogOpen, setIsAddParticipantDialogOpen] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState('');
  const [newParticipantInitiative, setNewParticipantInitiative] = useState(10);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  
  // Initialize audio only once when the component mounts
  useEffect(() => {
    if (!audioInitializedRef.current) {
      // Initialize audio
      if (combat.entrySound) {
        const entryTrackId = `/audio/${combat.entrySound}`;
        entrySoundTrackIdRef.current = entryTrackId;
        playTrack(entryTrackId, { 
          replace: false, 
          locationId: `combat-entrysound-${combat.id}`, 
          loop: false 
        });
      }
      
      if (combat.backgroundMusic) {
        const bgmTrackId = `/audio/${combat.backgroundMusic}`;
        bgmTrackIdRef.current = bgmTrackId;
        playTrack(bgmTrackId, { 
          replace: false, 
          locationId: `combat-bgm-${combat.id}`, 
          loop: true 
        });
      }
      
      audioInitializedRef.current = true;
    }
    
    // Cleanup function to stop tracks when component unmounts
    return () => {
      if (entrySoundTrackIdRef.current) {
        stopIndividualTrack(entrySoundTrackIdRef.current);
        entrySoundTrackIdRef.current = null;
      }
      
      if (bgmTrackIdRef.current) {
        stopIndividualTrack(bgmTrackIdRef.current);
        bgmTrackIdRef.current = null;
      }
    };
  }, [combat.id, combat.entrySound, combat.backgroundMusic]);
  
  // Initialize combat participants only once
  useEffect(() => {
    initializeCombat();
  }, []);
  
  // Initialize combat participants from the combat data
  const initializeCombat = () => {
    // Create participants from player characters
    const playerParticipants = combat.playerCharacters.map(character => ({
      id: `pc-${character.id}-${Math.random().toString(36).substring(2, 9)}`,
      character,
      initiative: 0,
      currentHp: character.hp,
      maxHp: character.hp,
      notes: '',
      isPlayerCharacter: true
    }));
    
    // Create participants from enemies
    const enemyParticipants = combat.enemies.map(character => ({
      id: `enemy-${character.id}-${Math.random().toString(36).substring(2, 9)}`,
      character,
      initiative: Math.floor(Math.random() * 20) + 1, // Random initiative for initial setup
      currentHp: character.hp,
      maxHp: character.hp,
      notes: '',
      isPlayerCharacter: false
    }));
    
    // Combine and sort by initiative
    const allParticipants = [...playerParticipants, ...enemyParticipants]
      .sort((a, b) => b.initiative - a.initiative);
    
    setParticipants(allParticipants);
    setCurrentTurnIndex(0); // Start with the highest initiative
    setRound(1);
  };
  
  // Advance to the next turn in initiative order
  const nextTurn = () => {
    if (participants.length === 0) return;
    
    const nextIndex = (currentTurnIndex + 1) % participants.length;
    setCurrentTurnIndex(nextIndex);
    
    // When turn changes, update selected participant to match the current turn
    setSelectedParticipantId(participants[nextIndex].id);
    
    // If we've looped back to the first participant, increment the round
    if (nextIndex === 0) {
      setRound(prevRound => prevRound + 1);
    }
  };
  
  // Get the current participant (whose turn it is)
  const currentParticipant = participants[currentTurnIndex];
  
  // Get the selected participant (for details panel)
  const selectedParticipant = participants.find(p => p.id === (selectedParticipantId || currentParticipant?.id));
  
  // Update selectedParticipantId on initial load
  useEffect(() => {
    if (currentParticipant && !selectedParticipantId) {
      setSelectedParticipantId(currentParticipant.id);
    }
  }, [currentParticipant]);
  
  // Handle adding a new participant to the combat
  const handleAddParticipant = () => {
    if (!newParticipantId) return;
    
    const character = characters.find(c => c.id === newParticipantId);
    if (!character) return;
    
    const isPlayerCharacter = character.type === 'player';
    
    const newParticipant: CombatParticipant = {
      id: `${isPlayerCharacter ? 'pc' : 'enemy'}-${character.id}-${Math.random().toString(36).substring(2, 9)}`,
      character,
      initiative: newParticipantInitiative,
      currentHp: character.hp,
      maxHp: character.hp,
      notes: '',
      isPlayerCharacter
    };
    
    // Add to participants and resort by initiative
    const updatedParticipants = [...participants, newParticipant]
      .sort((a, b) => b.initiative - a.initiative);
    
    // Find the new index of the current participant to maintain turn
    const currentId = participants[currentTurnIndex]?.id;
    const newCurrentIndex = currentId 
      ? updatedParticipants.findIndex(p => p.id === currentId)
      : 0;
    
    setParticipants(updatedParticipants);
    setCurrentTurnIndex(newCurrentIndex >= 0 ? newCurrentIndex : 0);
    setIsAddParticipantDialogOpen(false);
    setNewParticipantId('');
    setNewParticipantInitiative(10);
  };
  
  // Handle updating a participant's initiative
  const handleUpdateInitiative = (participantId: string, initiative: number) => {
    const updatedParticipants = participants.map(p => 
      p.id === participantId ? { ...p, initiative } : p
    ).sort((a, b) => b.initiative - a.initiative);
    
    // Find the new index of the current participant to maintain turn
    const currentId = participants[currentTurnIndex]?.id;
    const newCurrentIndex = currentId 
      ? updatedParticipants.findIndex(p => p.id === currentId)
      : 0;
    
    setParticipants(updatedParticipants);
    setCurrentTurnIndex(newCurrentIndex >= 0 ? newCurrentIndex : 0);
  };
  
  // Handle updating a participant's HP
  const handleUpdateHp = (participantId: string, hp: number) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, currentHp: Math.max(0, Math.min(hp, p.maxHp)) } : p
    ));
  };
  
  // Handle updating a participant's notes
  const handleUpdateNotes = (participantId: string, notes: string) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, notes } : p
    ));
  };
  
  // Handle removing a participant from combat
  const handleRemoveParticipant = (participantId: string) => {
    const index = participants.findIndex(p => p.id === participantId);
    if (index === -1) return;
    
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    
    // If no participants left, close combat
    if (updatedParticipants.length === 0) {
      handleClose();
      return;
    }
    
    // Adjust current turn index if necessary
    let newIndex = currentTurnIndex;
    if (index === currentTurnIndex) {
      // If removing current participant, go to next
      newIndex = currentTurnIndex % updatedParticipants.length;
    } else if (index < currentTurnIndex) {
      // If removing participant before current, adjust index
      newIndex = currentTurnIndex - 1;
    }
    
    setParticipants(updatedParticipants);
    setCurrentTurnIndex(newIndex);
  };
  
  // Handle selecting a participant for viewing/editing
  const handleSelectParticipant = (participantId: string) => {
    setSelectedParticipantId(participantId);
  };
  
  // Handle closing the combat view
  const handleClose = () => {
    // Stop audio tracks
    if (entrySoundTrackIdRef.current) {
      stopIndividualTrack(entrySoundTrackIdRef.current);
      entrySoundTrackIdRef.current = null;
    }
    
    if (bgmTrackIdRef.current) {
      stopIndividualTrack(bgmTrackIdRef.current);
      bgmTrackIdRef.current = null;
    }
    
    // Call parent's onClose
    onClose();
  };
  
  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden', 
      position: 'relative',
      backgroundColor: '#222',
      backgroundImage: combat.backgroundImage ? `url(/images/${combat.backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Semi-transparent overlay for readability over background image */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 0 
      }} />
      
      {/* Header with combat info */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleClose} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">{combat.name}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`Round: ${round}`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`Difficulty: ${combat.difficulty || 'Medium'}`}
            color="secondary"
            variant="outlined"
          />
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => setIsAddParticipantDialogOpen(true)}
          >
            Add Participant
          </Button>
        </Box>
      </Paper>
      
      {/* Main content area */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        gap: 2,
        p: 2
      }}>
        {/* Initiative order list */}
        <Paper sx={{ 
          width: 300, 
          overflow: 'auto',
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          p: 1
        }}>
          <Typography variant="h6" sx={{ mb: 2, p: 1 }}>Initiative Order</Typography>
          
          <List>
            {participants.map((participant, index) => (
              <ListItem 
                key={participant.id}
                sx={{ 
                  mb: 1,
                  backgroundColor: index === currentTurnIndex 
                    ? 'rgba(255, 165, 0, 0.3)' 
                    : participant.id === selectedParticipantId && index !== currentTurnIndex
                      ? 'rgba(25, 118, 210, 0.2)'
                      : 'transparent',
                  borderLeft: index === currentTurnIndex 
                    ? '4px solid orange' 
                    : participant.id === selectedParticipantId
                      ? '4px solid #1976d2'
                      : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectParticipant(participant.id)}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the ListItem click
                      handleRemoveParticipant(participant.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {participant.isPlayerCharacter ? 
                    <PersonIcon color="primary" /> : 
                    <SportsKabaddiIcon color="error" />
                  }
                </ListItemIcon>
                
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body1">{participant.character.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge 
                          badgeContent={participant.initiative} 
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the ListItem click
                            setEditingParticipantId(participant.id === editingParticipantId ? null : participant.id);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" component="div">
                        HP: {participant.currentHp}/{participant.maxHp}
                      </Typography>
                      {editingParticipantId === participant.id && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <TextField
                            label="Initiative"
                            type="number"
                            size="small"
                            value={participant.initiative}
                            onChange={(e) => handleUpdateInitiative(participant.id, parseInt(e.target.value) || 0)}
                          />
                          <TextField
                            label="Current HP"
                            type="number"
                            size="small"
                            value={participant.currentHp}
                            onChange={(e) => handleUpdateHp(participant.id, parseInt(e.target.value) || 0)}
                          />
                          <TextField
                            label="Notes"
                            size="small"
                            multiline
                            rows={2}
                            value={participant.notes}
                            onChange={(e) => handleUpdateNotes(participant.id, e.target.value)}
                          />
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
        
        {/* Active participant details */}
        <Paper sx={{ 
          flex: 1, 
          p: 2,
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedParticipant ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5">
                    {selectedParticipant.id === currentParticipant?.id 
                      ? `Current Turn: ${selectedParticipant.character.name}`
                      : selectedParticipant.character.name
                    }
                  </Typography>
                  {selectedParticipant.id !== currentParticipant?.id && (
                    <Typography variant="caption" color="text.secondary">
                      Viewing details - not the active turn
                    </Typography>
                  )}
                </Box>
                <Button 
                  variant="contained" 
                  color="secondary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={nextTurn}
                >
                  Next Turn
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: 'rgba(40, 40, 40, 0.9)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Character Details
                      </Typography>
                      <Typography variant="body1">
                        Type: {selectedParticipant.character.type.toUpperCase()}
                      </Typography>
                      <Typography variant="body1">
                        HP: {selectedParticipant.currentHp}/{selectedParticipant.maxHp}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {selectedParticipant.character.descriptionType === 'markdown' && (
                          <MarkdownContent content={selectedParticipant.character.description} />
                        )}
                        {(!selectedParticipant.character.descriptionType || selectedParticipant.character.descriptionType !== 'markdown') && (
                          <Typography variant="body2">
                            {selectedParticipant.character.description}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* HP adjustment controls */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Adjust HP</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleUpdateHp(selectedParticipant.id, selectedParticipant.currentHp - 1)}
                          >
                            -1
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleUpdateHp(selectedParticipant.id, selectedParticipant.currentHp - 5)}
                          >
                            -5
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="primary"
                            size="small"
                            onClick={() => handleUpdateHp(selectedParticipant.id, selectedParticipant.currentHp + 1)}
                          >
                            +1
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="primary"
                            size="small"
                            onClick={() => handleUpdateHp(selectedParticipant.id, selectedParticipant.currentHp + 5)}
                          >
                            +5
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: 'rgba(40, 40, 40, 0.9)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Combat Notes
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={selectedParticipant.notes}
                        onChange={(e) => handleUpdateNotes(selectedParticipant.id, e.target.value)}
                        placeholder="Add notes for this character..."
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                {selectedParticipant.character.inventory && selectedParticipant.character.inventory.length > 0 && (
                  <Grid item xs={12}>
                    <Card sx={{ backgroundColor: 'rgba(40, 40, 40, 0.9)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Inventory
                        </Typography>
                        <List dense>
                          {selectedParticipant.character.inventory.map(item => (
                            <ListItem key={item.id}>
                              <ListItemText 
                                primary={item.name} 
                                secondary={item.description} 
                              />
                              <Typography variant="body2">
                                Qty: {item.quantity}
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6">No participants in combat</Typography>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Add participant dialog */}
      <Dialog 
        open={isAddParticipantDialogOpen} 
        onClose={() => setIsAddParticipantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Combat Participant</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Character</InputLabel>
              <Select
                value={newParticipantId}
                onChange={(e) => setNewParticipantId(e.target.value as string)}
                label="Character"
              >
                <MenuItem value="" disabled>Select a character</MenuItem>
                {characters.map(char => (
                  <MenuItem key={char.id} value={char.id}>
                    {char.name} ({char.type}) - HP: {char.hp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Initiative"
              type="number"
              value={newParticipantInitiative}
              onChange={(e) => setNewParticipantInitiative(parseInt(e.target.value) || 0)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddParticipantDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddParticipant} 
            color="primary" 
            variant="contained"
            disabled={!newParticipantId}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 