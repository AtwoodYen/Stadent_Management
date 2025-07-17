import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

const TestPage: React.FC = () => {
  const [testState, setTestState] = useState('Initial State');
  
  useEffect(() => {
    console.log('=== TestPage 組件已掛載 ===');
    console.log('當前 testState:', testState);
    
    return () => {
      console.log('=== TestPage 組件將卸載 ===');
    };
  }, [testState]);

  const handleClick = () => {
    console.log('測試按鈕被點擊');
    setTestState('狀態已更新 ' + new Date().toLocaleTimeString());
  };

  console.log('=== TestPage 渲染 ===');
  
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        測試頁面
      </Typography>
      <Typography variant="body1" paragraph>
        這是一個測試頁面，用於驗證組件渲染和狀態更新。
      </Typography>
      <Typography variant="h6" paragraph>
        當前狀態: {testState}
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleClick}
        sx={{ mt: 2 }}
      >
        點擊更新狀態
      </Button>
      <Box sx={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        backgroundColor: 'white',
        p: 2,
        borderRadius: 1,
        boxShadow: 1,
        zIndex: 1000
      }}>
        <Typography variant="subtitle2" color="primary">
          測試控制台
        </Typography>
        <Typography variant="caption" display="block">
          請檢查瀏覽器控制台查看日誌
        </Typography>
      </Box>
    </Box>
  );
};

export default TestPage;
