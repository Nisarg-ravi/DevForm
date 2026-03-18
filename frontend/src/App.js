import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box, CircularProgress } from "@mui/material";
import theme from './theme';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from './features/auth/authSlice';

// Components
import Navbar from './components/layout/Navbar';
import Alert from './components/layout/Alert';
import Home from './components/pages/Home';
import Question from './components/questions/Question';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import CreateCommunity from './components/communities/CreateCommunity';
import Community from './components/communities/Community';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser()).catch(() => {
        // Error is handled in the reducer, but ensure we don't get stuck
        // The reducer will set loading to false on rejection
      });
    }
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navbar />
          <Alert />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/questions/:id" element={<Question />} />
              <Route path="/users/:username" element={<Profile />} />
              <Route path="/communities/:name" element={<Community />} />
              <Route 
                path="/communities/create" 
                element={
                  <PrivateRoute>
                    <CreateCommunity />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
