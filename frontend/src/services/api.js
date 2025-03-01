import axios from 'axios';

const API_URL = '/api';

// Crear instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    return api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  getProfile: () => api.get('/auth/me'),
  getGoogleAuthUrl: () => api.get('/auth/login-test'),
  saveToken: (accessToken, refreshToken) => 
    api.get(`/save-token?access_token=${accessToken}&refresh_token=${refreshToken}`),
};

// Servicios para las cuentas de Google
export const accountsService = {
  getAccounts: () => api.get('/test-accounts'),
  getLocations: (accountId) => api.get(`/test-locations/${accountId}`),
};

// Servicios para las reseñas
export const reviewsService = {
  getReviews: (accountId, locationId, pageSize = 5, pageToken = null, signal = null) => {
    let url = `/test-reviews?account_id=${accountId}&location_id=${locationId}&page_size=${pageSize}`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }
    
    console.log(`Fetching reviews with URL: ${url}`);
    
    // Reducir el timeout para que no se quede colgado
    return api.get(url, { 
      timeout: 10000,
      signal: signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  
  // Nuevo método para obtener solo estadísticas
  getReviewStats: (accountId, locationId) => {
    let url = `/test-reviews?account_id=${accountId}&location_id=${locationId}&stats_only=true`;
    
    console.log(`Fetching review stats with URL: ${url}`);
    
    return api.get(url, {
      timeout: 5000, // Timeout más corto para estadísticas
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  replyToReview: (accountId, locationId, reviewId, replyText) => {
    console.log(`Replying to review: ${reviewId} with: ${replyText}`);
    return api.post('/test-reviews/reply', null, {
      params: {
        account_id: accountId,
        location_id: locationId,
        review_id: reviewId,
        reply_text: replyText
      }
    });
  }
};

// Servicios para ubicaciones activas
export const activeLocationsService = {
  getActiveLocations: () => api.get('/locations/active'),
  
  activateLocation: (accountId, locationId, locationName) => api.post('/locations/active', {
    account_id: accountId,
    location_id: locationId,
    location_name: locationName
  }),
  
  deactivateLocation: (locationId, accountId) => api.delete(`/locations/active/${locationId}`, {
    params: { account_id: accountId }
  })
};

// Servicios para las publicaciones
export const postsService = {
  // Método para subir imágenes
  uploadImage: (file) => {
    // Crear un FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`Uploading image: ${file.name}`);
    
    // Usar una instancia específica para esta petición porque cambia el Content-Type
    return api.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000 // 60 segundos para subidas
    })
    .then(response => {
      console.log("Image upload successful:", response.data);
      return response;
    })
    .catch(error => {
      console.error("Image upload error:", error.response || error);
      throw error;
    });
  },
  
  // Método original (mantener para compatibilidad)
  getPosts: (accountId, locationId, pageSize = 10, pageToken = null, signal = null) => {
    let url = `/test-posts?account_id=${accountId}&location_id=${locationId}&page_size=${pageSize}`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }
    
    console.log(`Fetching posts with URL: ${url}`);
    
    return api.get(url, { 
      timeout: 30000, // Aumentar timeout a 30 segundos
      signal: signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    .then(response => {
      console.log("Posts API response successful:", response);
      return response;
    })
    .catch(error => {
      console.error("Posts API error:", error.response || error);
      // Propagar el error después de registrarlo
      throw error;
    });
  },
  
  // Nuevo método para obtener posts de ubicaciones activas
  getActivePosts: (pageSize = 10, pageToken = null, signal = null) => {
    let url = `/active-posts?page_size=${pageSize}`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }
    
    console.log(`Fetching active posts with URL: ${url}`);
    
    return api.get(url, { 
      timeout: 30000,
      signal: signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    .then(response => {
      console.log("Active posts API response successful:", response);
      return response;
    })
    .catch(error => {
      console.error("Active posts API error:", error.response || error);
      throw error;
    });
  },
  
  // Función que intenta cargar posts y cae back a datos de ejemplo si falla
  getPostsWithFallback: async (pageSize = 10, signal = null) => {
    try {
      // Usar el nuevo endpoint de ubicaciones activas
      const result = await postsService.getActivePosts(pageSize, null, signal);
      console.log("Active posts API response:", result.data);
      
      // Depurar posts recibidos
      if (result.data.posts && result.data.posts.length > 0) {
        console.log("First post from API:", JSON.stringify(result.data.posts[0], null, 2));
        
        // Verificar específicamente la estructura de media
        if (result.data.posts[0].media) {
          console.log("Media structure from API:", JSON.stringify(result.data.posts[0].media, null, 2));
        } else {
          console.warn("No media found in first post");
        }
      }
      
      // Verificar las ubicaciones
      if (result.data.locations && result.data.locations.length > 0) {
        console.log("Locations from API:", JSON.stringify(result.data.locations, null, 2));
      }
      
      // Adaptar y procesar posts para asegurar compatibilidad con la UI
      const processedPosts = (result.data.posts || []).map(post => {
        // Conservar estructura completa
        return {
          ...post,
          // Asegurar que siempre haya una propiedad media como array
          media: Array.isArray(post.media) 
            ? post.media 
            : (post.media ? [post.media] : []),
          // Asegurar que el estado sea LIVE por defecto si no está definido
          state: post.state || 'LIVE',
          // Mantener compatibilidad con fechas
          createTime: post.createTime || post.updateTime || new Date().toISOString()
        };
      });
      
      // Calcular días desde última publicación
      let minDaysSinceLastPost = 999;
      if (result.data.locations && result.data.locations.length > 0) {
        const validDays = result.data.locations
          .map(loc => loc.daysSinceLastPost)
          .filter(days => days !== null && days !== undefined);
          
        if (validDays.length > 0) {
          minDaysSinceLastPost = Math.min(...validDays);
        } else if (processedPosts.length > 0) {
          // Intentar calcular en base a la fecha del post más reciente
          const latestPost = processedPosts[0];
          if (latestPost.createTime) {
            try {
              const postDate = new Date(latestPost.createTime);
              const diffTime = Math.abs(new Date() - postDate);
              minDaysSinceLastPost = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            } catch (e) {
              console.warn("Error calculating days from post date:", e);
            }
          }
        }
      }
      
      return {
        success: true,
        data: {
          // Adaptar estructura de datos para mantener compatibilidad
          localPosts: processedPosts,
          locations: result.data.locations || [],
          // Días desde la última publicación
          daysSinceLastPost: minDaysSinceLastPost === 999 ? 0 : minDaysSinceLastPost,
          // Fecha de la última publicación
          lastPostDate: processedPosts.length > 0 ? processedPosts[0].createTime : null
        },
        error: null
      };
    } catch (error) {
      console.error("Error in getPostsWithFallback:", error);
      // Datos de ejemplo como fallback
      const fallbackData = {
        localPosts: [
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
        ],
        locations: [{
          locationId: "example-location",
          locationName: "Ubicación de Ejemplo",
          daysSinceLastPost: 0,
          postCount: 2
        }],
        nextPageToken: null,
        lastPostDate: new Date().toISOString(),
        daysSinceLastPost: 0,
        error: error.message || "Error al cargar publicaciones"
      };
      
      return {
        success: false,
        data: fallbackData,
        error: error.message || "Error al cargar publicaciones"
      };
    }
  },
  
  // Método para crear posts (mantener para compatibilidad)
  createPost: (accountId, locationId, summary, mediaUrl = null) => {
    console.log(`Creating post for location: ${locationId}`);
    return api.post('/test-posts/create', null, {
      params: {
        account_id: accountId,
        location_id: locationId,
        summary: summary,
        media_url: mediaUrl
      },
      timeout: 30000 // Aumentar timeout para creación también
    })
    .then(response => {
      console.log("Create post response:", response);
      return response;
    })
    .catch(error => {
      console.error("Create post error:", error.response || error);
      throw error;
    });
  },
  
  // Nuevo método para crear posts en ubicaciones activas (versión simple)
  createActivePost: (locationId, summary, mediaUrl = null) => {
    console.log(`Creating post for active location: ${locationId}`);
    return api.post('/active-posts/create', null, {
      params: {
        location_id: locationId,
        summary: summary,
        media_url: mediaUrl
      },
      timeout: 30000
    })
    .then(response => {
      console.log("Create active post response:", response);
      return response;
    })
    .catch(error => {
      console.error("Create active post error:", error.response || error);
      throw error;
    });
  },
  
  // Método extendido para crear posts con todos los parámetros
  createActivePostExtended: (locationId, postData) => {
    console.log(`Creating extended post for location: ${locationId}`, postData);
    
    // Construir objeto con parámetros para la solicitud
    const params = {
      location_id: locationId,
      summary: postData.summary,
      media_url: postData.mediaUrl,
      language_code: postData.languageCode,
      topic_type: postData.topicType,
      cta_type: postData.callToAction.actionType,
      cta_url: postData.callToAction.url
    };
    
    return api.post('/active-posts/create-extended', null, {
      params: params,
      timeout: 30000
    })
    .then(response => {
      console.log("Create extended post response:", response);
      return response;
    })
    .catch(error => {
      console.error("Create extended post error:", error.response || error);
      throw error;
    });
  }
};

export default api;