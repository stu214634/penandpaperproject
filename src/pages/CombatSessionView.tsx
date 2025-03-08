import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useStore } from '../store';
import { Combat } from '../store';
import { ActiveCombatView } from '../components/ActiveCombatView';

export const CombatSessionView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const combats = useStore(state => state.combats);
  
  // Get the combat ID from the URL state
  const combatId = location.state?.combatId;
  const combat = combats.find(c => c.id === combatId);
  
  // If no combat is selected, redirect back to the map view
  useEffect(() => {
    if (!combatId || !combat) {
      navigate('/map');
    }
  }, [combatId, combat, navigate]);
  
  // Handle going back to the previous screen
  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };
  
  // Return a loading state if the combat isn't found
  if (!combat) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 3
      }}>
        <Typography variant="h6">Loading combat...</Typography>
        <Button onClick={() => navigate('/map')} sx={{ mt: 2 }}>
          Return to Map
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <ActiveCombatView combat={combat} onClose={handleClose} />
    </Box>
  );
}; 