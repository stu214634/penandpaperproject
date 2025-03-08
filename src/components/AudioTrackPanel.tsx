import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Slider, IconButton, List, ListItem, Divider, Collapse, Tooltip, Zoom } from '@mui/material';
import { VolumeOff, VolumeUp, Close, ExpandMore, ExpandLess, Loop, DoNotDisturb, Minimize, MusicNote } from '@mui/icons-material';
import { useStore } from '../store';
import { AudioTrackSelector } from './AudioTrackSelector';

export const AudioTrackPanel: React.FC = () => {
  const activeTracks = useStore((state) => state.activeTracks);
  const toggleMuteTrack = useStore((state) => state.toggleMuteTrack);
  const stopIndividualTrack = useStore((state) => state.stopIndividualTrack);
  const setTrackVolume = useStore((state) => state.setTrackVolume);
  const volume = useStore((state) => state.volume);
  const setVolume = useStore((state) => state.setVolume);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume || 0.7);
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({});
  const [isMinimized, setIsMinimized] = useState(false);

  // Update previousVolume when volume changes and not muted
  useEffect(() => {
    if (!isMasterMuted && volume > 0) {
      setPreviousVolume(volume);
    }
  }, [volume, isMasterMuted]);

  const handleMasterMute = () => {
    if (isMasterMuted) {
      // Unmute - restore previous volume
      setVolume(previousVolume);
    } else {
      // Remember current volume before muting
      if (volume > 0) {
        setPreviousVolume(volume);
      }
      // Mute - set volume to 0
      setVolume(0);
    }
    setIsMasterMuted(!isMasterMuted);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const newVolumeValue = newValue as number;
    setVolume(newVolumeValue);
    
    // If the user is adjusting volume to above 0, and we're muted, unmute
    if (isMasterMuted && newVolumeValue > 0) {
      setIsMasterMuted(false);
    }
    
    // If the user sets volume to 0, mute
    if (newVolumeValue === 0 && !isMasterMuted) {
      setIsMasterMuted(true);
    }
  };
  
  const handleTrackVolumeChange = (trackId: string) => (_: Event, newValue: number | number[]) => {
    setTrackVolume(trackId, newValue as number);
  };
  
  const toggleTrackExpand = (trackId: string) => {
    setExpandedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // If minimized, just show a music icon that can be clicked to maximize
  if (isMinimized) {
    return (
      <Tooltip 
        title="Audio Controls" 
        placement="top" 
        TransitionComponent={Zoom}
      >
        <IconButton
          onClick={toggleMinimize}
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            backgroundColor: 'rgba(45, 45, 45, 0.9)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(60, 60, 60, 0.9)',
            },
            zIndex: 9999,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          <MusicNote />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper sx={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      p: 2,
      maxWidth: 320,
      maxHeight: '300px',
      overflowY: 'auto',
      backgroundColor: 'rgba(45, 45, 45, 0.9)',
      zIndex: 9999, // Highest z-index to ensure it's always on top
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      transform: 'translateZ(0)', // Forces GPU acceleration for smoother rendering
      '&:hover': {
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)', // Enhanced shadow on hover for better visibility
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Audio Controls</Typography>
        <IconButton size="small" onClick={toggleMinimize}>
          <Minimize fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Track Selector Button */}
      <AudioTrackSelector />
      
      {/* Master Volume Control */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleMasterMute} size="small">
          {volume === 0 ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
        </IconButton>
        
        <Typography variant="body2" sx={{ minWidth: 80 }}>
          Master Volume
        </Typography>
        
        <Slider
          size="small"
          value={volume}
          onChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.01}
          sx={{ ml: 1 }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Active Tracks
      </Typography>
      
      {activeTracks.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          No tracks currently playing. Use the "Add Track" button to play some music.
        </Typography>
      ) : (
        <List dense>
          {activeTracks.map((track) => (
            <React.Fragment key={track.id}>
              <ListItem sx={{ gap: 1, px: 0 }}>
                <IconButton onClick={() => toggleMuteTrack(track.id)} size="small">
                  {track.isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                </IconButton>
                
                <Typography 
                  variant="body2" 
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => toggleTrackExpand(track.id)}
                >
                  {track.name}
                </Typography>
                
                {/* Loop indicator */}
                <IconButton 
                  size="small" 
                  disabled 
                  sx={{ opacity: track.loop ? 1 : 0.3 }}
                >
                  {track.loop ? <Loop fontSize="small" /> : <DoNotDisturb fontSize="small" />}
                </IconButton>
                
                <IconButton 
                  size="small" 
                  onClick={() => toggleTrackExpand(track.id)}
                >
                  {expandedTracks[track.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>

                <IconButton onClick={() => stopIndividualTrack(track.id)} size="small">
                  <Close fontSize="small" />
                </IconButton>
              </ListItem>
              
              <Collapse in={expandedTracks[track.id]} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4, pr: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ minWidth: 60 }}>
                    Volume
                  </Typography>
                  <Slider
                    size="small"
                    value={track.volume}
                    onChange={handleTrackVolumeChange(track.id)}
                    min={0}
                    max={1}
                    step={0.01}
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};