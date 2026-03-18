import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { createCommunity } from '../../features/questions/questionsSlice';

const CreateCommunity = () => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  console.log(user);
  const { loading } = useSelector(state => state.questions);

  const { name, displayName, description } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const validateName = (name) => {
    // Only lowercase letters and numbers, 2-30 characters
    return /^[a-z0-9]{2,30}$/.test(name);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!name || !displayName) {
      setError('Community name and display name are required');
      return;
    }
    
    if (!validateName(name)) {
      setError('Community name must be 2-30 characters and contain only lowercase letters and numbers');
      return;
    }
    
    try {
      const result = await dispatch(createCommunity({
        name: name.toLowerCase(),
        displayName,
        description,
      })).unwrap();
      
      setSuccess(`Community r/${result.name} created successfully!`);
      // Reset form
      setFormData({ name: '', displayName: '', description: '' });
      // Navigate to community page or home after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create community');
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Please sign in to create a community
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create a Community
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={onSubmit}>
          {/* Community Name */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Community Name
              <Typography component="span" color="error">*</Typography>
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              This will be the URL of your community (e.g., r/java). Only lowercase letters and numbers, 2-30 characters.
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="java"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">r/</InputAdornment>,
              }}
              helperText="This cannot be changed later"
            />
          </Box>

          {/* Display Name */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Display Name
              <Typography component="span" color="error">*</Typography>
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              The public name of your community (e.g., "Java Programming")
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              name="displayName"
              value={displayName}
              onChange={onChange}
              placeholder="Java Programming"
              required
            />
          </Box>

          {/* Description */}
          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              Describe what your community is about (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              name="description"
              value={description}
              onChange={onChange}
              placeholder="A community for Java developers to share knowledge and ask questions..."
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500 characters`}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !name || !displayName}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Create Community'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateCommunity;

