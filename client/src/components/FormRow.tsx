import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface FormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  labelWidth?: number | string;
  gap?: number;
  mb?: number;
  sx?: SxProps<Theme>;
}

const FormRow: React.FC<FormRowProps> = ({
  label,
  required = false,
  children,
  labelWidth = 100,
  gap = 1,
  mb = 1,
  sx = {}
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${typeof labelWidth === 'number' ? labelWidth + 'px' : labelWidth} 1fr`,
        gap,
        alignItems: 'center',
        mb,
        ...sx
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'bold',
          color: 'text.primary',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
        {required && (
          <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Typography>
        )}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {children}
      </Box>
    </Box>
  );
};

export default FormRow; 