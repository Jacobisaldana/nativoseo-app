import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  Alert,
  Chip,
  CardMedia,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import { 
  LocationOn as LocationIcon, 
  Phone as PhoneIcon, 
  Language as WebsiteIcon,
  CheckCircle as ActiveIcon, 
  Cancel as InactiveIcon 
} from '@mui/icons-material';
import { accountsService, activeLocationsService } from '../services/api';
import { useSearchParams, Link } from 'react-router-dom';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const [activeLocations, setActiveLocations] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Cargar ubicaciones activas desde el backend al iniciar
  useEffect(() => {
    const fetchActiveLocations = async () => {
      try {
        const response = await activeLocationsService.getActiveLocations();
        if (response.data && Array.isArray(response.data)) {
          // Extraer solo los IDs de ubicación para mantener compatibilidad con el código existente
          const activeLocationIds = response.data.map(loc => loc.location_id);
          setActiveLocations(activeLocationIds);
          
          // También guardar en localStorage como respaldo
          localStorage.setItem('activeLocations', JSON.stringify(activeLocationIds));
        }
      } catch (error) {
        console.error('Error al cargar ubicaciones activas:', error);
        
        // Intentar cargar desde localStorage como respaldo
        const storedLocations = localStorage.getItem('activeLocations');
        if (storedLocations) {
          try {
            setActiveLocations(JSON.parse(storedLocations));
          } catch (e) {
            console.error('Error parsing stored locations:', e);
            localStorage.removeItem('activeLocations');
          }
        }
      }
    };
    
    fetchActiveLocations();
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchLocations(accountId);
    } else {
      setError('ID de cuenta no proporcionado');
      setLoading(false);
    }
  }, [accountId]);

  const fetchLocations = async (accountId) => {
    try {
      setLoading(true);
      const response = await accountsService.getLocations(accountId);
      setLocations(response.data.locations || []);
      setError('');
    } catch (error) {
      console.error('Error al obtener ubicaciones:', error);
      setError('No se pudieron cargar las ubicaciones. Asegúrate de estar autenticado y tener permisos.');
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar si una ubicación está activa
  const isLocationActive = (locationId) => {
    console.log(`Checking if location ${locationId} is active:`, activeLocations.includes(locationId));
    console.log('Current active locations:', activeLocations);
    return activeLocations.includes(locationId);
  };
  
  // Manejar cambio de estado activo para una ubicación
  const handleToggleActive = async (locationId, locationData) => {
    try {
      // Mostrar loading mientras se actualiza
      setLoading(true);
      
      if (isLocationActive(locationId)) {
        // Desactivar en el backend
        await activeLocationsService.deactivateLocation(locationId, accountId);
        
        // Actualizar el estado local
        const updatedLocations = activeLocations.filter(id => id !== locationId);
        setActiveLocations(updatedLocations);
        localStorage.setItem('activeLocations', JSON.stringify(updatedLocations));
        
        setNotification({
          open: true,
          message: 'Ubicación desactivada correctamente',
          severity: 'info'
        });
      } else {
        // Encontrar el objeto de ubicación completo
        const location = locations.find(loc => loc.name.split('/').pop() === locationId);
        
        // Activar en el backend
        await activeLocationsService.activateLocation(
          accountId,
          locationId,
          location?.title || 'Ubicación sin nombre'
        );
        
        // Actualizar el estado local
        const updatedLocations = [...activeLocations, locationId];
        setActiveLocations(updatedLocations);
        localStorage.setItem('activeLocations', JSON.stringify(updatedLocations));
        
        setNotification({
          open: true,
          message: 'Ubicación activada correctamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al cambiar estado de ubicación:', error);
      setNotification({
        open: true,
        message: 'Error al actualizar la ubicación. Intenta de nuevo.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el estado en español
  const getStatusText = (status) => {
    const statusMap = {
      OPEN: 'Abierto',
      CLOSED: 'Cerrado',
      CLOSED_TEMPORARILY: 'Cerrado temporalmente',
      CLOSED_PERMANENTLY: 'Cerrado permanentemente'
    };
    return statusMap[status] || status || 'Estado desconocido';
  };

  // Función para obtener el color del chip de estado
  const getStatusColor = (status) => {
    const colorMap = {
      OPEN: 'success',
      CLOSED: 'error',
      CLOSED_TEMPORARILY: 'warning',
      CLOSED_PERMANENTLY: 'error'
    };
    return colorMap[status] || 'default';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ubicaciones
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="body1">
              {accountId 
                ? `Mostrando ubicaciones para la cuenta: ${accountId}` 
                : 'Selecciona una cuenta para ver sus ubicaciones'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Activa las ubicaciones con las que quieres trabajar. Solo las ubicaciones activas estarán disponibles en módulos como Reseñas y Publicaciones.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button 
              component={Link} 
              to="/accounts" 
              variant="outlined" 
              color="primary"
            >
              Volver a Cuentas
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {activeLocations.length > 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Tienes {activeLocations.length} ubicación(es) activa(s). Solo las ubicaciones activas estarán disponibles en el resto de la aplicación.
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : locations.length > 0 ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                // Activar todas las ubicaciones
                const activateAllLocations = async () => {
                  setLoading(true);
                  try {
                    // Para cada ubicación no activa, enviar petición al backend
                    const promises = locations
                      .filter(loc => !isLocationActive(loc.name.split('/').pop()))
                      .map(loc => activeLocationsService.activateLocation(
                        accountId,
                        loc.name.split('/').pop(),
                        loc.title || 'Ubicación sin nombre'
                      ));
                    
                    // Esperar a que se completen todas las peticiones
                    await Promise.all(promises);
                    
                    // Actualizar estado local
                    const allLocationIds = locations.map(loc => loc.name.split('/').pop());
                    setActiveLocations(allLocationIds);
                    localStorage.setItem('activeLocations', JSON.stringify(allLocationIds));
                  } catch (error) {
                    console.error('Error al activar todas las ubicaciones:', error);
                    setNotification({
                      open: true,
                      message: 'Error al activar todas las ubicaciones',
                      severity: 'error'
                    });
                  } finally {
                    setLoading(false);
                  }
                };
                
                activateAllLocations();
                setNotification({
                  open: true,
                  message: 'Todas las ubicaciones han sido activadas',
                  severity: 'success'
                });
              }}
              sx={{ mr: 2 }}
            >
              Activar todas
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => {
                // Desactivar todas las ubicaciones
                const deactivateAllLocations = async () => {
                  setLoading(true);
                  try {
                    // Para cada ubicación activa, enviar petición al backend
                    const promises = activeLocations.map(locationId => 
                      activeLocationsService.deactivateLocation(locationId, accountId)
                    );
                    
                    // Esperar a que se completen todas las peticiones
                    await Promise.all(promises);
                    
                    // Actualizar estado local
                    setActiveLocations([]);
                    localStorage.setItem('activeLocations', JSON.stringify([]));
                  } catch (error) {
                    console.error('Error al desactivar todas las ubicaciones:', error);
                    setNotification({
                      open: true,
                      message: 'Error al desactivar todas las ubicaciones',
                      severity: 'error'
                    });
                  } finally {
                    setLoading(false);
                  }
                };
                
                deactivateAllLocations();
                setNotification({
                  open: true,
                  message: 'Todas las ubicaciones han sido desactivadas',
                  severity: 'info'
                });
              }}
            >
              Desactivar todas
            </Button>
          </Box>
          <Grid container spacing={3}>
          {locations.map((location) => (
            <Grid item xs={12} sm={6} md={4} key={location.name}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: isLocationActive(location.name.split('/').pop()) ? '2px solid #4caf50' : 'none'
              }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    backgroundColor: isLocationActive(location.name.split('/').pop()) ? 'success.light' : 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <LocationIcon sx={{ fontSize: 64, color: 'white' }} />
                  {isLocationActive(location.name.split('/').pop()) && (
                    <ActiveIcon 
                      color="success" 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        fontSize: 30,
                        background: 'white',
                        borderRadius: '50%' 
                      }} 
                    />
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography gutterBottom variant="h5" component="div" sx={{ mb: 0 }}>
                      {location.title || 'Sin nombre'}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isLocationActive(location.name.split('/').pop())}
                          onChange={() => handleToggleActive(location.name.split('/').pop(), location)}
                          color="success"
                        />
                      }
                      label={isLocationActive(location.name.split('/').pop()) ? "Activa" : "Inactiva"}
                      labelPlacement="start"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={getStatusText(location.businessStatus)} 
                      color={getStatusColor(location.businessStatus)}
                      size="small"
                    />
                    <Chip 
                      icon={isLocationActive(location.name.split('/').pop()) ? <ActiveIcon /> : <InactiveIcon />}
                      label={isLocationActive(location.name.split('/').pop()) ? "Disponible" : "No disponible"}
                      color={isLocationActive(location.name.split('/').pop()) ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    {location.storefrontAddress?.formattedAddress || 'Dirección no disponible'}
                  </Typography>
                  {location.phoneNumbers?.primaryPhone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      {location.phoneNumbers.primaryPhone}
                    </Typography>
                  )}
                  {location.websiteUri && (
                    <Typography variant="body2" color="text.secondary">
                      <WebsiteIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      <a href={location.websiteUri} target="_blank" rel="noopener noreferrer">
                        {location.websiteUri.replace(/(^\w+:|^)\/\//, '').split('/')[0]}
                      </a>
                    </Typography>
                  )}
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/reviews?locationId=${location.name.split('/').pop()}&accountId=${accountId}`}
                    disabled={!isLocationActive(location.name.split('/').pop())}
                  >
                    Ver Reseñas
                  </Button>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/posts?locationId=${location.name.split('/').pop()}&accountId=${accountId}`}
                    disabled={!isLocationActive(location.name.split('/').pop())}
                  >
                    Publicaciones
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        </>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron ubicaciones para esta cuenta.
          </Typography>
        </Paper>
      )}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Locations;