import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Avatar,
  TextField,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpward, ArrowDownward, CheckCircle } from '@mui/icons-material';
import { voteQuestion } from '../../features/questions/questionsSlice';

const Question = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState({});

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`/api/questions/${id}`);
        
        // Process question data
        const questionData = res.data;
        setQuestion(questionData);
        
        // Answers are already processed by backend, but ensure voteCount exists
        const processedAnswers = (questionData.answers || []).map(answer => ({
          ...answer,
          voteCount: answer.voteCount || 0,
        }));
        
        // Sort answers: accepted first, then by vote count
        processedAnswers.sort((a, b) => {
          if (a.isAccepted && !b.isAccepted) return -1;
          if (!a.isAccepted && b.isAccepted) return 1;
          return (b.voteCount || 0) - (a.voteCount || 0);
        });
        
        setAnswers(processedAnswers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching question:', err);
        setError(err.response?.data?.message || 'Failed to load question');
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const handleVote = async (value, targetId, isQuestion = true) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setVoting({ ...voting, [targetId]: true });
      
      if (isQuestion) {
        // Vote on question
        await dispatch(voteQuestion({ questionId: targetId, value })).unwrap();
        // Refresh question data
        const res = await axios.get(`/api/questions/${id}`);
        const questionData = res.data;
        setQuestion(questionData);
        
        // Also update answers if they exist
        if (questionData.answers) {
          const processedAnswers = questionData.answers.map(answer => ({
            ...answer,
            voteCount: answer.voteCount || 0,
          }));
          processedAnswers.sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return (b.voteCount || 0) - (a.voteCount || 0);
          });
          setAnswers(processedAnswers);
        }
      } else {
        // Vote on answer
        await axios.put(`/api/answers/vote/${targetId}`, { value });
        // Refresh question and answers
        const res = await axios.get(`/api/questions/${id}`);
        const questionData = res.data;
        setQuestion(questionData);
        
        const processedAnswers = (questionData.answers || []).map(answer => ({
          ...answer,
          voteCount: answer.voteCount || 0,
        }));
        // Sort answers: accepted first, then by vote count
        processedAnswers.sort((a, b) => {
          if (a.isAccepted && !b.isAccepted) return -1;
          if (!a.isAccepted && b.isAccepted) return 1;
          return (b.voteCount || 0) - (a.voteCount || 0);
        });
        setAnswers(processedAnswers);
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError(err.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting({ ...voting, [targetId]: false });
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!answer.trim()) {
      setError('Answer cannot be empty');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      const res = await axios.post(`/api/answers/${id}`, { body: answer });
      console.log(res.data);
      // Refresh question and answers to get the complete updated data
      const questionRes = await axios.get(`/api/questions/${id}`);
      setQuestion(questionRes.data);
      
      // Process and sort answers
      const processedAnswers = (questionRes.data.answers || []).map(answer => ({
        ...answer,
        voteCount: answer.voteCount || 0,
      }));
      processedAnswers.sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        return (b.voteCount || 0) - (a.voteCount || 0);
      });
      setAnswers(processedAnswers);
      setAnswer('');
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await axios.put(`/api/answers/accept/${answerId}`);
      // Refresh question and answers
      const res = await axios.get(`/api/questions/${id}`);
      setQuestion(res.data);
      const processedAnswers = (res.data.answers || []).map(answer => ({
        ...answer,
        voteCount: answer.voteCount || 0,
      }));
      // Sort answers: accepted first, then by vote count
      processedAnswers.sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        return (b.voteCount || 0) - (a.voteCount || 0);
      });
      setAnswers(processedAnswers);
    } catch (err) {
      console.error('Error accepting answer:', err);
      setError(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !loading) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!question && !loading) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Typography variant="h5">Question not found</Typography>
      </Container>
    );
  }

  const isQuestionAuthor = question && user && question.author?._id === user.id;

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      {/* Question */}
      {question && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex">
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              mr={2}
              sx={{
                bgcolor: 'grey.50',
                p: 1,
                borderRadius: 1,
                minWidth: 50,
              }}
            >
              <IconButton 
                onClick={() => handleVote(1, question._id, true)}
                disabled={voting[question._id]}
                color="primary"
                size="small"
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
                onClick={() => handleVote(-1, question._id, true)}
                disabled={voting[question._id]}
                color="error"
                size="small"
              >
                <ArrowDownward />
              </IconButton>
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h4" gutterBottom>
                {question.title}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {question.tags?.map((tag) => (
                  <Chip 
                    key={tag} 
                    label={`r/${tag}`} 
                    size="small"
                    component={RouterLink}
                    to={`/communities/${tag}`}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
              <Typography 
                variant="body1" 
                paragraph
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {question.body}
              </Typography>
              <Box display="flex" justifyContent="space-between" mt={4} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar 
                    src={question.author?.avatar} 
                    sx={{ width: 32, height: 32 }}
                    component={RouterLink}
                    to={`/users/${question.author?.username}`}
                  >
                    {question.author?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="subtitle2"
                      component={RouterLink}
                      to={`/users/${question.author?.username}`}
                      sx={{ textDecoration: 'none', color: 'text.primary' }}
                    >
                      u/{question.author?.username}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    {question.views || 0} views
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Answers */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
      </Typography>
      
      {answers.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No answers yet. Be the first to answer!
          </Typography>
        </Paper>
      ) : (
        answers.map((answer) => (
          <Paper 
            key={answer._id} 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 2,
              borderLeft: answer.isAccepted ? '4px solid' : 'none',
              borderColor: answer.isAccepted ? 'success.main' : 'transparent',
            }}
          >
            <Box display="flex">
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                mr={2}
                sx={{
                  bgcolor: 'grey.50',
                  p: 1,
                  borderRadius: 1,
                  minWidth: 50,
                }}
              >
                <IconButton 
                  onClick={() => handleVote(1, answer._id, false)}
                  disabled={voting[answer._id]}
                  color="primary"
                  size="small"
                >
                  <ArrowUpward />
                </IconButton>
                <Typography 
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: answer.voteCount > 0 ? 'success.main' : answer.voteCount < 0 ? 'error.main' : 'text.secondary',
                  }}
                >
                  {answer.voteCount || 0}
                </Typography>
                <IconButton 
                  onClick={() => handleVote(-1, answer._id, false)}
                  disabled={voting[answer._id]}
                  color="error"
                  size="small"
                >
                  <ArrowDownward />
                </IconButton>
                {answer.isAccepted && (
                  <CheckCircle color="success" sx={{ mt: 1 }} />
                )}
                {isQuestionAuthor && !answer.isAccepted && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    sx={{ mt: 1, fontSize: '0.7rem' }}
                    onClick={() => handleAcceptAnswer(answer._id)}
                  >
                    Accept
                  </Button>
                )}
              </Box>
              <Box flexGrow={1}>
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {answer.body}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2} flexWrap="wrap" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar 
                      src={answer.author?.avatar} 
                      sx={{ width: 24, height: 24 }}
                      component={RouterLink}
                      to={`/users/${answer.author?.username}`}
                    >
                      {answer.author?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography 
                      variant="subtitle2"
                      component={RouterLink}
                      to={`/users/${answer.author?.username}`}
                      sx={{ textDecoration: 'none', color: 'text.primary' }}
                    >
                      u/{answer.author?.username}
                    </Typography>
                    {answer.author?.reputation && (
                      <Chip 
                        label={`${answer.author.reputation} rep`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))
      )}

      {/* Answer Form */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Answer
        </Typography>
        {isAuthenticated ? (
          <form onSubmit={handleSubmitAnswer}>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              placeholder="Write your answer here..."
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError('');
              }}
              required
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || !answer.trim()}
            >
              {submitting ? <CircularProgress size={24} /> : 'Post Your Answer'}
            </Button>
          </form>
        ) : (
          <Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              Please login to post an answer.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Question;
