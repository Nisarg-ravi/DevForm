import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { register, clearError } from '../../features/auth/authSlice';
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Typography,
  Container,
  Box,
  Link,
  Paper,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  console.log(error);
  const theme = useTheme();

  const { username, email, password, confirmPassword } = formData;

  useEffect(() => {
    // If logged in and user navigates to Register page, should redirect them to home
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onChange = (e) => {
    if (apiError) setApiError('');
    // Clear Redux error when user starts typing
    if (error) {
      dispatch(clearError());
    }
    if (errors[e.target.name]) {
      setErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    if (password && password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    try {
      const resultAction = await dispatch(register({ username, email, password }));
      if (resultAction.error) {
        // Error is set in Redux state, but also set local state for display
        const errorMsg = resultAction.payload?.message || 'Registration failed';
        setApiError(errorMsg);
      } else {
        navigate('/');
      }
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={4}
          sx={{
            padding: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 500,
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ backgroundColor: theme.palette.primary.main, color: 'white', width: 48, height: 48 }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600, mb: 1, mt: 1 }}>
            Sign Up
          </Typography>
          <Box component="form" onSubmit={onSubmit} sx={{ mt: 2, width: '100%' }}>
            {(apiError || error) && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }} 
                onClose={() => {
                  setApiError('');
                  if (error) dispatch(clearError());
                }}
              >
                {apiError || error}
              </Alert>
            )}
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="username"
                  name="username"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  value={username}
                  onChange={onChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  autoFocus
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={onChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={onChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>
            <Grid container justifyContent="center">
              <Grid item>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <Box mt={5}>
          <Typography variant="body2" color="text.secondary" align="center">
            <Link component={RouterLink} to="/" color="inherit">
              Dev-Connect
            </Link>{' '}
            {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
