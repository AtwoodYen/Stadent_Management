import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Autocomplete,
  IconButton,
} from '@mui/material';


import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import TeacherCourses from '../components/TeacherCourses';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  closestCenter
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 型別定義


interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  availableDays: string[];
  courseCategories: string[];
  preferredCourses: string[];
  hourly_rate: number;
  experience: number;
  bio?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface TeacherStats {
  total_teachers: number;
  active_teachers: number;
  inactive_teachers: number;
  avg_hourly_rate: number;
  avg_experience: number;
  min_hourly_rate: number;
  max_hourly_rate: number;
}

const TeachersPage: React.FC = () => {
  const { user } = useAuth(); // 獲取當前用戶資訊
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 篩選狀態
  const [filters, setFilters] = useState({
    courseCategory: '',
    status: '',
    min_rate: '',
    max_rate: '',
    min_experience: '',
    available_day: ''
  });

  // 刪除確認對話框相關 state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 課程能力管理相關 state
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);
  const [selectedTeacherForCourses, setSelectedTeacherForCourses] = useState<Teacher | null>(null);
  
  // 顯示模式狀態
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    availableDays: [] as string[],
    hourlyRate: 1200,
    experience: 0,
    bio: '',
    isActive: true
  });

  // 載入資料
  useEffect(() => {
    fetchTeachers();
    fetchStats();
    fetchCourseCategories();
  }, [filters]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`/api/teachers?${queryParams}`);
      if (!response.ok) throw new Error('載入師資資料失敗');
      
      const data = await response.json();
      // 只在初始載入或篩選條件改變時更新排序
      // 保持拖拽排序的結果
      setTeachers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/teachers/stats');
      if (!response.ok) throw new Error('載入統計資料失敗');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('載入統計資料失敗:', err);
    }
  };

  const fetchCourseCategories = async () => {
    try {
      const response = await fetch('/api/teachers/course-categories');
      if (!response.ok) throw new Error('載入課程分類失敗');
      
      const data = await response.json();
      setCourseCategories(data);
    } catch (err) {
      console.error('載入課程分類失敗:', err);
    }
  };

  // 對話框處理
  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone || '',
        availableDays: teacher.availableDays,
        hourlyRate: teacher.hourly_rate,
        experience: teacher.experience,
        bio: teacher.bio || '',
        isActive: teacher.is_active
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        availableDays: [],
        hourlyRate: 1200,
        experience: 0,
        bio: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
  };

  // 儲存師資
  const handleSaveTeacher = async () => {
    try {
      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '儲存失敗');
      }
      
      if (editingTeacher) {
        // 更新現有師資：只更新當前師資的資料，保持排序
        const updatedTeacher = await response.json();
        setTeachers(prev => prev.map(t => 
          t.id === editingTeacher.id 
            ? { ...t, ...updatedTeacher, availableDays: updatedTeacher.availableDays || [] }
            : t
        ));
      } else {
        // 新增師資：重新載入以獲取新師資的完整資料
        fetchTeachers();
      }
      
      setSnackbar({
        open: true,
        message: editingTeacher ? '師資資料更新成功' : '新增師資成功',
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '儲存失敗',
        severity: 'error'
      });
    }
  };

  // 切換師資狀態
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/teachers/${id}/toggle-status`, {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('狀態切換失敗');
      
      // 只更新當前師資的狀態，保持排序
      setTeachers(prev => prev.map(t => 
        t.id === id ? { ...t, is_active: !t.is_active } : t
      ));
      
      setSnackbar({
        open: true,
        message: '師資狀態更新成功',
        severity: 'success'
      });
      
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '狀態切換失敗',
        severity: 'error'
      });
    }
  };

  // 開啟刪除確認對話框
  const handleDeleteTeacher = async (teacher: Teacher) => {
    // 檢查是否為系統管理員
    if (user?.role !== 'admin') {
      setSnackbar({
        open: true,
        message: '只有系統管理員才能刪除師資',
        severity: 'error'
      });
      return;
    }
    
    setDeletingTeacher(teacher);
    setDeleteDialogOpen(true);
    setAdminPassword('');
    setPasswordError('');
  };

  // 關閉刪除確認對話框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingTeacher(null);
    setAdminPassword('');
    setPasswordError('');
  };

  // 驗證管理員密碼並執行刪除
  const verifyPasswordAndDelete = async () => {
    if (!adminPassword) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    try {
      // 從 localStorage 獲取 token
      const token = localStorage.getItem('authToken');
      
      // 驗證管理員密碼
      const verifyResponse = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          password: adminPassword 
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setPasswordError(errorData.message || '密碼驗證失敗');
        return;
      }

      // 密碼驗證成功，執行刪除
      const deleteResponse = await fetch(`/api/teachers/${deletingTeacher?.id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) throw new Error('刪除失敗');

      setSnackbar({
        open: true,
        message: `師資 ${deletingTeacher?.name} 刪除成功`,
        severity: 'success'
      });

      handleCloseDeleteDialog();
      // 從列表中移除被刪除的師資，保持其他師資的排序
      setTeachers(prev => prev.filter(t => t.id !== deletingTeacher?.id));
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : '刪除失敗',
        severity: 'error'
      });
    }
  };

  // 開啟課程能力管理
  const handleOpenCourses = (teacher: Teacher) => {
    console.log('=== 開啟課程能力管理 ===');
    console.log('選中的師資:', teacher);
    console.log('師資 ID:', teacher.id);
    console.log('師資 ID 類型:', typeof teacher.id);
    console.log('師資姓名:', teacher.name);
    console.log('=======================');
    
    setSelectedTeacherForCourses(teacher);
    setCoursesDialogOpen(true);
  };

  // 關閉課程能力管理
  const handleCloseCourses = () => {
    setCoursesDialogOpen(false);
    setSelectedTeacherForCourses(null);
  };

  // 拖曳排序
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const newTeachers = arrayMove(teachers, 
        teachers.findIndex(t => t.id.toString() === active.id),
        teachers.findIndex(t => t.id.toString() === over.id)
      );
      
      setTeachers(newTeachers);
      
      // 將新的排序儲存到資料庫
      try {
        const teacherIds = newTeachers.map(t => t.id);
        const response = await fetch('/api/teachers/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherIds })
        });
        
        if (!response.ok) {
          throw new Error('排序儲存失敗');
        }
        
        // 可選：顯示成功訊息
        console.log('排序已儲存到資料庫');
      } catch (err) {
        console.error('儲存排序失敗:', err);
        // 可選：顯示錯誤訊息給用戶
        setSnackbar({
          open: true,
          message: '排序儲存失敗，但已在前端更新',
          severity: 'warning'
        });
      }
    }
  };

  // Sortable Teacher Card
  function SortableTeacherCard({ teacher, viewMode }: { teacher: Teacher, viewMode: 'grid' | 'list' }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: teacher.id.toString(),
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.7 : 1,
      boxShadow: isDragging ? '0px 4px 20px rgba(0,0,0,0.2)' : '0px 1px 4px rgba(0,0,0,0.08)',
      width: viewMode === 'grid' ? '350px' : '100%',
      minWidth: viewMode === 'grid' ? '350px' : '0',
      maxWidth: viewMode === 'grid' ? '350px' : '100%',
      margin: '0',
      display: 'flex',
      flexDirection: viewMode === 'list' ? 'row' : 'column',
      height: viewMode === 'list' ? 'auto' : 'fit-content',
      transitionDuration: isDragging ? '0s' : '0.2s',
    } as React.CSSProperties;
    return (
      <Card ref={setNodeRef} style={style} {...attributes}>
        <Box {...listeners} sx={{ 
          flexGrow: 1,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' }
        }}>
          <CardContent sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: viewMode === 'list' ? 'row' : 'column', 
            alignItems: viewMode === 'list' ? 'center' : 'stretch', 
            gap: viewMode === 'list' ? 3 : 0 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: viewMode === 'grid' ? 2 : 0, 
              minWidth: viewMode === 'list' ? '200px' : 'auto' 
            }}>
              <Avatar sx={{ mr: 2, bgcolor: teacher.is_active ? 'primary.main' : 'grey.500' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {teacher.name}
                </Typography>
                <Chip
                  label={teacher.is_active ? '啟用' : '停用'}
                  color={teacher.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>

            {viewMode === 'grid' ? (
              // 區塊模式：垂直佈局
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {teacher.email}
                  </Typography>
                </Box>

                {teacher.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {teacher.phone}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    時薪 ${teacher.hourly_rate}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    經驗 {teacher.experience} 年
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  可授課日：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {teacher.availableDays.map((day, index) => (
                    <Chip key={index} label={day} size="small" variant="outlined" />
                  ))}
                </Box>

                {teacher.bio && (
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {teacher.bio}
                  </Typography>
                )}
              </>
            ) : (
              // 列表模式：水平佈局
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '150px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {teacher.email}
                    </Typography>
                  </Box>
                  {teacher.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {teacher.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '120px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      時薪 ${teacher.hourly_rate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      經驗 {teacher.experience} 年
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    可授課日：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {teacher.availableDays.map((day, index) => (
                      <Chip key={index} label={day} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                {teacher.bio && (
                  <Box sx={{ minWidth: '200px', maxWidth: '300px' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {teacher.bio}
                    </Typography>
                  </Box>
                )}
              </>
                          )}
            </CardContent>
          </Box>

          {viewMode === 'grid' && <Divider />}

        <CardActions sx={{ 
          justifyContent: viewMode === 'list' ? 'flex-end' : 'space-between', 
          flexWrap: 'wrap', 
          gap: 1,
          flexDirection: 'row',
          minWidth: viewMode === 'list' ? 'auto' : 'auto',
          position: 'relative',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleOpenDialog(teacher);
            }}
            sx={{ 
              pointerEvents: 'auto',
              zIndex: 1000,
              position: 'relative'
            }}
          >
            編輯
          </Button>
          <Button
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleOpenCourses(teacher);
            }}
            sx={{ 
              pointerEvents: 'auto',
              zIndex: 1000,
              position: 'relative'
            }}
          >
            課程能力
          </Button>
          <Button
            size="small"
            color={teacher.is_active ? 'warning' : 'success'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleToggleStatus(teacher.id);
            }}
            sx={{ 
              pointerEvents: 'auto',
              zIndex: 1000,
              position: 'relative'
            }}
          >
            {teacher.is_active ? '停用' : '啟用'}
          </Button>
          {user?.role === 'admin' && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteTeacher(teacher);
              }}
              sx={{ 
                pointerEvents: 'auto',
                zIndex: 1000,
                position: 'relative'
              }}
            >
              刪除
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }

  if (loading && teachers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchTeachers} variant="contained">
          重新載入
        </Button>
      </Box>
    );
  }

  return (
    <>
      {/* Main content layout */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          師資管理
        </Typography>

        {/* 統計資訊 */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  總師資數
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.total_teachers}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  啟用師資
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.active_teachers}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  平均時薪
                </Typography>
                <Typography variant="h5" component="div">
                  ${Math.round(stats.avg_hourly_rate)}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  平均經驗
                </Typography>
                <Typography variant="h5" component="div">
                  {Math.round(stats.avg_experience)} 年
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 篩選和操作列 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 顯示模式切換按鈕 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setViewMode('grid')}
              aria-label="區塊模式"
              sx={{
                color: viewMode === 'grid' ? '#4caf50' : '#666666',
                border: '2px solid',
                borderColor: viewMode === 'grid' ? '#4caf50' : '#666666',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderColor: '#4caf50',
                },
              }}
            >
              <ViewModuleIcon />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              aria-label="列表模式"
              sx={{
                color: viewMode === 'list' ? '#4caf50' : '#666666',
                border: '2px solid',
                borderColor: viewMode === 'list' ? '#4caf50' : '#666666',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderColor: '#4caf50',
                },
              }}
            >
              <ViewListIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            新增師資
          </Button>
          <FormControl size="small" sx={{ 
            minWidth: 120,
            '& .MuiInputLabel-root': { 
              color: 'white',
              '&.Mui-focused': { color: 'white' }
            },
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'white' },
              '&:hover fieldset': { borderColor: 'white' },
              '&.Mui-focused fieldset': { borderColor: 'white' }
            },
            '& .MuiSelect-icon': { color: 'white' }
          }}>
            <InputLabel>課程類別</InputLabel>
            <Select
              value={filters.courseCategory}
              label="課程類別"
              onChange={(e) => setFilters({ ...filters, courseCategory: e.target.value })}
            >
              <MenuItem value="">全部</MenuItem>
              {courseCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ 
            minWidth: 120,
            '& .MuiInputLabel-root': { 
              color: 'white',
              '&.Mui-focused': { color: 'white' }
            },
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'white' },
              '&:hover fieldset': { borderColor: 'white' },
              '&.Mui-focused fieldset': { borderColor: 'white' }
            },
            '& .MuiSelect-icon': { color: 'white' }
          }}>
            <InputLabel>狀態</InputLabel>
            <Select
              value={filters.status}
              label="狀態"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="true">啟用</MenuItem>
              <MenuItem value="false">停用</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="最低時薪"
            type="number"
            value={filters.min_rate}
            onChange={(e) => setFilters({ ...filters, min_rate: e.target.value })}
            sx={{ 
              width: 120,
              '& .MuiInputLabel-root': { 
                color: 'white',
                '&.Mui-focused': { color: 'white' }
              },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'white' },
                '&:hover fieldset': { borderColor: 'white' },
                '&.Mui-focused fieldset': { borderColor: 'white' }
              }
            }}
          />

          <TextField
            size="small"
            label="最高時薪"
            type="number"
            value={filters.max_rate}
            onChange={(e) => setFilters({ ...filters, max_rate: e.target.value })}
            sx={{ 
              width: 120,
              '& .MuiInputLabel-root': { 
                color: 'white',
                '&.Mui-focused': { color: 'white' }
              },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'white' },
                '&:hover fieldset': { borderColor: 'white' },
                '&.Mui-focused fieldset': { borderColor: 'white' }
              }
            }}
          />

          <Box sx={{ flexGrow: 1 }} />
        </Box>

        {/* 師資列表 */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={teachers.map(t => t.id.toString())}
            strategy={viewMode === 'grid' ? horizontalListSortingStrategy : verticalListSortingStrategy}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: viewMode === 'grid' ? 'row' : 'column',
                flexWrap: viewMode === 'grid' ? 'wrap' : 'nowrap',
                gap: 2,
                width: '100%',
                position: 'relative',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}
            >
              {teachers.map((teacher) => (
                <SortableTeacherCard key={teacher.id} teacher={teacher} viewMode={viewMode} />
              ))}
            </Box>
          </SortableContext>
        </DndContext>

        {teachers.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              沒有找到符合條件的師資
            </Typography>
          </Box>
        )}
      </Box>

      {/* 新增/編輯對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTeacher ? '編輯師資' : '新增師資'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="電子信箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="電話"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <TextField
                fullWidth
                label="時薪"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="教學經驗 (年)"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>狀態</InputLabel>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  label="狀態"
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                >
                  <MenuItem value="true">啟用</MenuItem>
                  <MenuItem value="false">停用</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {/* 可授課日編輯 */}
            <Autocomplete
              multiple
              options={['週一', '週二', '週三', '週四', '週五', '週六', '週日']}
              value={formData.availableDays}
              onChange={(_, newValue) => {
                setFormData({ ...formData, availableDays: newValue as string[] });
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="可授課日"
                  placeholder="選擇可授課的日期..."
                  helperText="可多選授課日期"
                />
              )}
            />

            <TextField
              fullWidth
              label="個人簡介"
              multiline
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveTeacher}
            variant="contained"
            disabled={!formData.name || !formData.email}
          >
            {editingTeacher ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          管理員身份驗證
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ 您即將刪除師資：<strong>{deletingTeacher?.name}</strong>
              <br />
              此操作無法復原，請謹慎操作！
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              只有系統管理員才能執行刪除操作，請輸入您的管理員密碼以確認身份：
            </Typography>

            <TextField
              fullWidth
              type="password"
              label="管理員密碼"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setPasswordError(''); // 清除錯誤訊息
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && adminPassword) {
                  verifyPasswordAndDelete();
                }
              }}
              error={!!passwordError}
              helperText={passwordError || '請輸入您的登入密碼'}
              placeholder="輸入管理員密碼..."
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            取消
          </Button>
          <Button
            onClick={verifyPasswordAndDelete}
            color="error"
            variant="contained"
            disabled={!adminPassword}
            startIcon={<DeleteIcon />}
          >
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 課程能力管理 */}
      {selectedTeacherForCourses && (
        <TeacherCourses
          teacherId={selectedTeacherForCourses.id}
          teacherName={selectedTeacherForCourses.name}
          open={coursesDialogOpen}
          onClose={handleCloseCourses}
        />
      )}
    </>
  );
};

export default TeachersPage;