import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  Button, 
  Alert 
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { accountsService } from '../services/api';
import { Link } from 'react-router-dom';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsService.getAccounts();
      setAccounts(response.data.accounts || []);
      setError('');
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      setError('No se pudieron cargar las cuentas. Asegúrate de estar autenticado y tener permisos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cuentas de Google Business
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Aquí puedes ver todas tus cuentas de Google Business vinculadas. 
          Selecciona una cuenta para ver sus ubicaciones.
        </Typography>
        <Button 
          component={Link} 
          to="/connect-google" 
          variant="contained" 
          color="primary"
        >
          Vincular con Google
        </Button>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : accounts.length > 0 ? (
        <Paper elevation={3}>
          <List>
            {accounts.map((account, index) => (
              <React.Fragment key={account.name || index}>
                <ListItem 
                  button 
                  component={Link}
                  to={`/locations?accountId=${account.name.split('/').pop()}`}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={account.accountName || 'Cuenta sin nombre'} 
                    secondary={`ID: ${account.name.split('/').pop()}`}
                  />
                </ListItem>
                {index < accounts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron cuentas vinculadas.
          </Typography>
          <Button 
            component={Link} 
            to="/connect-google" 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
          >
            Vincular con Google
          </Button>
        </Paper>
      )}
    </Box>
  );
}

export default Accounts;