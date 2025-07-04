import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale/zh-TW';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import SchoolsPage from './pages/SchoolsPage';
import TutorManagerPage from './pages/TutorManagerPage';
import CoursesPage from './pages/CoursesPage';
import TeachersPage from './pages/TeachersPage';
import TeacherCoursesManagementPage from './pages/TeacherCoursesManagementPage';
import CourseCategoriesPage from './pages/CourseCategoriesPage';
import UsersPage from './pages/UsersPage';
import DevTools from './components/DevTools';
import './App.css';

// 創建主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Noto Sans TC", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// 主要應用程式組件
const AppContent = () => {
  const { isAuthenticated, loading, login } = useAuth();

  console.log('AppContent 渲染狀態:', { isAuthenticated, loading });

  if (loading) {
    console.log('顯示載入畫面');
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('未認證，顯示登入頁面');
    return <LoginPage onLogin={login} />;
  }

  console.log('已認證，顯示主應用程式');

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedule" element={<TutorManagerPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/teacher-courses" element={<TeacherCoursesManagementPage />} />
          <Route path="/course-categories" element={<CourseCategoriesPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
        <AuthProvider>
          <AppContent />
          <DevTools />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App
