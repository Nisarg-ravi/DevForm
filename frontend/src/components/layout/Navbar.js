import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useTheme } from '@mui/material/styles';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <AppBar 
      position="static" 
      elevation={2}
      sx={{
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                textTransform: 'none',
                padding: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  opacity: 0.9,
                },
              }}
            >
              DevForum
            </Button>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/communities/create"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    borderRadius: 1,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Create Community
                </Button>
                {user && (
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to={`/users/${user.username}`}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      borderRadius: 1,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '0.85rem',
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    {user.username}
                  </Button>
                )}
                <Button 
                  color="inherit" 
                  onClick={handleLogout}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    borderRadius: 1,
                    px: 2,
                    ml: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    borderRadius: 1,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Login
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/register"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    borderRadius: 1,
                    px: 2,
                    ml: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
