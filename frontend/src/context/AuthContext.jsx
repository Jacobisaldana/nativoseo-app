import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Crear el contexto de autenticación
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Cargar el perfil del usuario
  async function loadUserProfile() {
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Iniciar sesión
  async function login(credentials) {
    try {
      setError('');
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      await loadUserProfile();
      return response.data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError(error.response?.data?.detail || 'Error al iniciar sesión');
      throw error;
    }
  }

  // Registrar un nuevo usuario
  async function register(userData) {
    try {
      setError('');
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      console.error('Error al registrar:', error);
      setError(error.response?.data?.detail || 'Error al registrar usuario');
      throw error;
    }
  }

  // Obtener URL de autenticación con Google
  async function getGoogleAuthUrl() {
    try {
      const response = await authService.getGoogleAuthUrl();
      return response.data.auth_url;
    } catch (error) {
      console.error('Error al obtener URL de Google:', error);
      setError('Error al conectar con Google');
      throw error;
    }
  }

  // Guardar tokens de Google
  async function saveGoogleTokens(accessToken, refreshToken) {
    try {
      const response = await authService.saveToken(accessToken, refreshToken);
      return response.data;
    } catch (error) {
      console.error('Error al guardar tokens:', error);
      setError('Error al guardar tokens de Google');
      throw error;
    }
  }

  // Cerrar sesión
  function logout() {
    localStorage.removeItem('token');
    setCurrentUser(null);
  }

  const value = {
    currentUser,
    login,
    logout,
    register,
    getGoogleAuthUrl,
    saveGoogleTokens,
    error,
    setError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}