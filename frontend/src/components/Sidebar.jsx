import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  RateReview as ReviewIcon,
  PostAdd as PostIcon,
  Login as LoginIcon,
  AppRegistration as RegisterIcon,
  Google as GoogleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

function Sidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      auth: true
    },
    {
      text: 'Cuentas',
      icon: <BusinessIcon />,
      path: '/accounts',
      auth: true
    },
    {
      text: 'Ubicaciones',
      icon: <LocationIcon />,
      path: '/locations',
      auth: true
    },
    {
      text: 'Reseñas',
      icon: <ReviewIcon />,
      path: '/reviews',
      auth: true
    },
    {
      text: 'Publicaciones',
      icon: <PostIcon />,
      path: '/posts',
      auth: true
    },
    {
      text: 'Conectar con Google',
      icon: <GoogleIcon />,
      path: '/connect-google',
      auth: true
    },
  ];

  const authItems = currentUser
    ? [
        {
          text: 'Cerrar Sesión',
          icon: <LogoutIcon />,
          onClick: handleLogout,
          path: '#',
        },
      ]
    : [
        {
          text: 'Iniciar Sesión',
          icon: <LoginIcon />,
          path: '/login',
        },
        {
          text: 'Registrarse',
          icon: <RegisterIcon />,
          path: '/register',
        },
      ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          NativoSEO App
        </Typography>
        {currentUser && (
          <Typography variant="body2" color="text.secondary">
            {currentUser.username}
          </Typography>
        )}
      </Box>
      
      <Divider />

      <List>
        {menuItems
          .filter(item => !item.auth || currentUser)
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      <Divider />

      <List>
        {authItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={item.onClick ? 'button' : Link}
              to={!item.onClick ? item.path : undefined}
              onClick={item.onClick}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;