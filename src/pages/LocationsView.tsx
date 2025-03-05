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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useStore } from '../store';

export const LocationsView: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    backgroundMusic: '',
    parentLocationId: '',
    coordinates: [0, 0] as [number, number],
  });
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const { locations, addLocation, getAllTopLevelLocations, getSublocationsByParentId } = useStore();
  
  const topLevelLocations = getAllTopLevelLocations();

  const handleAddLocation = () => {
    addLocation({
      name: newLocation.name,
        description: newLocation.description,
        backgroundMusic: newLocation.backgroundMusic || undefined,
        coordinates: newLocation.coordinates.every(coord => coord !== 0) ? newLocation.coordinates : undefined,
    });
    setIsAddDialogOpen(false);
    setNewLocation({ 
      name: '', 
      description: '', 
      backgroundMusic: '', 
      parentLocationId: '',
      coordinates: [0, 0]
    });
  };

  const toggleLocationExpand = (locationId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const renderLocationCard = (location: any, isSubLocation = false) => {
    const sublocations = getSublocationsByParentId(location.id);
    const hasSublocations = sublocations.length > 0;
    const isExpanded = expandedLocations[location.id] || false;

    return (
      <Grid item xs={12} sm={6} md={4} key={location.id}>
        <Card sx={{ 
          position: 'relative',
          borderLeft: isSubLocation ? '4px solid #4caf50' : 'none'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {location.name}
              </Typography>
              {isSubLocation && (
                <Chip 
                  label="Sublocation" 
                  size="small" 
                  color="success" 
                  sx={{ mb: 1 }} 
                />
              )}
              {hasSublocations && (
                <IconButton 
                  size="small" 
                  onClick={() => toggleLocationExpand(location.id)}
                  sx={{ ml: 'auto' }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {location.description}
            </Typography>
            {location.backgroundMusic && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Background Music: {location.backgroundMusic}
              </Typography>
            )}
            {location.coordinates && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Coordinates: {location.coordinates[0]}, {location.coordinates[1]}
              </Typography>
            )}
            
            {hasSublocations && (
              <Collapse in={isExpanded}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sublocations:
                </Typography>
                <Grid container spacing={2}>
                  {sublocations.map(subloc => renderLocationCard(subloc, true))}
                </Grid>
              </Collapse>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Locations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Location
        </Button>
      </Box>

      <Grid container spacing={3}>
        {topLevelLocations.map((location) => renderLocationCard(location))}
      </Grid>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newLocation.description}
            onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Background Music URL (optional)"
            fullWidth
            value={newLocation.backgroundMusic}
            onChange={(e) => setNewLocation({ ...newLocation, backgroundMusic: e.target.value })}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              margin="dense"
              label="Latitude (optional)"
              type="number"
              value={newLocation.coordinates[0] || ''}
              onChange={(e) => setNewLocation({ 
                ...newLocation, 
                coordinates: [parseFloat(e.target.value) || 0, newLocation.coordinates[1]] 
              })}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Longitude (optional)"
              type="number"
              value={newLocation.coordinates[1] || ''}
              onChange={(e) => setNewLocation({ 
                ...newLocation, 
                coordinates: [newLocation.coordinates[0], parseFloat(e.target.value) || 0] 
              })}
              sx={{ flex: 1 }}
            />
          </Box>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Parent Location (optional)</InputLabel>
            <Select
              value={newLocation.parentLocationId}
              label="Parent Location (optional)"
              onChange={(e) => setNewLocation({ ...newLocation, parentLocationId: e.target.value as string })}
            >
              <MenuItem value="">
                <em>None (Top-level location)</em>
              </MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLocation} 
            variant="contained"
            disabled={!newLocation.name || !newLocation.description}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 