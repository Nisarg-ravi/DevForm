import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  ThumbUp as ThumbUpIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { loadUser } from '../../features/auth/authSlice';

const Profile = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatar: '',
  });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`/api/users/${username}`);
        console.log(res.data);
        // Calculate vote counts for questions
        const questionsWithCounts = res.data.questions?.map(question => {
          const voteCount = question.votes ? question.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
          const answerCount = question.answers ? question.answers.length : 0;
          return {
            ...question,
            voteCount,
            answerCount,
            votes: question.voteCount || voteCount,
            answers: answerCount,
          };
        }) || [];

        // Calculate vote counts for answers
        const answersWithCounts = res.data.answers?.map(answer => {
          const voteCount = answer.votes ? answer.votes.reduce((sum, vote) => sum + vote.value, 0) : 0;
          return {
            ...answer,
            voteCount,
            votes: voteCount,
          };
        }) || [];

        setProfileData({
          ...res.data,
          questions: questionsWithCounts,
          answers: answersWithCounts,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditClick = () => {
    if (!profileData) return;
    setEditForm({
      bio: profileData.bio || '',
      avatar: profileData.avatar || '',
    });
    setEditDialogOpen(true);
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    setEditError('');

    try {
      const res = await axios.put('/api/users/profile', editForm);
      
      // Update profile data
      setProfileData({
        ...profileData,
        bio: res.data.bio,
        avatar: res.data.avatar,
      });
      
      // Update current user in Redux store
      dispatch(loadUser());
      
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setEditError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    if (profileData) {
      setEditForm({
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
      });
    }
    setEditError('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!loading && !profileData) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Typography variant="h5">Profile not found</Typography>
      </Container>
    );
  }

  const isCurrentUser = currentUser?.username === profileData.username;

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              src={profileData.avatar}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {profileData.username.charAt(0).toUpperCase()}
            </Avatar>
            {isCurrentUser && (
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            )}
          </Box>
          
          <Box flexGrow={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h4">{profileData.username}</Typography>
              <Chip 
                icon={<ThumbUpIcon />} 
                label={`${profileData.reputation} Reputation`} 
                color="primary"
                variant="outlined"
              />
            </Box>
            
            {profileData.bio && (
              <Typography variant="body1" paragraph>
                {profileData.bio}
              </Typography>
            )}
            
            <Box display="flex" flexWrap="wrap" gap={3} mt={2}>
              <Box display="flex" alignItems="center">
                <PersonIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  {profileData.questionCount || profileData.questions?.length || 0} Questions • {profileData.answerCount || profileData.answers?.length || 0} Answers
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <CalendarIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Joined {formatDistanceToNow(new Date(profileData.joinedAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="profile tabs"
        >
          <Tab label="Questions" />
          <Tab label="Answers" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ pt: 2 }}>
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {profileData.questionCount || profileData.questions?.length || 0} Questions
            </Typography>
            {profileData.questions?.length > 0 ? (
              profileData.questions.map((question) => (
                <Paper key={question._id} elevation={1} sx={{ p: 3, mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" mr={3}>
                      <ThumbUpIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {question.voteCount || 0} votes
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mr={3}>
                      <QuestionAnswerIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {question.answerCount || 0} answers
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography 
                    component={RouterLink}
                    to={`/questions/${question._id}`}
                    variant="h6"
                    sx={{
                      display: 'block',
                      mb: 1,
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {question.title}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography>No questions yet.</Typography>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {profileData.answerCount || profileData.answers?.length || 0} Answers
            </Typography>
            {profileData.answers?.length > 0 ? (
              profileData.answers.map((answer) => (
                <Paper key={answer._id} elevation={1} sx={{ p: 3, mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" mr={3}>
                      <ThumbUpIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {answer.voteCount || 0} votes
                      </Typography>
                      {answer.isAccepted && (
                        <Chip
                          label="Accepted"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  {answer.question && (
                    <Typography 
                      component={RouterLink}
                      to={`/questions/${answer.question._id}`}
                      variant="subtitle1"
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'text.primary',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {answer.question.title}
                    </Typography>
                  )}
                </Paper>
              ))
            ) : (
              <Typography>No answers yet.</Typography>
            )}
          </Box>
        )}

      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Profile</Typography>
            <IconButton onClick={handleEditCancel} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Bio"
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 500 }}
              helperText={`${editForm.bio.length}/500 characters`}
            />
            <TextField
              fullWidth
              label="Avatar URL"
              value={editForm.avatar}
              onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              helperText="Enter a URL for your profile picture"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel} disabled={editing}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={editing}>
              {editing ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Profile;
