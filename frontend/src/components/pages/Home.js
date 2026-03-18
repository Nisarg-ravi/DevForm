import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Comment as CommentIcon,
  Visibility,
  Sort as SortIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fetchQuestions, fetchPopularCommunities, voteQuestion, setSelectedTag, clearSelectedTag } from '../../features/questions/questionsSlice';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  console.log(user);
  const { questions, popularCommunities, loading, selectedTag, totalPages, currentPage } = useSelector(state => state.questions);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  console.log(totalPages);
  useEffect(() => {
    dispatch(fetchQuestions({ page: 1, limit: 20, sort: sortBy, tag: selectedTag, search: searchQuery || null }));
    dispatch(fetchPopularCommunities());
  }, [dispatch, sortBy, selectedTag, searchQuery]);

  const handleVote = async (questionId, value) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await dispatch(voteQuestion({ questionId, value }));
    // Refresh questions after vote
    dispatch(fetchQuestions({ page: currentPage, limit: 20, sort: sortBy, tag: selectedTag, search: searchQuery || null }));
  };

  const handleTagClick = (tagName) => {
    if (selectedTag === tagName) {
      dispatch(clearSelectedTag());
    } else {
      dispatch(setSelectedTag(tagName));
    }
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        
        {/* Left Sidebar - All Communities */}
        <Box
          sx={{
            width: { xs: '100%', md: 300 },
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            alignSelf: 'flex-start',
            height: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              All Communities
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                overflowY: 'auto',
                flex: 1,
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 4,
                },
              }}
            >
              {popularCommunities.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No communities yet
                </Typography>
              ) : (
                popularCommunities.map((community) => (
                  <Box
                    key={community._id || community.name}
                    component={RouterLink}
                    to={`/communities/${community.name}`}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 1,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      px: 1,
                      mb: 0.5,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTagClick(community.name);
                      navigate(`/communities/${community.name}`);
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} flexGrow={1}>
                      <Box flexGrow={1}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          r/{community.name}
                        </Typography>
                        {community.displayName && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {community.displayName}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {community.postCount || 0} {community.postCount === 1 ? 'thread' : 'threads'} • {community.memberCount || 0} members
                        </Typography>
                      </Box>
                    </Box>
                    {selectedTag === community.name && (
                      <Chip label="Active" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>
  
        {/* Right Section - Questions Feed */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Sort and Filter Bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant={sortBy === '-createdAt' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('-createdAt')}
                  startIcon={<SortIcon />}
                >
                  New
                </Button>
                <Button
                  size="small"
                  variant={sortBy === '-voteCount' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('-voteCount')}
                >
                  Top
                </Button>
                <Button
                  size="small"
                  variant={sortBy === '-answerCount' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('-answerCount')}
                >
                  Hot
                </Button>
              </Box>
              <TextField
                size="small"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Paper>
  
          {/* Selected Tag Display */}
          {selectedTag && (
            <Paper elevation={1} sx={{ p: 1, mb: 2, bgcolor: 'primary.light', color: 'white' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Showing threads from <strong>r/{selectedTag}</strong>
                </Typography>
                <Button size="small" onClick={() => dispatch(clearSelectedTag())} sx={{ color: 'white' }}>
                  Clear
                </Button>
              </Box>
            </Paper>
          )}
  
          {/* Questions Feed */}
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : questions.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No questions found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Be the first to ask a question!
              </Typography>
            </Paper>
          ) : (
            questions.map((question) => (
              <Paper
                key={question._id}
                elevation={1}
                sx={{
                  mb: 2,
                  '&:hover': { borderLeft: '4px solid', borderColor: 'primary.main' },
                  transition: 'all 0.2s',
                }}
              >
                <Box display="flex">
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
                    <IconButton size="small" onClick={() => handleVote(question._id, 1)} color="primary">
                      <ArrowUpward />
                    </IconButton>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          question.voteCount > 0
                            ? 'success.main'
                            : question.voteCount < 0
                            ? 'error.main'
                            : 'text.secondary',
                      }}
                    >
                      {question.voteCount || 0}
                    </Typography>
                    <IconButton size="small" onClick={() => handleVote(question._id, -1)} color="error">
                      <ArrowDownward />
                    </IconButton>
                  </Box>
  
                  <Box flexGrow={1} sx={{ p: 2 }}>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {question.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={`r/${tag}`}
                          size="small"
                          onClick={() => handleTagClick(tag)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: selectedTag === tag ? 'primary.main' : 'grey.200',
                            color: selectedTag === tag ? 'white' : 'text.primary',
                            '&:hover': {
                              bgcolor: selectedTag === tag ? 'primary.dark' : 'grey.300',
                            },
                          }}
                        />
                      ))}
                    </Box>
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
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {question.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {truncateText(question.body)}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Avatar src={question.author?.avatar} sx={{ width: 20, height: 20 }}>
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
        </Box>
      </Box>
    </Container>
  );
  
};

export default Home;
