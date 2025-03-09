import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Dialog, DialogContent, Divider, Paper } from '@mui/material';
import { useStore } from '../store';
import { AudioTrackPanel } from '../components/AudioTrackPanel';
import { AssetDropZone } from '../components/AssetDropZone';
import { AssetManager } from '../services/assetManager';
import MarkdownContent from '../components/MarkdownContent';

export const Dashboard: React.FC = () => {
  const { locations, characters, combats } = useStore();
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [audioAssetCount, setAudioAssetCount] = useState(0);
  
  // Markdown example for debugging
  const markdownExample = `# Markdown Examples
  
## Basic Formatting
**Bold text** and *italic text*

## Lists
* Item 1
* Item 2
  * Nested item

## Links
[Example Link](https://example.com)

## Code
\`\`\`
function example() {
  return "This is code";
}
\`\`\`
`;

  useEffect(() => {
    // Load audio asset count
    const loadAudioAssets = async () => {
      const audioAssets = await AssetManager.getAssets('audio');
      setAudioAssetCount(audioAssets.length);
    };
    loadAudioAssets();
  }, []);

  const stats = [
    { label: 'Total Locations', value: locations.length },
    { label: 'Total Characters', value: characters.length },
    { label: 'Available Music Tracks', value: audioAssetCount },
    { label: 'Combat Encounters', value: combats.length },
  ];

  const handleAssetManagerClose = () => {
    setIsAssetManagerOpen(false);
  };

  const handleAssetImport = async () => {
    // Refresh audio asset count after import
    const audioAssets = await AssetManager.getAssets('audio');
    setAudioAssetCount(audioAssets.length);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Campaign Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setIsAssetManagerOpen(true)}
        >
          Manage Assets
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h3" color="primary">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Locations
              </Typography>
              {locations.slice(0, 5).map((location) => (
                <Typography key={location.id} variant="body1" sx={{ mb: 1 }}>
                  {location.name}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Characters
              </Typography>
              {characters.slice(0, 5).map((character) => (
                <Typography key={character.id} variant="body1" sx={{ mb: 1 }}>
                  {character.name} - {character.type}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <AudioTrackPanel />

      <Dialog 
        open={isAssetManagerOpen} 
        onClose={handleAssetManagerClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <AssetDropZone onAssetImport={handleAssetImport} />
        </DialogContent>
      </Dialog>

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>Preview:</Typography>
      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
        <MarkdownContent content={markdownExample} debug={true} />
      </Paper>
      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Troubleshooting Markdown Display:
        </Typography>
        <Typography variant="body2">
          If markdown isn't displaying correctly in the deployed version, please:
        </Typography>
        <ul>
          <li>
            <Typography variant="body2">
              Check the browser console for any errors (F12 &gt; Console)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Try refreshing the page with cache clearing (Ctrl+F5 or Cmd+Shift+R)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Temporarily disable any browser extensions that might interfere
            </Typography>
          </li>
        </ul>
      </Box>
    </Box>
  );
}; 