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
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Image as ImageIcon, 
  Delete as DeleteIcon,
  Send as SendIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  CloudUpload as CloudUploadIcon,
  InsertPhoto as InsertPhotoIcon
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
    mediaUrl: '',
    languageCode: 'es',
    callToAction: {
      actionType: 'LEARN_MORE',
      url: 'https://atmosferadecoraciones.com/cortinas/'
    },
    topicType: 'STANDARD'
  });
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [daysSinceLastPost, setDaysSinceLastPost] = useState(null);
  const [lastPostDate, setLastPostDate] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [submittingPost, setSubmittingPost] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  
  // Estado para la carga de imágenes
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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
          console.log("Posts array:", result.data.localPosts);
          
          // Verificar si hay publicaciones con imágenes
          if (result.data.localPosts && result.data.localPosts.length > 0) {
            let hasImages = false;
            result.data.localPosts.forEach((post, index) => {
              if (post.media && post.media.length > 0) {
                console.log(`Post ${index} has media:`, post.media);
                hasImages = true;
              }
            });
            console.log("¿Hay publicaciones con imágenes?", hasImages);
          }
          
          // Establecer los posts
          setPosts(result.data.localPosts || []);
          
          // Establecer las ubicaciones disponibles
          if (result.data.locations && result.data.locations.length > 0) {
            console.log("Locations from API:", result.data.locations);
            setLocations(result.data.locations);
            
            // Si no hay una ubicación seleccionada, seleccionar la primera
            if (!selectedLocation && result.data.locations.length > 0) {
              setSelectedLocation(result.data.locations[0].locationId);
              console.log("Selected first location:", result.data.locations[0].locationId);
            }
          } else {
            console.warn("No locations found in API response");
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
  const handleLocationChange = async (event) => {
    const newLocationId = event.target.value;
    setSelectedLocation(newLocationId);
    setLoading(true);
    
    try {
      // Si estamos usando datos de ejemplo, filtrar los posts por ubicación
      if (showFallback) {
        const filteredPosts = EXAMPLE_POSTS.filter(post => 
          post.locationInfo && post.locationInfo.locationId === newLocationId
        );
        setPosts(filteredPosts.length > 0 ? filteredPosts : []);
      } else {
        // Cargar posts específicos de esta ubicación desde la API
        console.log(`Cargando posts para la ubicación: ${newLocationId}`);
        
        // Buscar la cuenta de esta ubicación en las ubicaciones cargadas
        const selectedLocationInfo = locations.find(loc => loc.locationId === newLocationId);
        if (!selectedLocationInfo) {
          console.error(`No se encontró información para la ubicación: ${newLocationId}`);
          setPosts([]);
          setLoading(false);
          return;
        }
        
        // Llamar a la API para obtener posts de esta ubicación específica
        const response = await postsService.getPosts(
          selectedLocationInfo.accountId, 
          newLocationId,
          10
        );
        
        if (response && response.data && response.data.localPosts) {
          // Añadir información de la ubicación a cada post
          const postsWithLocationInfo = response.data.localPosts.map(post => ({
            ...post,
            locationInfo: {
              locationId: newLocationId,
              accountId: selectedLocationInfo.accountId,
              locationName: selectedLocationInfo.locationName
            }
          }));
          
          setPosts(postsWithLocationInfo);
          setDaysSinceLastPost(response.data.daysSinceLastPost || null);
          setLastPostDate(response.data.lastPostDate || null);
        } else {
          // No se encontraron posts para esta ubicación
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar posts para la ubicación:', error);
      setPosts([]);
      setNotification({
        open: true,
        message: 'Error al cargar publicaciones para esta ubicación',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
      mediaUrl: '',
      localImagePreview: null,
      languageCode: 'es',
      callToAction: {
        actionType: 'LEARN_MORE',
        url: 'https://atmosferadecoraciones.com/cortinas/'
      },
      topicType: 'STANDARD'
    });
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar cambios en campos anidados como callToAction
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPostForm({
        ...postForm,
        [parent]: {
          ...postForm[parent],
          [child]: value
        }
      });
    } else {
      // Manejar cambios en campos de nivel superior
      setPostForm({
        ...postForm,
        [name]: value
      });
    }
  };
  
  // Manejar la selección de archivo
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setNotification({
          open: true,
          message: 'El archivo seleccionado no es una imagen válida',
          severity: 'error'
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Preview local de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        // No establecemos mediaUrl aquí, porque queremos subir la imagen primero
        setPostForm({
          ...postForm,
          localImagePreview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Subir imagen al servidor
  const handleUploadImage = async () => {
    if (!selectedFile) return;
    
    setUploadingImage(true);
    try {
      const response = await postsService.uploadImage(selectedFile);
      
      // Actualizar el formulario con la URL de la imagen
      setPostForm({
        ...postForm,
        mediaUrl: response.data.url,
        // Mantener la vista previa local
        localImagePreview: postForm.localImagePreview
      });
      
      setNotification({
        open: true,
        message: 'Imagen subida exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setNotification({
        open: true,
        message: `Error al subir la imagen: ${error.message || 'Error desconocido'}`,
        severity: 'error'
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Borrar selección de imagen
  const handleClearImage = () => {
    setSelectedFile(null);
    setPostForm({
      ...postForm,
      mediaUrl: '',
      localImagePreview: null
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
        // Modo real usando la API con parámetros extendidos
        console.log('Enviando formulario completo:', postForm);
        const response = await postsService.createActivePostExtended(
          selectedLocation,
          {
            summary: postForm.summary,
            mediaUrl: postForm.mediaUrl || null,
            languageCode: postForm.languageCode,
            callToAction: postForm.callToAction,
            topicType: postForm.topicType
          }
        );
        
        // Añadir el nuevo post al estado usando nuestra función especializada
        if (response && response.data) {
          // Usar la función especializada para añadir el post a la lista
          addPostToList(response.data);
          
          setNotification({
            open: true,
            message: 'Publicación creada exitosamente',
            severity: 'success'
          });
          
          // Programar un refresh automático después de unos segundos
          // para asegurarnos de que la imagen se actualice si Google la procesa
          setTimeout(() => {
            if (!showFallback) {
              console.log('Refrescando lista para actualizar imágenes...');
              handleRefresh();
            }
          }, 5000); // Esperar 5 segundos
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
  
  // Actualizar la lista de posts después de crear uno nuevo
  const addPostToList = (newPostData) => {
    try {
      // Asegúrarse de que tengamos datos válidos
      if (!newPostData) return;
      
      console.log('Nuevo post a agregar a la lista:', newPostData);
      
      // Extraer la URL de la imagen si existe
      let imageUrl = null;
      let mediaItems = [];
      
      // Procesar los datos de media
      if (newPostData.media && Array.isArray(newPostData.media) && newPostData.media.length > 0) {
        mediaItems = newPostData.media;
        
        // Intentar extraer la URL de la imagen
        if (newPostData.media[0].googleUrl) {
          imageUrl = newPostData.media[0].googleUrl;
        } else if (newPostData.media[0].sourceUrl) {
          imageUrl = newPostData.media[0].sourceUrl;
        }
      } else if (newPostData.sourceUrl) {
        // Si hay sourceUrl pero no hay media, crear un objeto media
        imageUrl = newPostData.sourceUrl;
        mediaItems = [{ mediaFormat: "PHOTO", sourceUrl: newPostData.sourceUrl }];
      }
      
      // Crear un objeto de post bien formateado
      const formattedPost = {
        ...newPostData,
        media: mediaItems,
        // Asegurar que estas propiedades existan
        createTime: newPostData.createTime || new Date().toISOString(),
        updateTime: newPostData.updateTime || new Date().toISOString(),
        state: newPostData.state || 'LIVE',
        // Añadir información de imagen explícitamente si existe
        ...(imageUrl ? { imageUrl } : {})
      };
      
      console.log('Post formateado para lista:', formattedPost);
      
      // Agregar al inicio de la lista de posts
      setPosts(prev => [formattedPost, ...prev]);
      
      // Actualizar información de última publicación
      setDaysSinceLastPost(0);
      setLastPostDate(new Date().toISOString());
    } catch (error) {
      console.error('Error al preparar post para la lista:', error);
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
          {[1, 2, 3].map((item) => (
            <Paper key={item} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton variant="rectangular" width={120} height={80} sx={{ mr: 2, flexShrink: 0 }} />
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="text" sx={{ mb: 1 }} height={30} />
                  <Skeleton variant="text" width="80%" />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : posts.length > 0 ? (
        <Paper elevation={1}>
          <Box sx={{ overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Imagen</TableCell>
                  <TableCell>Contenido</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post, index) => {
                  // Extraer la URL de la imagen si existe
                  let imageUrl = null;
                  
                  // Imprimir el objeto post completo para depuración
                  console.log('Post data:', JSON.stringify(post, null, 2));
                  
// Verificar específicamente si hay una imagen de Google
if (post.media && Array.isArray(post.media)) {
  post.media.forEach((mediaItem, idx) => {
    if (mediaItem.googleUrl) {
      console.log(`Encontrada googleUrl en post.media[${idx}]:`, mediaItem.googleUrl);
    }
  });
}
                  
                  // Verificar la estructura de media en el post
                  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
                    console.log('Media found:', post.media[0]);
                    
                    // Verificar si googleUrl existe directamente
                    if (post.media[0].googleUrl) {
                      imageUrl = post.media[0].googleUrl;
                      console.log('Using googleUrl:', imageUrl);
                    } 
                    // Alternativas si googleUrl no existe
                    else if (post.media[0].sourceUrl) {
                      imageUrl = post.media[0].sourceUrl;
                      console.log('Using sourceUrl:', imageUrl);
                    } 
                    // Si media[0] es una cadena, usarla directamente
                    else if (typeof post.media[0] === 'string') {
                      imageUrl = post.media[0];
                      console.log('Using media string:', imageUrl);
                    }
                    // Si hay un campo name en el objeto media, podría contener una referencia a la imagen
                    else if (post.media[0].name) {
                      // Construir URL basada en el ID de la imagen (usualmente la última parte del name)
                      const nameParts = post.media[0].name.split('/');
                      const imageId = nameParts[nameParts.length - 1];
                      if (imageId && imageId.startsWith('AF1QipP')) {
                        imageUrl = `https://lh3.googleusercontent.com/p/${imageId}`;
                        console.log('Constructed URL from name:', imageUrl);
                      }
                    }
                  } 
                  // Verificar si hay un campo mediaUrl en la raíz del objeto
                  else if (post.mediaUrl) {
                    imageUrl = post.mediaUrl;
                    console.log('Using mediaUrl at root level:', imageUrl);
                  }
                  
                  // Para posts recién creados, Google puede no haber procesado la imagen aún.
                  // Intentar extraer la URL de sourceUrl que enviamos en la creación del post
                  if (!imageUrl && post.name && post.name.includes('localPosts') && post.createTime) {
                    // Comprobar si el post se creó hace menos de 1 hora
                    const creationTime = new Date(post.createTime);
                    const now = new Date();
                    const diffMs = now - creationTime;
                    const diffMins = Math.floor(diffMs / 60000);
                    
                    if (diffMins < 60) {
                      console.log('Post recién creado, buscando sourceUrl en la estructura completa');
                      
                      // Buscar recursivamente cualquier propiedad sourceUrl en el objeto post
                      const findSourceUrl = (obj) => {
                        if (!obj || typeof obj !== 'object') return null;
                        
                        if (obj.sourceUrl && typeof obj.sourceUrl === 'string') {
                          return obj.sourceUrl;
                        }
                        
                        for (const key in obj) {
                          if (typeof obj[key] === 'object') {
                            const found = findSourceUrl(obj[key]);
                            if (found) return found;
                          }
                        }
                        
                        return null;
                      };
                      
                      const foundUrl = findSourceUrl(post);
                      if (foundUrl) {
                        console.log('Found sourceUrl in post:', foundUrl);
                        imageUrl = foundUrl;
                      }
                    }
                  }
                  
                  // Validar que la URL sea segura antes de usarla
                  if (imageUrl && !imageUrl.startsWith('http')) {
                    console.log('Invalid URL (does not start with http):', imageUrl);
                    imageUrl = null;
                  }
                  
                  console.log('Final image URL:', imageUrl);
                  
                  // Formatear fecha
                  const formattedDate = post.createTime 
                    ? new Date(post.createTime).toLocaleDateString() + ' ' + new Date(post.createTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    : 'Fecha no disponible';
                  
                  // Calcular días desde creación
                  const daysAgo = post.createTime 
                    ? Math.floor((new Date() - new Date(post.createTime)) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                    <TableRow key={post.name || `post-${index}`}>
                      <TableCell>
                        {imageUrl ? (
                          <Box 
                            component="img"
                            src={imageUrl}
                            alt="Post image"
                            sx={{ 
                              width: 120, 
                              height: 80, 
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                            loading="lazy"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            onLoad={() => console.log('Imagen cargada correctamente:', imageUrl)}
                            onError={(e) => {
                              console.error('Error loading image:', imageUrl);
                              // Intenta una URL alternativa para imágenes de Google
                              if (imageUrl && imageUrl.includes('lh3.googleusercontent.com/p/AF1QipM')) {
                                console.log('Intentando URL alternativa para imagen de Google');
                                // Extraer el ID de la imagen
                                const idMatch = imageUrl.match(/p\/(AF1Qip[A-Za-z0-9_-]+)/);
                                if (idMatch && idMatch[1]) {
                                  const altUrl = `https://lh3.googleusercontent.com/p/${idMatch[1]}=w600`;
                                  console.log('URL alternativa:', altUrl);
                                  e.target.src = altUrl;
                                  return;
                                }
                              }
                              
                              // Si no se puede cargar, mostrar placeholder
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent) {
                                parent.style.backgroundColor = '#f0f0f0';
                                parent.style.display = 'flex';
                                parent.style.alignItems = 'center';
                                parent.style.justifyContent = 'center';
                                
                                // Crear un ícono para mostrar en lugar de la imagen
                                const icon = document.createElement('div');
                                icon.innerHTML = 
                                  '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#9e9e9e">' +
                                  '<path d="M0 0h24v24H0V0z" fill="none"/>' +
                                  '<path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>' +
                                  '</svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              width: 120, 
                              height: 80, 
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ImageIcon color="disabled" />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxHeight: '80px', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {post.summary}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formattedDate}>
                          <Typography variant="body2">
                            {daysAgo === 0 ? 'Hoy' : 
                             daysAgo === 1 ? 'Ayer' : 
                             daysAgo < 7 ? `Hace ${daysAgo} días` : 
                             daysAgo < 30 ? `Hace ${Math.floor(daysAgo / 7)} semanas` : 
                             `Hace ${Math.floor(daysAgo / 30)} meses`}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={post.state === 'LIVE' ? 'Activa' : 'Borrador'} 
                          color={post.state === 'LIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          component="a"
                          href={post.searchUrl || "#"}
                          target="_blank"
                          disabled={!post.searchUrl}
                          title="Ver publicación"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          title="Eliminar"
                          disabled
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>
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
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Nueva Publicación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
                sx={{ mb: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Imagen
              </Typography>
              
              {/* Sección para subir imagen */}
              <Box sx={{ mb: 2, border: '1px dashed #ccc', borderRadius: 1, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-image-button"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="upload-image-button">
                      <Button
                        variant="outlined" 
                        component="span"
                        startIcon={<InsertPhotoIcon />}
                        fullWidth
                        disabled={uploadingImage}
                      >
                        Seleccionar Imagen
                      </Button>
                    </label>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={uploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                      onClick={handleUploadImage}
                      disabled={!selectedFile || uploadingImage || postForm.mediaUrl}
                      fullWidth
                    >
                      {uploadingImage ? 'Subiendo...' : 'Subir al Servidor'}
                    </Button>
                  </Grid>
                  
                  {selectedFile && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                        </Typography>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={handleClearImage}
                          disabled={uploadingImage}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
              
              {/* Campo de URL (se mantiene como opción alternativa) */}
              <TextField
                margin="dense"
                name="mediaUrl"
                label="O pega la URL de una imagen"
                type="url"
                fullWidth
                value={postForm.mediaUrl}
                onChange={handleInputChange}
                helperText="Si prefieres, puedes pegar una URL directamente"
                InputProps={{
                  startAdornment: <ImageIcon color="action" sx={{ mr: 1 }} />,
                }}
                disabled={!!selectedFile && !postForm.mediaUrl}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                name="languageCode"
                label="Idioma"
                fullWidth
                value={postForm.languageCode}
                onChange={handleInputChange}
                helperText="Idioma de la publicación"
              >
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="en">Inglés</MenuItem>
                <MenuItem value="fr">Francés</MenuItem>
                <MenuItem value="de">Alemán</MenuItem>
                <MenuItem value="pt">Portugués</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                name="topicType"
                label="Tipo de contenido"
                fullWidth
                value={postForm.topicType}
                onChange={handleInputChange}
                helperText="Categoría de la publicación"
              >
                <MenuItem value="STANDARD">Estándar</MenuItem>
                <MenuItem value="EVENT">Evento</MenuItem>
                <MenuItem value="OFFER">Oferta</MenuItem>
                <MenuItem value="PRODUCT">Producto</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Botón de llamada a la acción
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                name="callToAction.actionType"
                label="Tipo de acción"
                fullWidth
                value={postForm.callToAction.actionType}
                onChange={handleInputChange}
                helperText="Qué acción se mostrará en el botón"
              >
                <MenuItem value="LEARN_MORE">Conocer más</MenuItem>
                <MenuItem value="BOOK">Reservar</MenuItem>
                <MenuItem value="ORDER">Ordenar</MenuItem>
                <MenuItem value="SHOP">Comprar</MenuItem>
                <MenuItem value="SIGN_UP">Registrarse</MenuItem>
                <MenuItem value="CALL">Llamar</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="callToAction.url"
                label="URL de destino"
                type="url"
                fullWidth
                value={postForm.callToAction.url}
                onChange={handleInputChange}
                helperText="¿A dónde llevará el botón de acción?"
              />
            </Grid>
          </Grid>
          
          {(postForm.mediaUrl || postForm.localImagePreview) && (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vista previa de imagen
              </Typography>
              <Box 
                component="img"
                src={postForm.mediaUrl || postForm.localImagePreview}
                alt="Vista previa"
                sx={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  objectFit: 'contain',
                  mt: 1
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const errorMsg = document.createElement('p');
                  errorMsg.textContent = 'Error al cargar la imagen. Verifica la URL.';
                  errorMsg.style.color = 'red';
                  e.target.parentNode.appendChild(errorMsg);
                }}
              />
              {postForm.mediaUrl && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  La imagen está lista para ser publicada
                </Typography>
              )}
              {!postForm.mediaUrl && postForm.localImagePreview && (
                <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 1 }}>
                  Recuerda hacer clic en "Subir al Servidor" antes de publicar
                </Typography>
              )}
            </Box>
          )}
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