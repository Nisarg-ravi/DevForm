import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import alertReducer from '../features/alert/alertSlice';
import questionsReducer from '../features/questions/questionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alert: alertReducer,
    questions: questionsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
