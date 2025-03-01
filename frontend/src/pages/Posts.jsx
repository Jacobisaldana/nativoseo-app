import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  CircularProgress, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Image as ImageIcon, 
  Delete as DeleteIcon,
  Send as SendIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSearchParams, Link } from 'react-router-dom';
import { postsService } from '../services/api';

// Datos de ejemplo para mostrar como fallback
const EXAMPLE_POSTS = [
  {
    name: "accounts/123/locations/456/localPosts/1",
    summary: "¡Nuevas ofertas esta semana! Visítanos y aprovecha descuentos de hasta el 30% en toda nuestra selección de productos.",
    media: [{ mediaFormat: "PHOTO", googleUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" }],
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    state: "LIVE",
    locationInfo: {
      locationId: "example-location",
      locationName: "Ubicación de Ejemplo"
    }
  },
  {
    name: "accounts/123/locations/456/localPosts/2",
    summary: "Horario especial durante las vacaciones. Estaremos abiertos de 9am a 8pm todos los días.",
    createTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días atrás
    updateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    state: "LIVE",
    locationInfo: {
      locationId: "example-location",
      locationName: "Ubicación de Ejemplo"
    }
  }
];

function Posts() {
  // Estado
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [postForm, setPostForm] = useState({
    summary: '',
    mediaUrl: ''
  });
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [daysSinceLastPost, setDaysSinceLastPost] = useState(null);
  const [lastPostDate, setLastPostDate] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [submittingPost, setSubmittingPost] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  
  // Determinar el color del estado basado en los días desde la última publicación
  const getPublishStatusColor = () => {
    if (daysSinceLastPost === null || daysSinceLastPost === undefined) return 'default';
    if (daysSinceLastPost >= 30) return 'error'; // Más de un mes: rojo
    if (daysSinceLastPost >= 14) return 'warning'; // Entre 2 semanas y un mes: naranja
    return 'success'; // Menos de 2 semanas: verde
  };
  
  // Mostrar mensaje basado en los días desde la última publicación
  const getPublishStatusMessage = () => {
    if (daysSinceLastPost === null || daysSinceLastPost === undefined) {
      return 'No hay información sobre publicaciones previas';
    }
    
    if (daysSinceLastPost >= 30) {
      return `Hace más de un mes (${daysSinceLastPost} días) sin publicar`;
    }
    
    if (daysSinceLastPost >= 14) {
      return `Hace ${daysSinceLastPost} días sin publicar`;
    }
    
    if (daysSinceLastPost > 0) {
      return `Publicación reciente hace ${daysSinceLastPost} días`;
    }
    
    return 'Publicado hoy';
  };
  
  // Cargar posts y ubicaciones activas
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      setShowFallback(false);
      
      try {
        // Usar el servicio con fallback automático
        const result = await postsService.getPostsWithFallback();
        
        if (result.success) {
          console.log("Loaded real posts data:", result.data);
          
          // Establecer los posts
          setPosts(result.data.localPosts || []);
          
          // Establecer las ubicaciones disponibles
          if (result.data.locations && result.data.locations.length > 0) {
            setLocations(result.data.locations);
            
            // Si no hay una ubicación seleccionada, seleccionar la primera
            if (!selectedLocation && result.data.locations.length > 0) {
              setSelectedLocation(result.data.locations[0].locationId);
            }
          }
          
          // Establecer información de última publicación
          setDaysSinceLastPost(result.data.daysSinceLastPost);
          setLastPostDate(result.data.lastPostDate);
        } else {
          console.warn("Using fallback data", result.error);
          setError(`Error al cargar datos: ${result.error}`);
          setPosts(result.data.localPosts);
          setLocations(result.data.locations);
          setDaysSinceLastPost(result.data.daysSinceLastPost);
          setLastPostDate(result.data.lastPostDate);
          setShowFallback(true);
        }
      } catch (err) {
        console.error("Fatal error loading posts:", err);
        setError("Error crítico al cargar publicaciones");
        setPosts(EXAMPLE_POSTS);
        setLocations([{ locationId: "example-location", locationName: "Ubicación de Ejemplo" }]);
        setSelectedLocation("example-location");
        setShowFallback(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  
  // Manejar cambio de ubicación
  const handleLocationChange = (event) => {
    const newLocationId = event.target.value;
    setSelectedLocation(newLocationId);
    
    // Si estamos usando datos de ejemplo, filtrar los posts por ubicación
    if (showFallback) {
      const filteredPosts = EXAMPLE_POSTS.filter(post => 
        post.locationInfo && post.locationInfo.locationId === newLocationId
      );
      setPosts(filteredPosts.length > 0 ? filteredPosts : EXAMPLE_POSTS);
    } else {
      // En una implementación real, podrías cargar posts específicos de esta ubicación
      const selectedLocationPosts = posts.filter(post => 
        post.locationInfo && post.locationInfo.locationId === newLocationId
      );
      if (selectedLocationPosts.length > 0) {
        setPosts(selectedLocationPosts);
      }
    }
  };
  
  // Dialog para crear nueva publicación
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPostForm({
      summary: '',
      mediaUrl: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPostForm({
      ...postForm,
      [name]: value
    });
  };
  
  // Crear una nueva publicación
  const handleSubmitPost = async () => {
    if (!postForm.summary.trim() || !selectedLocation) return;
    
    setSubmittingPost(true);
    
    try {
      if (showFallback) {
        // Modo de demostración con datos de ejemplo
        setTimeout(() => {
          const selectedLocationInfo = locations.find(loc => loc.locationId === selectedLocation);
          
          // Crear un nuevo post con los datos del formulario
          const newPost = {
            name: `accounts/123/locations/${selectedLocation}/localPosts/${Date.now()}`,
            summary: postForm.summary,
            media: postForm.mediaUrl ? [{ 
              mediaFormat: "PHOTO", 
              googleUrl: postForm.mediaUrl 
            }] : [],
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            state: "LIVE",
            locationInfo: {
              locationId: selectedLocation,
              locationName: selectedLocationInfo ? selectedLocationInfo.locationName : "Ubicación desconocida"
            }
          };
          
          // Añadir al estado
          setPosts([newPost, ...posts]);
          
          // Actualizar información de última publicación
          setDaysSinceLastPost(0);
          setLastPostDate(new Date().toISOString());
          
          setNotification({
            open: true,
            message: 'Publicación creada exitosamente (modo demo)',
            severity: 'success'
          });
          
          handleCloseDialog();
          setSubmittingPost(false);
        }, 1500);
      } else {
        // Modo real usando la API
        const response = await postsService.createActivePost(
          selectedLocation,
          postForm.summary,
          postForm.mediaUrl || null
        );
        
        // Añadir el nuevo post al estado
        if (response && response.data) {
          // Añadir al principio de la lista
          setPosts([response.data, ...posts]);
          
          // Actualizar información de última publicación
          setDaysSinceLastPost(0);
          setLastPostDate(new Date().toISOString());
          
          setNotification({
            open: true,
            message: 'Publicación creada exitosamente',
            severity: 'success'
          });
        }
        
        handleCloseDialog();
      }
    } catch (err) {
      console.error('Error al crear publicación:', err);
      
      setNotification({
        open: true,
        message: `Error al crear la publicación: ${err.message || 'Error desconocido'}`,
        severity: 'error'
      });
    } finally {
      setSubmittingPost(false);
    }
  };
  
  // Función para refrescar datos
  const handleRefresh = () => {
    setLoading(true);
    
    // Recargar datos
    postsService.getPostsWithFallback()
      .then(result => {
        if (result.success) {
          setPosts(result.data.localPosts || []);
          setLocations(result.data.locations || []);
          setDaysSinceLastPost(result.data.daysSinceLastPost);
          setLastPostDate(result.data.lastPostDate);
          setShowFallback(false);
          
          setNotification({
            open: true,
            message: 'Datos actualizados correctamente',
            severity: 'success'
          });
        } else {
          setPosts(result.data.localPosts);
          setLocations(result.data.locations);
          setDaysSinceLastPost(result.data.daysSinceLastPost);
          setLastPostDate(result.data.lastPostDate);
          setShowFallback(true);
          
          setNotification({
            open: true,
            message: 'Se muestran datos de ejemplo (error al actualizar)',
            severity: 'warning'
          });
        }
      })
      .catch(error => {
        console.error("Error refreshing data:", error);
        setNotification({
          open: true,
          message: 'Error al actualizar. Se muestran datos de ejemplo.',
          severity: 'error'
        });
        setShowFallback(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Publicaciones
      </Typography>
      
      {/* Mensaje para dirigir a la página de ubicaciones */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Gestiona tus ubicaciones activas
        </Typography>
        <Typography variant="body1" paragraph>
          Para trabajar con publicaciones, primero debes activar las ubicaciones que quieres gestionar.
        </Typography>
        <Button
          component={Link}
          to="/locations"
          variant="contained"
          color="primary"
          size="large"
        >
          Ir a Gestión de Ubicaciones
        </Button>
      </Paper>
      
      {/* Selección de ubicación */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="body2" gutterBottom>
                Ubicación
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel id="location-select-label">Ubicación</InputLabel>
                  <Select
                    labelId="location-select-label"
                    id="location-select"
                    value={selectedLocation}
                    label="Ubicación"
                    onChange={handleLocationChange}
                    disabled={loading || locations.length === 0}
                  >
                    {locations.length > 0 ? (
                      locations.map(location => (
                        <MenuItem 
                          key={location.locationId} 
                          value={location.locationId}
                        >
                          {location.locationName || `Ubicación ${location.locationId}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="example-location">
                        Ubicación de Ejemplo
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={1} mt={3}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refrescar
              </Button>
              <Button 
                component={Link} 
                to="/locations"
                variant="contained"
                color="secondary"
              >
                Gestionar ubicaciones
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Estado de la última publicación */}
      {daysSinceLastPost !== null && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: getPublishStatusColor() === 'success' ? '#edf7ed' : 
                                       getPublishStatusColor() === 'warning' ? '#fff4e5' : 
                                       getPublishStatusColor() === 'error' ? '#fdeded' : '#f5f5f5' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <CalendarIcon 
                sx={{ 
                  mr: 1, 
                  color: getPublishStatusColor() === 'success' ? 'success.main' : 
                         getPublishStatusColor() === 'warning' ? 'warning.main' : 
                         getPublishStatusColor() === 'error' ? 'error.main' : 'text.secondary'
                }} 
              />
              <Typography variant="body1">
                {getPublishStatusMessage()}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              disabled={loading}
            >
              Nueva Publicación
            </Button>
          </Box>
          {lastPostDate && (
            <Typography variant="caption" display="block" sx={{ mt: 1, pl: 4 }}>
              Última publicación: {new Date(lastPostDate).toLocaleDateString()} {new Date(lastPostDate).toLocaleTimeString()}
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Mensajes de error */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit"
              size="small"
              onClick={handleRefresh}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Mensaje de datos de ejemplo (solo si se muestra fallback) */}
      {showFallback && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<InfoIcon />}
        >
          Mostrando datos de ejemplo - Algunas funciones pueden estar limitadas
        </Alert>
      )}
      
      {/* Contenido principal */}
      {loading ? (
        <Box my={2}>
          {[1, 2].map((item) => (
            <Card key={item} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Box>
                <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : posts.length > 0 ? (
        <Grid container spacing={3}>
          {posts.map((post, index) => (
            <Grid item xs={12} md={6} key={post.name || `post-${index}`}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay publicaciones para esta ubicación.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOpenDialog}
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
          >
            Crear Primera Publicación
          </Button>
        </Paper>
      )}

      {/* Dialog para crear nueva publicación */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Nueva Publicación</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="summary"
            label="Contenido de la publicación"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={postForm.summary}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="mediaUrl"
            label="URL de la imagen (opcional)"
            type="url"
            fullWidth
            value={postForm.mediaUrl}
            onChange={handleInputChange}
            helperText="Añade la URL de una imagen para acompañar tu publicación"
            InputProps={{
              startAdornment: <ImageIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitPost} 
            color="primary" 
            variant="contained"
            disabled={!postForm.summary.trim() || submittingPost}
            startIcon={submittingPost ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {submittingPost ? 'Publicando...' : 'Publicar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Componente para mostrar un post individual
function PostCard({ post }) {
  // Extraer la URL de la imagen si existe
  const getImageUrl = () => {
    if (post.media && post.media.length > 0) {
      // API real devuelve googleUrl o sourceUrl
      return post.media[0].googleUrl || post.media[0].sourceUrl || null;
    }
    // Para datos de ejemplo
    return post.mediaUrl || null;
  };
  
  // Formatear fecha relativa
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const postDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };
  
  const imageUrl = getImageUrl();
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tooltip title={new Date(post.createTime).toLocaleString()}>
            <Typography variant="caption" color="text.secondary">
              {getTimeAgo(post.createTime)}
            </Typography>
          </Tooltip>
          <Chip 
            label={post.state === 'LIVE' ? 'Activa' : 'Borrador'} 
            color={post.state === 'LIVE' ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        {imageUrl && (
          <Box 
            sx={{ 
              height: 140, 
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 1,
              mb: 2
            }}
          />
        )}
        
        <Typography variant="body1">
          {post.summary}
        </Typography>
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          color="error"
          startIcon={<DeleteIcon />}
          disabled // Deshabilitado por ahora
        >
          Eliminar
        </Button>
      </CardActions>
    </Card>
  );
}

export default Posts;