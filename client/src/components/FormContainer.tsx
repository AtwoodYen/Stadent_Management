import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface FormContainerProps {
  title?: string;
  children: React.ReactNode;
  maxWidth?: number | string;
  padding?: number;
  elevation?: number;
  sx?: SxProps<Theme>;
}

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  children,
  maxWidth = 800,
  padding = 3,
  elevation = 2,
  sx = {}
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Paper
        elevation={elevation}
        sx={{
          width: '100%',
          maxWidth,
          p: padding,
          ...sx
        }}
      >
        {title && (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1.8rem' }}>
              {title}
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </>
        )}
        <Box component="form" sx={{ '& > :not(:last-child)': { mb: 1 } }}>
          {children}
        </Box>
      </Paper>
    </Box>
  );
};

export default FormContainer; 