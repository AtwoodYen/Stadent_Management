import React, { type ReactNode } from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItemIcon, ListItemText, Divider, ListItemButton, Button, Avatar } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Logout, Person } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ScheduleIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/AccountBalance';
import BookIcon from '@mui/icons-material/MenuBook';
import TeacherIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 160;  // 最左側側邊欄寬度

const menuItems = [  
  { text: '課表管理', icon: <ScheduleIcon />, path: '/schedule' },
  { text: '學生管理', icon: <PeopleIcon />, path: '/students' },
  { text: '學校管理', icon: <SchoolIcon />, path: '/schools' },
  { text: '課程管理', icon: <BookIcon />, path: '/courses' },
  { text: '師資管理', icon: <TeacherIcon />, path: '/teachers' },
  { text: '課程能力', icon: <AssignmentIcon />, path: '/teacher-courses' },
  { text: '課程分類', icon: <CategoryIcon />, path: '/course-categories' },
  { text: '統計報表', icon: <DashboardIcon />, path: '/' },
  { text: '用戶管理', icon: <ManageAccountsIcon />, path: '/users' },
];

interface LayoutProps 
{
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => 
{
  const location = useLocation();
  const { user, logout } = useAuth();
  
  console.log('Layout 渲染，當前路徑:', location.pathname);
  console.log('Layout 收到的 children:', children);

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ display: 'flex' }}>  //
      <CssBaseline />
      
      {/* 頂部導航欄 - 移除寬度限制 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Im未來學院-小剛老師程式設計 家教管理系統
          </Typography>
          
          {/* 用戶資訊和登出按鈕 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.2 }}>
                歡迎，{user?.name || user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                帳號：{user?.username}
              </Typography>
            </Box>
            
            {/* 用戶頭像 */}
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
              <Person />
            </Avatar>

            {/* 直接的登出按鈕 */}
            <Button
              onClick={handleLogout}
              startIcon={<Logout />}
              variant="contained"
              sx={{
                backgroundColor: '#d32f2f',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#b71c1c',
                  transform: 'scale(1.02)'
                },
                '&:active': {
                  backgroundColor: '#c62828'
                },
                borderRadius: '6px',
                fontWeight: 'medium'
              }}
            >
              登出
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 側邊欄 - 改為 temporary 並縮小 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.text}
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>

      {/* 主要內容 - 滿版顯示 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '72px', // 直接設定頂部間距，取代 Toolbar 佔位
          pl: 0, // 左側不要 padding，緊貼側邊欄
          pr: 1, // 右側保留一點間距
          pb: 1, // 底部保留間距
          ml: `16px`, // 左邊留出 Drawer 空間
          // 移除 width 限制，讓內容區自動填滿剩餘空間
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
