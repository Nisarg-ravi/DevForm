import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios defaults with timeout
axios.defaults.timeout = 15000; // 15 seconds timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Load token from localStorage if it exists and set axios header
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const initialState = {
  token: token || null,
  isAuthenticated: false, // Will be set to true after loadUser succeeds
  loading: !!token, // Show loading if token exists (user data needs to be loaded)
  user: null,
  error: null,
};

// Helper function to set auth token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Register User
export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue, dispatch }) => {
    try {
      const body = JSON.stringify({ username, email, password });
      const res = await axios.post('/api/auth/register', body);
      
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      // Handle network errors and timeouts
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return rejectWithValue({ message: 'Request timed out. Please try again.' });
      }
      if (!err.response) {
        return rejectWithValue({ message: 'Network error. Please check your connection.' });
      }
      // Handle 500 errors
      if (err.response?.status === 500) {
        return rejectWithValue({ message: 'Server error. Please try again later.' });
      }
      // Handle validation errors
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        return rejectWithValue({ message: errors[0]?.msg || 'Validation failed' });
      }
      const errorMessage = err.response?.data?.message || 'Registration failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// Login User
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const body = JSON.stringify({ email, password });
      const res = await axios.post('/api/auth/login', body);
      
      setAuthToken(res.data.token);
      
      return res.data;
    } catch (err) {
      // Handle network errors and timeouts
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return rejectWithValue({ message: 'Request timed out. Please try again.' });
      }
      if (!err.response) {
        return rejectWithValue({ message: 'Network error. Please check your connection.' });
      }
      // Handle 500 errors
      if (err.response?.status === 500) {
        return rejectWithValue({ message: 'Server error. Please try again later.' });
      }
      // Handle other errors
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// Load User - Get user data from token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue({ message: 'No token found', silent: true });
      }

      setAuthToken(token);
      const res = await axios.get('/api/auth/user');
      return { user: res.data };
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Don't show error for expired/invalid tokens - just clear auth state silently
      if (err.response?.status === 401 || err.response?.status === 403) {
        return rejectWithValue({ message: 'Session expired', silent: true });
      }
      // Handle network errors and timeouts
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return rejectWithValue({ message: 'Request timed out', silent: true });
      }
      if (!err.response) {
        return rejectWithValue({ message: 'Network error', silent: true });
      }
      // Handle 500 errors
      if (err.response?.status === 500) {
        return rejectWithValue({ message: 'Server error', silent: true });
      }
      return rejectWithValue({ message: 'Failed to load user', silent: true });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      setAuthToken(null);
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        if (action.payload?.token) {
          setAuthToken(action.payload.token);
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.loading = false;
          state.error = null;
        } else {
          state.loading = false;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        setAuthToken(token);
        state.token = token;
        state.isAuthenticated = true;
        state.user = user;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        setAuthToken(null);
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        setAuthToken(null);
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        // Only set error if not silent (for user-initiated actions)
        if (!action.payload?.silent) {
          state.error = action.payload?.message || 'Failed to load user';
        } else {
          state.error = null;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export const selectIsAuthenticated = state => state.auth.isAuthenticated;
export const selectUser = state => state.auth.user;

export default authSlice.reducer;
