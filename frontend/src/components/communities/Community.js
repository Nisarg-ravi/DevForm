import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  IconButton,
  Avatar,
  TextField,
  Alert,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Comment as CommentIcon,
  Visibility,
  Add as AddIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fetchQuestions, voteQuestion, createQuestion } from '../../features/questions/questionsSlice';

const Community = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  console.log(user);
  const { questions, loading } = useSelector(state => state.questions);
  
  const [community, setCommunity] = useState(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    title: '',
    body: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setCommunityLoading(true);
        const res = await axios.get(`/api/communities/${name}`);
        setCommunity(res.data.community);
        setCommunityLoading(false);
      } catch (err) {
        console.error('Error fetching community:', err);
        setCommunityLoading(false);
      }
    };

    if (name) {
      fetchCommunity();
      // Fetch questions for this community
      dispatch(fetchQuestions({ page: 1, limit: 20, sort: '-createdAt', tag: name }));
    }
  }, [name, dispatch]);

  const handleVote = async (questionId, value) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await dispatch(voteQuestion({ questionId, value }));
    dispatch(fetchQuestions({ page: 1, limit: 20, sort: '-createdAt', tag: name }));
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!questionForm.title || !questionForm.body) {
      setError('Title and body are required');
      return;
    }

    try {
      setSubmitting(true);
      const result = await dispatch(createQuestion({
        title: questionForm.title,
        body: questionForm.body,
        tags: [name], // Add the community name as a tag
      })).unwrap();

      // Reset form
      setQuestionForm({ title: '', body: '' });
      setShowAskForm(false);
      
      // Navigate to the new question
      navigate(`/questions/${result._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create question');
    } finally {
      setSubmitting(false);
    }
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (communityLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!community) {
    return (
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Alert severity="error">Community not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Community Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              r/{community.name}
            </Typography>
            {community?.displayName && (
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {community.displayName}
              </Typography>
            )}
            {community?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {community.description}
              </Typography>
            )}
            <Box display="flex" gap={2} mt={2}>
              <Typography variant="body2" color="text.secondary">
                {community?.postCount || 0} {community?.postCount === 1 ? 'thread' : 'threads'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {community?.memberCount || 0} {community?.memberCount === 1 ? 'member' : 'members'}
              </Typography>
            </Box>
          </Box>
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAskForm(!showAskForm)}
            >
              Ask Question
            </Button>
          )}
        </Box>
      </Paper>

      {/* Ask Question Form */}
      {showAskForm && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ask a Question in r/{name}
          </Typography>
          <form onSubmit={handleAskQuestion}>
            <TextField
              fullWidth
              label="Title"
              value={questionForm.title}
              onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
              required
              sx={{ mb: 2 }}
              placeholder="What's your question?"
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Body"
              value={questionForm.body}
              onChange={(e) => setQuestionForm({ ...questionForm, body: e.target.value })}
              required
              sx={{ mb: 2 }}
              placeholder="Provide details about your question..."
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Post Question'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAskForm(false);
                  setQuestionForm({ title: '', body: '' });
                  setError('');
                }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {/* Questions List */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : questions.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No questions yet in r/{name}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {isAuthenticated ? 'Be the first to ask a question!' : 'Login to ask a question'}
          </Typography>
        </Paper>
      ) : (
        questions.map((question) => (
          <Paper
            key={question._id}
            elevation={1}
            sx={{
              mb: 2,
              '&:hover': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
              },
              transition: 'all 0.2s',
            }}
          >
            <Box display="flex">
              {/* Vote Section */}
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{
                  bgcolor: 'grey.50',
                  p: 1,
                  minWidth: 50,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleVote(question._id, 1)}
                  color="primary"
                >
                  <ArrowUpward />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: question.voteCount > 0 ? 'success.main' : question.voteCount < 0 ? 'error.main' : 'text.secondary',
                  }}
                >
                  {question.voteCount || 0}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleVote(question._id, -1)}
                  color="error"
                >
                  <ArrowDownward />
                </IconButton>
              </Box>

              {/* Content Section */}
              <Box flexGrow={1} sx={{ p: 2 }}>
                {/* Title */}
                <Typography
                  variant="h6"
                  component={RouterLink}
                  to={`/questions/${question._id}`}
                  sx={{
                    textDecoration: 'none',
                    color: 'text.primary',
                    fontWeight: 'bold',
                    display: 'block',
                    mb: 1,
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {question.title}
                </Typography>

                {/* Body Preview */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
                >
                  {truncateText(question.body)}
                </Typography>

                {/* Meta Information */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Avatar
                        src={question.author?.avatar}
                        sx={{ width: 20, height: 20 }}
                      >
                        {question.author?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        u/{question.author?.username}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CommentIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {question.answerCount || 0} answers
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Visibility fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {question.views || 0} views
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))
      )}
    </Container>
  );
};

export default Community;

