import React, { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton } from '@mui/material';
import { Minimize as MinimizeIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DevTools: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  // 只在開發環境顯示
  if (import.meta.env.PROD) {
    return null;
  }

  const handleForceLogout = () => {
    if (window.confirm('確定要強制清除所有登入資料嗎？')) {
      // 清除所有可能的儲存資料
      localStorage.clear();
      sessionStorage.clear();
      
      // 執行正常登出流程
      logout();
      
      // 重新載入頁面確保清理完成
      window.location.reload();
    }
  };

  const handleClearStorage = () => {
    if (window.confirm('確定要清除所有瀏覽器儲存資料嗎？')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('儲存資料已清除，請重新載入頁面');
      window.location.reload();
    }
  };

  // 最小化狀態的顯示
  if (isMinimized) {
    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 5,
          right: 5,
          width: 25,
          height: 25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 193, 7, 0.9)',
          border: '1px solid #ffc107',
          borderRadius: '50%',
          zIndex: 9999,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 193, 7, 1)',
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => setIsMinimized(false)}
      >
        <AddIcon sx={{ color: '#e65100', fontSize: '12px' }} />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        p: 2,
        maxWidth: 300,
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        border: '2px solid #ffc107',
        borderRadius: 2,
        zIndex: 9999,
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h6" sx={{ color: '#e65100', fontSize: '14px', mt: 0.5 }}>
          🛠️ 開發工具
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsMinimized(true)}
          sx={{
            color: '#e65100',
            border: '2px solid #e65100',
            borderRadius: '50%',
            width: 16,
            height: 16,
            padding: 0,
            minWidth: 'unset',
            marginTop: '-18px',
            marginRight: '-18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: 'rgba(230, 81, 0, 0.1)',
              borderColor: '#bf360c'
            }
          }}
        >
          <MinimizeIcon sx={{ fontSize: '16px', marginTop: '-10px' }} />
        </IconButton>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 1, fontSize: '12px' }}>
        當前狀態: {isAuthenticated ? `已登入 (${user?.username})` : '未登入'}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={handleForceLogout}
          sx={{ fontSize: '11px' }}
        >
          強制登出
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={handleClearStorage}
          sx={{ fontSize: '11px' }}
        >
          清除所有儲存
        </Button>
      </Box>
      
      <Typography variant="caption" sx={{ display: 'block', mt: 1, fontSize: '10px', color: 'text.secondary' }}>
        此工具僅在開發環境顯示
      </Typography>
    </Paper>
  );
};

export default DevTools; 