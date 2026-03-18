import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch all questions
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async ({ page = 1, limit = 10, sort = '-createdAt', tag = null, search = null }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, sort });
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      
      const res = await axios.get(`/api/questions?${params.toString()}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch questions' });
    }
  }
);

// Create a question
export const createQuestion = createAsyncThunk(
  'questions/createQuestion',
  async ({ title, body, tags }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/questions', { title, body, tags });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to create question' });
    }
  }
);

// Fetch popular tags
export const fetchPopularTags = createAsyncThunk(
  'questions/fetchPopularTags',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/tags/popular');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch tags' });
    }
  }
);

// Fetch popular communities
export const fetchPopularCommunities = createAsyncThunk(
  'questions/fetchPopularCommunities',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/communities/popular');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch communities' });
    }
  }
);

// Create a community
export const createCommunity = createAsyncThunk(
  'questions/createCommunity',
  async ({ name, displayName, description, rules }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/communities', { name, displayName, description, rules });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to create community' });
    }
  }
);

// Vote on a question
export const voteQuestion = createAsyncThunk(
  'questions/voteQuestion',
  async ({ questionId, value }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/questions/vote/${questionId}`, { value });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to vote' });
    }
  }
);

const initialState = {
  questions: [],
  popularTags: [],
  popularCommunities: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  selectedTag: null,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setSelectedTag: (state, action) => {
      state.selectedTag = action.payload;
    },
    clearSelectedTag: (state) => {
      state.selectedTag = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch questions';
      })
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions.unshift(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create question';
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.popularTags = action.payload;
      })
      .addCase(fetchPopularCommunities.fulfilled, (state, action) => {
        state.popularCommunities = action.payload;
      })
      .addCase(voteQuestion.fulfilled, (state, action) => {
        const index = state.questions.findIndex(q => q._id === action.payload._id);
        if (index !== -1) {
          state.questions[index] = {
            ...state.questions[index],
            voteCount: action.payload.voteCount || 0,
            answerCount: action.payload.answerCount || 0
          };
        }
      });
  },
});

export const { setSelectedTag, clearSelectedTag } = questionsSlice.actions;
export default questionsSlice.reducer;
