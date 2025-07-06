import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { Info as InfoIcon, Warning as WarningIcon, Error as ErrorIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';

interface CustomAlertProps {
  open: boolean;
  message: string;
  title?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  open,
  message,
  title,
  type = 'info',
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'info.main';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          margin: 0,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: getColor() }}>
        {getIcon()}
        {title || (type === 'success' ? '成功' : type === 'warning' ? '警告' : type === 'error' ? '錯誤' : '訊息')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1">
            {message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          確定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomAlert; 