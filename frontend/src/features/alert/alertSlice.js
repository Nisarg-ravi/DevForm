import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  alerts: [],
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlert: (state, action) => {
      const { msg, alertType } = action.payload;
      const id = uuidv4();
      state.alerts = [...state.alerts, { id, msg, alertType }];
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
  },
});

export const { setAlert, removeAlert } = alertSlice.actions;

export const selectAlerts = state => state.alert.alerts;

export default alertSlice.reducer;
