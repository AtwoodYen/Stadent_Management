import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIsLocked(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 儲存登入資訊到 localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        // 處理帳號鎖定狀態
        if (response.status === 423) {
          setIsLocked(true);
          setRemainingTime(data.remainingMinutes || 0);
          
          // 開始倒數計時
          if (data.remainingMinutes > 0) {
            startCountdown(data.remainingMinutes);
          }
        } else {
          // 顯示錯誤訊息（後端已包含錯誤次數資訊）
          setError(data.message || '登入失敗');
        }
      }
    } catch (error) {
      setError('連線錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (minutes: number) => {
    // 先清除任何現有的倒數計時器
    stopCountdown();
    
    let seconds = minutes * 60;
    
    const timer = window.setInterval(() => {
      seconds--;
      const remainingMinutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (seconds <= 0) {
        stopCountdown();
        setIsLocked(false);
        setRemainingTime(0);
        setError('');
      } else {
        setRemainingTime(remainingMinutes);
        setError(`帳號已被鎖定，請在 ${remainingMinutes} 分 ${remainingSeconds} 秒後再試`);
      }
    }, 1000);
    
    // 儲存計時器引用
    countdownTimerRef.current = timer;
  };

  const stopCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // 檢查帳號鎖定狀態的函數
  const checkAccountLockStatus = async (username: string) => {
    if (!username.trim()) {
      // 如果帳號為空，清除鎖定狀態和倒數計時
      stopCountdown();
      setIsLocked(false);
      setRemainingTime(0);
      setError('');
      return;
    }

    try {
      const response = await fetch(`/api/auth/lock-status/${encodeURIComponent(username)}`);
      const data = await response.json();

      if (response.ok) {
        if (data.isLocked && data.remainingMinutes > 0) {
          setIsLocked(true);
          setRemainingTime(data.remainingMinutes);
          setError(`帳號已被鎖定，請在 ${data.remainingMinutes} 分鐘後再試`);
          startCountdown(data.remainingMinutes);
        } else {
          // 帳號未被鎖定，停止倒數計時並清除狀態
          stopCountdown();
          setIsLocked(false);
          setRemainingTime(0);
          setError('');
        }
      }
    } catch (error) {
      // 檢查失敗時不影響正常功能，停止倒數計時並清除鎖定狀態
      stopCountdown();
      setIsLocked(false);
      setRemainingTime(0);
    }
  };

  // 防抖動檢查帳號狀態
  const debouncedCheckLockStatus = (username: string) => {
    // 清除之前的定時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 設置新的定時器，800ms 後執行檢查
    timeoutRef.current = window.setTimeout(() => {
      checkAccountLockStatus(username);
    }, 800);
  };

  // 清理定時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  return (
    <Container maxWidth="sm" sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Paper elevation={10} sx={{ 
        width: '100%', 
        maxWidth: 400, 
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 3, 
          textAlign: 'center' 
        }}>
          <Lock sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Im未來-學生管理系統
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            請輸入您的帳號密碼
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="帳號"
                variant="outlined"
                value={username}
                onChange={(e) => {
                  const newUsername = e.target.value;
                  setUsername(newUsername);
                  
                  // 切換帳號時清除錯誤訊息
                  setError('');
                  
                  // 防抖動檢查新帳號的鎖定狀態
                  debouncedCheckLockStatus(newUsername);
                }}
                required
                InputProps={{
                  startAdornment: (
                    <Box sx={{ 
                      backgroundColor: '#f0f8ff', 
                      borderRadius: '50%', 
                      p: 0.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 1
                    }}>
                      <Person sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </Box>
                  )
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-input': {
                    paddingLeft: '4px'
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="密碼"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  /* ----------- 左側鎖頭 ----------- */
                  startAdornment: (
                    <Box sx={{ 
                      backgroundColor: '#f0f8ff', 
                      borderRadius: '50%', 
                      p: 0.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 1
                    }}>
                      <Lock sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </Box>
                  ),

                  /* ----------- 右側眼睛 ----------- */
                  endAdornment: (
                    <Box
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'text.secondary',
                        padding: '4px',
                        borderRadius: '4px',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      {showPassword
                        ? <VisibilityOff sx={{ fontSize: '1.1rem' }} />
                        : <Visibility sx={{ fontSize: '1.1rem' }} />}
                    </Box>
                  )
                }}
                sx={{ 
                  '& .MuiOutlinedInput-input': {
                    paddingLeft: '4px'
                  }
                }}
              />
            </Box>

            {error && (
              <Alert severity={isLocked ? "warning" : "error"} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || isLocked}
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                background: isLocked 
                  ? 'linear-gradient(45deg, #9E9E9E 30%, #757575 90%)'
                  : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: isLocked 
                    ? 'linear-gradient(45deg, #9E9E9E 30%, #757575 90%)'
                    : 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                }
              }}
            >
              {loading ? '登入中...' : isLocked ? `帳號鎖定中 (${remainingTime}分)` : '登入'}
            </Button>
          </form>


        </CardContent>
      </Paper>
    </Container>
  );
};

export default LoginPage; 