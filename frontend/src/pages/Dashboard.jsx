import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader 
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  LocationOn as LocationIcon, 
  RateReview as ReviewIcon, 
  PostAdd as PostIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { currentUser } = useAuth();

  const stats = [
    {
      title: 'Cuentas',
      value: '-- --',
      icon: <BusinessIcon color="primary" sx={{ fontSize: 48 }} />,
      description: 'Cuentas de Google Business conectadas'
    },
    {
      title: 'Ubicaciones',
      value: '-- --',
      icon: <LocationIcon color="secondary" sx={{ fontSize: 48 }} />,
      description: 'Ubicaciones de negocios gestionadas'
    },
    {
      title: 'Reseñas',
      value: '-- --',
      icon: <ReviewIcon color="success" sx={{ fontSize: 48 }} />,
      description: 'Reseñas pendientes de responder'
    },
    {
      title: 'Publicaciones',
      value: '-- --',
      icon: <PostIcon color="warning" sx={{ fontSize: 48 }} />,
      description: 'Publicaciones realizadas'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ p: 3, mb: 4, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1A2027' : '#f5f5f5' }}
      >
        <Typography variant="h6" gutterBottom>
          Bienvenido{currentUser ? `, ${currentUser.username}` : ''}
        </Typography>
        <Typography variant="body1">
          Desde este panel podrás gestionar tus perfiles de negocio en Google,
          incluyendo la administración de ubicaciones, revisión de reseñas y creación de publicaciones.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;