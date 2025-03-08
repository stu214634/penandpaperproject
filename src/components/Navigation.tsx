import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useStore } from '../store';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
export const Navigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { saveDataToIndexedDB, exportToZip } = useStore();
  
  const handleSave = async () => {
    try {
      const result = await saveDataToIndexedDB();
      alert(result.message);
    } catch (error) {
      alert(`Error saving data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleExport = async () => {
    try {
      const result = await exportToZip();
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = 'campaign-data.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Error exporting data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/map', label: 'Map View', icon: <MapIcon /> },
    { path: '/locations', label: 'Locations Editor', icon: <PlaceIcon /> },
    { path: '/characters', label: 'Characters Editor', icon: <PersonIcon /> },
    { path: '/combats', label: 'Combats Editor', icon: <SportsKabaddiIcon /> }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campaign Organizer
          </Typography>
          
          {!isMobile && (
            <Box>
              {navigationItems.map((item) => (
                <Button 
                  key={item.path} 
                  color="inherit" 
                  component={Link} 
                  to={item.path}
                  sx={{ 
                    mx: 0.5,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ ml: 2 }}>
            <IconButton color="inherit" onClick={handleSave} title="Save Campaign">
              <SaveIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleExport} title="Export Campaign">
              <CloudDownloadIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <List>
            {navigationItems.map((item) => (
              <ListItem 
                button 
                key={item.path} 
                component={Link} 
                to={item.path}
                selected={isActive(item.path)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleSave}>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>
              <ListItemText primary="Save Campaign" />
            </ListItem>
            <ListItem button onClick={handleExport}>
              <ListItemIcon>
                <CloudDownloadIcon />
              </ListItemIcon>
              <ListItemText primary="Export Campaign" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}; 