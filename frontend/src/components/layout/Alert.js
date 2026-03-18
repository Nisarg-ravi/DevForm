import React from 'react';
import { useSelector } from 'react-redux';
import { Alert as MuiAlert, Snackbar } from '@mui/material';

const Alert = () => {
  const { alerts } = useSelector(state => state.alert);

  return (
    <>
      {alerts !== null &&
        alerts.length > 0 &&
        alerts.map(alert => (
          <Snackbar
            key={alert.id}
            open={true}
            autoHideDuration={6000}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MuiAlert
              elevation={6}
              variant="filled"
              severity={alert.alertType}
              sx={{ width: '100%' }}
            >
              {alert.msg}
            </MuiAlert>
          </Snackbar>
        ))}
    </>
  );
};

export default Alert;
