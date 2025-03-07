import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Typography,
  Divider,
  Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useStore } from '../store';
import { AssetManager } from '../services/assetManager';

export const AudioTrackSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [audioAssets, setAudioAssets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loop, setLoop] = useState(true);
  
  const playTrack = useStore(state => state.playTrack);
  const activeTracks = useStore(state => state.activeTracks);
  
  // Load audio assets when dialog opens
  useEffect(() => {
    if (open) {
      loadAudioAssets();
    }
  }, [open]);
  
  const loadAudioAssets = async () => {
    setIsLoading(true);
    try {
      const assets = await AssetManager.getAssets('audio');
      setAudioAssets(assets.map(asset => asset.name));
    } catch (error) {
      console.error('Error loading audio assets:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handlePlayTrack = (trackName: string) => {
    // Format the track name as expected by playTrack
    const trackPath = `/audio/${trackName}`;
    
    // Play the track with the loop option and a stable locationId
    // We use an empty locationId to indicate this is not tied to a location
    // The duplicate detection in the store will prevent adding the same track twice
    playTrack(trackPath, { replace: false, locationId: '', loop });
    
    // Close the dialog
    handleClose();
  };
  
  // Check if a track is already playing
  const isTrackPlaying = (trackName: string) => {
    return activeTracks.some(track => track.name === trackName);
  };
  
  // Filter assets based on search term
  const filteredAssets = audioAssets.filter(asset => 
    asset.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={handleOpen}
        size="small"
        sx={{ mb: 1 }}
      >
        Add Track
      </Button>
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Audio Track</DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Select a track to play. You can choose whether to loop it or play it once.
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  color="primary"
                />
              }
              label="Loop Track"
            />
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {isLoading ? (
            <Typography>Loading audio assets...</Typography>
          ) : audioAssets.length === 0 ? (
            <Typography>No audio assets found. Import some audio files first.</Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredAssets.map((asset) => {
                const alreadyPlaying = isTrackPlaying(asset);
                return (
                  <ListItem
                    key={asset}
                    secondaryAction={
                      <Tooltip title={alreadyPlaying ? "Already playing" : "Play track"}>
                        <span>
                          <IconButton 
                            edge="end" 
                            onClick={() => !alreadyPlaying && handlePlayTrack(asset)}
                            color="primary"
                            disabled={alreadyPlaying}
                          >
                            {alreadyPlaying ? <VolumeUpIcon /> : <PlayArrowIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    }
                  >
                    <ListItemText 
                      primary={asset} 
                      secondary={alreadyPlaying ? "Currently playing" : null}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};