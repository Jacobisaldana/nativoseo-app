import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Card, 
  CardContent,
  Rating,
  Button,
  TextField,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Avatar,
  Chip,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Skeleton,
  Divider
} from '@mui/material';
import { useSearchParams, Link } from 'react-router-dom';
import { accountsService, reviewsService, activeLocationsService } from '../services/api';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import InfoIcon from '@mui/icons-material/Info';

// FALLBACK: Datos de ejemplo para mostrar cuando la API falla
const FALLBACK_REVIEWS = [
  {
    name: "accounts/123/locations/456/reviews/1",
    reviewer: { displayName: "Ana García" },
    starRating: 5,
    comment: { text: "Excelente servicio, el personal fue muy atento." },
    createTime: new Date().toISOString()
  },
  {
    name: "accounts/123/locations/456/reviews/2",
    reviewer: { displayName: "Carlos López" },
    starRating: 4,
    comment: { text: "Muy buen servicio, aunque tuve que esperar un poco." },
    createTime: new Date(Date.now() - 86400000).toISOString(),
    reviewReply: {
      comment: "Gracias por tu comentario, Carlos. ¡Esperamos verte pronto!",
      updateTime: new Date(Date.now() - 43200000).toISOString()
    }
  },
  {
    name: "accounts/123/locations/456/reviews/3",
    reviewer: { displayName: "María Rodríguez" },
    starRating: 2,
    comment: { text: "La atención fue correcta pero el producto no cumplió mis expectativas." },
    createTime: new Date(Date.now() - 172800000).toISOString()
  }
];

function Reviews() {
  // Estado
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  
  // Estadísticas reales de la ubicación (independientes de las reseñas mostradas)
  const [stats, setStats] = useState({
    totalReviewCount: 0,
    averageRating: 0,
    pendingReviews: 0,
    loadingStats: false
  });
  
  // Filtros simples
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(1);
  const [onlyUnreplied, setOnlyUnreplied] = useState(false);
  
  // Parámetros de URL
  const accountId = searchParams.get('accountId');
  const locationId = searchParams.get('locationId');
  
  // Cargar cuentas y ubicaciones activas al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primero cargar las ubicaciones activas directamente
        try {
          console.log('Fetching active locations from backend directly...');
          const activeLocationsResponse = await activeLocationsService.getActiveLocations();
          if (activeLocationsResponse.data && Array.isArray(activeLocationsResponse.data)) {
            console.log('Got active locations from backend:', activeLocationsResponse.data);
            
            // Si hay ubicaciones activas, tomar la primera como seleccionada
            if (activeLocationsResponse.data.length > 0) {
              const firstLocation = activeLocationsResponse.data[0];
              console.log('First active location:', firstLocation);
              
              // Si hay un locationId en la URL, mantenerlo, sino usar el primero disponible
              if (!locationId && firstLocation.location_id) {
                setSelectedLocation(firstLocation.location_id);
                console.log('Setting selected location to first active location:', firstLocation.location_id);
                
                // También actualizar la URL para reflejar la ubicación seleccionada
                if (firstLocation.account_id) {
                  setSearchParams({ 
                    locationId: firstLocation.location_id,
                    accountId: firstLocation.account_id 
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching active locations directly:', error);
        }
        
        // Luego cargar las cuentas normalmente
        const response = await accountsService.getAccounts();
        setAccounts(response.data.accounts || []);
        
        // Si hay un accountId en la URL, seleccionarlo y cargar sus ubicaciones
        if (accountId) {
          setSelectedAccount(accountId);
          console.log('Fetching locations for account from URL:', accountId);
          fetchLocations(accountId);
        } else if (response.data.accounts && response.data.accounts.length > 0) {
          // Si no hay accountId en la URL pero hay cuentas disponibles, usar la primera
          const firstAccountId = response.data.accounts[0].name.split('/').pop();
          setSelectedAccount(firstAccountId);
          console.log('No account in URL, using first account:', firstAccountId);
          fetchLocations(firstAccountId);
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar las cuentas. Refresca la página e intenta nuevamente.');
      }
    };
    
    fetchData();
  }, []);
  
  // Cargar ubicaciones cuando se selecciona una cuenta
  const fetchLocations = async (accountIdToUse) => {
    if (!accountIdToUse) {
      console.error('No account ID provided to fetchLocations');
      return;
    }
    
    setLoadingLocations(true);
    try {
      console.log('Fetching locations for account:', accountIdToUse);
      
      // Paso 1: Obtener ubicaciones activas directamente desde el backend
      console.log('Step 1: Fetching active locations from backend');
      let activeLocationsData = [];
      try {
        const activeLocationsResponse = await activeLocationsService.getActiveLocations();
        console.log('Active locations response:', activeLocationsResponse);
        
        if (activeLocationsResponse.data && Array.isArray(activeLocationsResponse.data)) {
          activeLocationsData = activeLocationsResponse.data;
          console.log('Active locations from backend:', activeLocationsData.length, 'items:', activeLocationsData);
        } else {
          console.warn('Unexpected active locations response format:', activeLocationsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching active locations from backend:', error);
        
        // Intentar cargar desde localStorage como respaldo
        console.log('Falling back to localStorage for active locations');
        const storedLocations = localStorage.getItem('activeLocations');
        if (storedLocations) {
          try {
            const activeLocationsIds = JSON.parse(storedLocations);
            console.log('Active locations from localStorage:', activeLocationsIds);
            
            // Convertir IDs a formato de objetos similar al backend
            activeLocationsData = activeLocationsIds.map(id => ({
              location_id: id,
              account_id: accountIdToUse,
              location_name: `Ubicación ${id}`
            }));
          } catch (e) {
            console.error('Error parsing stored locations:', e);
          }
        }
      }
      
      // Si no hay ubicaciones activas, mostrar mensaje y crear algunas de ejemplo para pruebas
      if (activeLocationsData.length === 0) {
        console.log('No active locations found - using example locations for testing');
        setError('No hay ubicaciones activas. Activa al menos una ubicación en la página de Ubicaciones.');
        
        // Para pruebas: crear algunas ubicaciones de ejemplo
        const exampleLocations = [
          { 
            name: "accounts/123/locations/example-1",
            title: "Ubicación de Prueba 1"
          },
          { 
            name: "accounts/123/locations/example-2",
            title: "Ubicación de Prueba 2"
          }
        ];
        
        console.log('Setting example locations for testing:', exampleLocations);
        setLocations(exampleLocations);
        
        // Seleccionar la primera ubicación de ejemplo
        setSelectedLocation("example-1");
        
        setLoadingLocations(false);
        return;
      }
      
      // Paso 2: Obtener todos los detalles de ubicaciones para la cuenta
      console.log('Step 2: Fetching all locations for account:', accountIdToUse);
      const response = await accountsService.getLocations(accountIdToUse);
      console.log('All locations response:', response.data);
      
      const allLocationsData = response.data.locations || [];
      console.log('All locations count:', allLocationsData.length);
      
      // Paso 3: Filtrar para obtener solo las ubicaciones activas con detalles completos
      console.log('Step 3: Filtering active locations with full details');
      const activeLocationsIds = activeLocationsData.map(loc => loc.location_id);
      console.log('Active location IDs:', activeLocationsIds);
      
      const filteredLocations = allLocationsData.filter(loc => {
        const locationId = loc.name.split('/').pop();
        const isActive = activeLocationsIds.includes(locationId);
        console.log(`Location ${locationId} (${loc.title || 'unnamed'}) is active: ${isActive}`);
        return isActive;
      });
      
      console.log(`${filteredLocations.length} active locations loaded (from ${allLocationsData.length} total)`);
      
      // Si no hay ubicaciones después del filtrado, fallback a todas las ubicaciones activas
      // aunque no tengamos todos sus detalles
      if (filteredLocations.length === 0 && activeLocationsData.length > 0) {
        console.log('No filtered locations with details, falling back to active locations without details');
        
        // Crear objetos de ubicación básicos desde las ubicaciones activas
        const basicLocations = activeLocationsData.map(loc => ({
          name: `accounts/${loc.account_id}/locations/${loc.location_id}`,
          title: loc.location_name || `Ubicación ${loc.location_id}`
        }));
        
        console.log('Created basic location objects:', basicLocations);
        setLocations(basicLocations);
        
        // Seleccionar la primera ubicación
        if (basicLocations.length > 0) {
          const firstId = basicLocations[0].name.split('/').pop();
          setSelectedLocation(firstId);
          
          if (!locationId) {
            setSearchParams({ 
              locationId: firstId,
              accountId: accountIdToUse
            });
          }
        }
      } else {
        // Establecer las ubicaciones disponibles (con los detalles completos)
        console.log('Setting filtered locations with full details:', filteredLocations);
        setLocations(filteredLocations);
        
        // Paso 4: Manejar la selección de ubicación
        if (locationId) {
          console.log('URL contains locationId:', locationId, 'checking if active');
          if (activeLocationsIds.includes(locationId)) {
            console.log('Location is active, selecting it');
            setSelectedLocation(locationId);
          } else {
            console.log('Location is NOT active');
            setError('La ubicación seleccionada no está activa. Actívala primero en la página de Ubicaciones.');
            
            // Si hay otras ubicaciones activas, seleccionar la primera
            if (filteredLocations.length > 0) {
              const firstActiveLocationId = filteredLocations[0].name.split('/').pop();
              console.log('Selecting first active location instead:', firstActiveLocationId);
              setSelectedLocation(firstActiveLocationId);
              setSearchParams({ 
                locationId: firstActiveLocationId,
                accountId: accountIdToUse
              });
            }
          }
        } else if (filteredLocations.length > 0) {
          // Si no hay locationId en URL, seleccionar la primera ubicación activa
          const firstActiveLocationId = filteredLocations[0].name.split('/').pop();
          console.log('No locationId in URL, selecting first active location:', firstActiveLocationId);
          setSelectedLocation(firstActiveLocationId);
          setSearchParams({ 
            locationId: firstActiveLocationId,
            accountId: accountIdToUse
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err);
      setError('Error al cargar las ubicaciones. Refresca la página e intenta nuevamente.');
      
      // Crear ubicaciones de ejemplo para que el usuario pueda ver algo
      const exampleLocations = [
        { 
          name: "accounts/123/locations/example-1",
          title: "Ubicación de Ejemplo 1"
        },
        { 
          name: "accounts/123/locations/example-2",
          title: "Ubicación de Ejemplo 2"
        }
      ];
      
      setLocations(exampleLocations);
      setSelectedLocation("example-1");
    } finally {
      setLoadingLocations(false);
    }
  };
  
  // Verificar si la ubicación está activa usando el backend
  const isLocationActive = async () => {
    if (!locationId) return false;
    
    try {
      // Obtener ubicaciones activas desde el backend
      const response = await activeLocationsService.getActiveLocations();
      if (response.data && Array.isArray(response.data)) {
        const activeLocationsIds = response.data.map(loc => loc.location_id);
        console.log(`Checking if location ${locationId} is active: ${activeLocationsIds.includes(locationId)}`);
        return activeLocationsIds.includes(locationId);
      }
      return false;
    } catch (error) {
      console.error('Error checking if location is active:', error);
      
      // Si falla la petición al backend, usar localStorage como respaldo
      const storedLocations = localStorage.getItem('activeLocations');
      if (!storedLocations) return false;
      
      try {
        const activeLocations = JSON.parse(storedLocations);
        return activeLocations.includes(locationId);
      } catch (e) {
        console.error('Error parsing active locations from localStorage:', e);
        return false;
      }
    }
  };
  
  // Cargar reseñas cuando se selecciona una ubicación o cambian los parámetros de URL
  useEffect(() => {
    if (!locationId) return;
    
    const checkLocationAndLoadReviews = async () => {
      // Verificar si la ubicación está activa
      const isActive = await isLocationActive();
      
      if (!isActive) {
        setError('Esta ubicación no está activa. Actívala en la página de ubicaciones para continuar.');
        setLoading(false);
        return;
      }
      
      // Intentar cargar reseñas reales
      setInitialLoading(true);
      setLoading(true);
      
      try {
        // Intentar obtener estadísticas reales
        const statsResponse = await reviewsService.getReviewStats(
          accountId || selectedAccount,
          locationId
        );
        
        if (statsResponse && statsResponse.data) {
          setStats({
            totalReviewCount: statsResponse.data.totalReviewCount || 0,
            averageRating: statsResponse.data.averageRating || 0,
            pendingReviews: statsResponse.data.pendingReviews || 0,
            loadingStats: false
          });
        }
        
        // Intentar obtener reseñas reales
        const reviewsResponse = await reviewsService.getReviews(
          accountId || selectedAccount,
          locationId,
          5 // Tamaño de página pequeño
        );
        
        if (reviewsResponse && reviewsResponse.data && reviewsResponse.data.reviews) {
          setReviews(reviewsResponse.data.reviews);
          setNextPageToken(reviewsResponse.data.nextPageToken || null);
          setHasLoadingError(false);
          setShowFallbackMessage(false);
          setError('');
        } else {
          // Si no hay reseñas, mostrar mensaje pero no es un error
          setReviews([]);
          setHasLoadingError(false);
          setShowFallbackMessage(false);
          setError('');
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        
        // Cargar datos de ejemplo como fallback
        setStats({
          totalReviewCount: 25,
          averageRating: 4.5,
          pendingReviews: 3,
          loadingStats: false
        });
        
        setReviews(FALLBACK_REVIEWS);
        setShowFallbackMessage(true);
        setError('Sistema de reseñas en mantenimiento. Mostrando datos de ejemplo.');
        setHasLoadingError(true);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };
    
    checkLocationAndLoadReviews();
  }, [locationId, accountId, selectedAccount]);
  
  // Aplicar filtros a las reseñas
  useEffect(() => {
    if (!reviews || reviews.length === 0) {
      setFilteredReviews([]);
      return;
    }
    
    let filtered = [...reviews];
    
    // Filtro por puntuación mínima
    if (minRating > 1) {
      filtered = filtered.filter(review => (review.starRating || 0) >= minRating);
    }
    
    // Filtro por reseñas sin responder
    if (onlyUnreplied) {
      filtered = filtered.filter(review => !review.reviewReply);
    }
    
    // Ordenar por más recientes
    filtered = filtered.sort((a, b) => {
      return new Date(b.createTime) - new Date(a.createTime);
    });
    
    setFilteredReviews(filtered);
  }, [reviews, minRating, onlyUnreplied]);
  
  // Cargar más reseñas (paginación)
  const loadMoreReviews = async () => {
    if (!nextPageToken) return;
    
    setLoadingMore(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await reviewsService.getReviews(
        accountId, 
        locationId, 
        3, // Tamaño de página muy pequeño
        nextPageToken,
        controller.signal
      );
      
      clearTimeout(timeoutId);
      
      if (response && response.data) {
        const newReviews = [...reviews, ...(response.data.reviews || [])];
        setReviews(newReviews);
        setNextPageToken(response.data.nextPageToken || null);
      }
    } catch (err) {
      console.error('Error al cargar más reseñas:', err);
      setNotification({
        open: true,
        message: 'No se pudieron cargar más reseñas',
        severity: 'error'
      });
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Ya no necesitamos manejar cambio de cuenta directamente
  
  // Manejar cambio de ubicación
  const handleLocationChange = (event) => {
    const newLocationId = event.target.value;
    setSelectedLocation(newLocationId);
    console.log(`Selected location ${newLocationId}`);
    
    // Actualizar URL con la nueva ubicación
    setSearchParams({ locationId: newLocationId, accountId: accountId || selectedAccount });
  };
  
  // Enviar respuesta a una reseña
  const handleReplySubmit = async (reviewId, replyText) => {
    // No responder si estamos mostrando datos de ejemplo
    if (hasLoadingError) {
      setNotification({
        open: true,
        message: 'No se puede responder a reseñas de ejemplo',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Enviar respuesta a la API
      await reviewsService.replyToReview(accountId, locationId, reviewId, replyText);
      
      // Actualizar estado local
      const updatedReviews = reviews.map(review => {
        if (review.name && review.name.split('/').pop() === reviewId) {
          return {
            ...review,
            reviewReply: {
              comment: replyText,
              updateTime: new Date().toISOString()
            }
          };
        }
        return review;
      });
      
      setReviews(updatedReviews);
      setNotification({
        open: true,
        message: 'Respuesta enviada correctamente',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error al responder:', err);
      setNotification({
        open: true,
        message: 'Error al enviar la respuesta',
        severity: 'error'
      });
    }
  };
  
  // Reset filtros
  const handleResetFilters = () => {
    setMinRating(1);
    setOnlyUnreplied(false);
  };
  
  // Reintentar carga de reseñas
  const handleRetry = () => {
    // Actualizar URL para forzar recarga
    setSearchParams({ accountId, locationId, t: Date.now() });
  };
  
  // Calcular tiempo relativo
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const reviewDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reseñas
      </Typography>
      
      {/* Mensaje para dirigir a la página de ubicaciones */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Gestiona tus ubicaciones activas
        </Typography>
        <Typography variant="body1" paragraph>
          Para trabajar con reseñas, primero debes activar las ubicaciones que quieres gestionar.
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
      
      {/* Filtros principales */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="location-select-label">Ubicación</InputLabel>
              <Select
                labelId="location-select-label"
                id="location-select"
                value={selectedLocation}
                label="Ubicación"
                onChange={handleLocationChange}
                disabled={loadingLocations || initialLoading}
              >
                {locations.length > 0 ? (
                  locations.map(location => (
                    <MenuItem 
                      key={location.name.split('/').pop()} 
                      value={location.name.split('/').pop()}
                    >
                      {location.title || location.name.split('/').pop()}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="example-location">
                    Ubicación de Ejemplo
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={1}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterListIcon />}
                disabled={filteredReviews.length === 0}
              >
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
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
        
        {/* Filtros simples */}
        {showFilters && filteredReviews.length > 0 && (
          <Box mt={3} pt={2} borderTop={1} borderColor="divider">
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="min-rating-label">Puntuación mínima</InputLabel>
                  <Select
                    labelId="min-rating-label"
                    value={minRating}
                    label="Puntuación mínima"
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <MenuItem value={1}>Todas las puntuaciones</MenuItem>
                    <MenuItem value={2}>2 estrellas o más</MenuItem>
                    <MenuItem value={3}>3 estrellas o más</MenuItem>
                    <MenuItem value={4}>4 estrellas o más</MenuItem>
                    <MenuItem value={5}>Solo 5 estrellas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={onlyUnreplied}
                      onChange={(e) => setOnlyUnreplied(e.target.checked)}
                    />
                  }
                  label="Solo mostrar reseñas sin responder"
                />
              </Grid>
              
              <Grid item xs={12} md={4} textAlign="right">
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleResetFilters}
                >
                  Restablecer filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Mensaje de datos de ejemplo */}
      {showFallbackMessage && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<InfoIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<ReplayIcon />}
            >
              Reintentar
            </Button>
          }
        >
          Se están mostrando reseñas de ejemplo. La ubicación puede tener demasiadas reseñas o haber un problema de conexión.
        </Alert>
      )}
      
      {/* Mensaje de error (solo si no estamos mostrando fallback) */}
      {error && !showFallbackMessage && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          icon={<ErrorOutlineIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<ReplayIcon />}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Estadísticas */}
      {selectedAccount && selectedLocation && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Total reseñas</Typography>
              <Typography variant="h4">
                {stats.loadingStats ? (
                  <Skeleton variant="text" width={40} />
                ) : (
                  stats.totalReviewCount || (reviews.length > 0 ? reviews.length : 0)
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Reseñas filtradas</Typography>
              <Typography variant="h4">{filteredReviews.length}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Puntuación media</Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="h4" mr={1}>
                  {stats.loadingStats ? (
                    <Skeleton variant="text" width={40} />
                  ) : (
                    (stats.averageRating || 0).toFixed(1)
                  )}
                </Typography>
                <StarIcon color="warning" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Basado en {stats.totalReviewCount || 0} reseñas en total
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Sin responder</Typography>
              <Typography variant="h4">
                {stats.loadingStats ? (
                  <Skeleton variant="text" width={40} />
                ) : (
                  stats.pendingReviews || reviews.filter(review => !review.reviewReply).length
                )}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Contenido principal */}
      {!selectedAccount || !selectedLocation ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Selecciona una cuenta y ubicación para ver sus reseñas.
          </Typography>
        </Paper>
      ) : initialLoading ? (
        // Esqueletos de carga para mostrar mientras se cargan los datos iniciales
        <Box my={2}>
          {[1, 2, 3].map((item) => (
            <Card key={item} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="40%" height={30} />
                    <Skeleton variant="text" width="20%" />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Skeleton variant="rectangular" width={120} height={36} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : filteredReviews.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {filteredReviews.map((review) => (
              <Grid item xs={12} key={review.name || `review-${Math.random()}`}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={review.reviewer?.profilePhotoUrl} 
                          sx={{ width: 48, height: 48, mr: 2 }}
                        >
                          {review.reviewer?.displayName?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {review.reviewer?.displayName || 'Usuario anónimo'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Rating 
                              value={review.starRating || 0} 
                              readOnly 
                              precision={0.5}
                              icon={<StarIcon fontSize="inherit" sx={{ color: '#FFB400' }} />} 
                              emptyIcon={<StarBorderIcon fontSize="inherit" />}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              {review.starRating || 0}/5
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Tooltip title={new Date(review.createTime).toLocaleDateString()}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {getTimeAgo(review.createTime)}
                          </Typography>
                        </Tooltip>
                        {!review.reviewReply && (
                          <Chip 
                            label="Sin responder" 
                            color="error" 
                            size="small" 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                      {review.comment ? review.comment.text : '(Sin comentario)'}
                    </Typography>
                    
                    {review.reviewReply && (
                      <Box sx={{ mt: 3, pt: 2, pl: 2, borderTop: '1px solid #f0f0f0', borderLeft: '4px solid #f0f0f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.8rem' }}>R</Avatar>
                          Tu respuesta:
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {new Date(review.reviewReply.updateTime).toLocaleString()}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {review.reviewReply.comment}
                        </Typography>
                      </Box>
                    )}
                    
                    {!review.reviewReply && !hasLoadingError && (
                      <ReviewReplyForm 
                        reviewId={review.name ? review.name.split('/').pop() : ''}
                        onSubmit={handleReplySubmit}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {nextPageToken && !hasLoadingError && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Button 
                variant="outlined" 
                onClick={loadMoreReviews}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando...' : 'Cargar más reseñas'}
              </Button>
            </Box>
          )}
        </>
      ) : reviews.length > 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay reseñas que coincidan con los filtros seleccionados.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleResetFilters}
            sx={{ mt: 2 }}
          >
            Restablecer filtros
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay reseñas para esta ubicación.
          </Typography>
        </Paper>
      )}
      
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

// Componente para el formulario de respuesta
function ReviewReplyForm({ reviewId, onSubmit }) {
  const [replyText, setReplyText] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const handleSubmit = () => {
    onSubmit(reviewId, replyText);
    setReplyText('');
    setShowForm(false);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {showForm ? (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0' }}>
          <TextField
            label="Tu respuesta"
            multiline
            rows={3}
            fullWidth
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Escribe tu respuesta a esta reseña..."
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit}
              disabled={!replyText.trim()}
            >
              Responder
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setShowForm(true)}
          >
            Responder
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default Reviews;