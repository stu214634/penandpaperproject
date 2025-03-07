import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { useStore } from '../store';
import { AudioTrackPanel } from '../components/AudioTrackPanel';

export const Dashboard: React.FC = () => {
  const { locations, characters, audioTracks } = useStore();

  const stats = [
    { label: 'Total Locations', value: locations.length },
    { label: 'Total Characters', value: characters.length },
    { label: 'Available Music Tracks', value: audioTracks.length },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Campaign Dashboard
      </Typography>

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
    </Box>
  );
}; 