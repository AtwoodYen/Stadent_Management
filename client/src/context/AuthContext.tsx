import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 自動檢查 Token 過期的定時器
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    // 每30分鐘檢查一次Token是否還有效
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log('定期檢查發現Token已過期，自動登出');
          logout();
        }
      } catch (error) {
        console.log('Token驗證請求失敗，可能是網路問題:', error);
      }
    }, 30 * 60 * 1000); // 30分鐘檢查一次
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  useEffect(() => {
    const initializeAuth = async () => {
      // 檢查 localStorage 中是否有儲存的登入資訊
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      const lastLoginTime = localStorage.getItem('lastLoginTime');

      console.log('初始化認證狀態:', { 
        hasToken: !!savedToken, 
        hasUser: !!savedUser,
        lastLoginTime 
      });

      // 檢查是否有基本的登入資料
      if (savedToken && savedUser && lastLoginTime) {
        try {
          const userObj = JSON.parse(savedUser);
          const loginTime = parseInt(lastLoginTime);
          const now = Date.now();
          
          // 檢查登入時間是否超過8小時 (更保守的本地檢查)
          const maxLocalStorageTime = 8 * 60 * 60 * 1000; // 8小時
          if (now - loginTime > maxLocalStorageTime) {
            console.log('本地儲存的登入時間已過期，清除資料');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('lastLoginTime');
            setLoading(false);
            return;
          }
          
          // 驗證 Token 是否仍然有效
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            // Token 有效，設置登入狀態
            console.log('Token 驗證成功，用戶已登入:', userObj);
            console.log('設置 isAuthenticated 為 true');
            setToken(savedToken);
            setUser(userObj);
            setIsAuthenticated(true);
          } else {
            // Token 無效，清除儲存的資料
            console.log('Token 驗證失敗，清除登入資料');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('lastLoginTime');
          }
        } catch (error) {
          // 如果解析失敗或網路錯誤，清除儲存的資料
          console.log('認證初始化錯誤:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('lastLoginTime');
        }
      } else {
        console.log('沒有有效的登入資料，顯示登入頁面');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('執行登入，設置認證狀態為 true');
    const currentTime = Date.now().toString();
    
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    
    // 儲存登入資料和時間戳記
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('lastLoginTime', currentTime);
  };

  const logout = () => {
    console.log('執行登出，清除所有認證資料');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // 清除所有相關的本地儲存資料
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
  };

  const value = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 