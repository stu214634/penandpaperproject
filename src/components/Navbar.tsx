import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DM Companion
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/')}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<LocationOnIcon />}
            onClick={() => navigate('/locations')}
          >
            Locations
          </Button>
          <Button
            color="inherit"
            startIcon={<MapIcon />}
            onClick={() => navigate('/map')}
          >
            Map
          </Button>
          <Button
            color="inherit"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/characters')}
          >
            Characters
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 