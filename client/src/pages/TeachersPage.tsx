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

} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
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
  DragIndicator as DragIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import TeacherCourses from '../components/TeacherCourses';
import { useAuth } from '../context/AuthContext';

// 型別定義
interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  availableDays: string[];
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
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 篩選狀態
  const [filters, setFilters] = useState({
    specialty: '',
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
    specialties: [] as string[],
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
    fetchSpecialties();
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

  const fetchSpecialties = async () => {
    try {
      const response = await fetch('/api/teachers/specialties');
      if (!response.ok) throw new Error('載入專長列表失敗');
      
      const data = await response.json();
      setSpecialties(data);
    } catch (err) {
      console.error('載入專長列表失敗:', err);
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
        specialties: teacher.specialties,
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
        specialties: [],
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
      
      setSnackbar({
        open: true,
        message: editingTeacher ? '師資資料更新成功' : '新增師資成功',
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchTeachers();
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
      
      setSnackbar({
        open: true,
        message: '師資狀態更新成功',
        severity: 'success'
      });
      
      fetchTeachers();
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
      fetchTeachers();
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

  // 處理拖拽結束
  const handleDragEnd = (result: DropResult) => {
    // 如果沒有有效的目標位置，則不做任何操作
    if (!result.destination) {
      console.log('拖拽取消：沒有有效的目標位置');
      return;
    }

    // 如果拖拽到同一位置，則不做任何操作
    if (result.source.index === result.destination.index) {
      console.log('拖拽取消：位置沒有改變');
      return;
    }

    console.log('拖拽操作：', {
      從: result.source.index,
      到: result.destination.index,
      師資ID: result.draggableId
    });

    // 創建新的師資列表
    const newTeachers = Array.from(teachers);
    const [draggedTeacher] = newTeachers.splice(result.source.index, 1);
    newTeachers.splice(result.destination.index, 0, draggedTeacher);

    // 更新狀態
    setTeachers(newTeachers);
    
    console.log('拖拽完成：師資順序已更新');
  };

  // 處理拖拽開始
  const handleDragStart = (start: any) => {
    console.log('開始拖拽:', start.draggableId);
  };

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
          <InputLabel>專長</InputLabel>
          <Select
            value={filters.specialty}
            label="專長"
            onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
          >
            <MenuItem value="">全部</MenuItem>
            {specialties.map((specialty) => (
              <MenuItem key={specialty} value={specialty}>
                {specialty}
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

        {/* 顯示模式切換按鈕 */}
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewModuleIcon />}
            onClick={() => setViewMode('grid')}
            sx={{
              minWidth: 'auto',
              px: 2,
              '&.MuiButton-contained': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }
              },
              '&.MuiButton-outlined': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
            }}
          >
            區塊
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewListIcon />}
            onClick={() => setViewMode('list')}
            sx={{
              minWidth: 'auto',
              px: 2,
              '&.MuiButton-contained': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }
              },
              '&.MuiButton-outlined': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
            }}
          >
            列表
          </Button>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增師資
        </Button>
      </Box>

      {/* 師資列表 */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="teachers" type="TEACHER">
          {(provided, snapshot) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ 
                display: viewMode === 'grid' ? 'grid' : 'flex',
                flexDirection: viewMode === 'list' ? 'column' : 'row',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fit, minmax(350px, 1fr))' : 'none',
                gap: 2,
                width: '100%',
                minHeight: snapshot.isDraggingOver ? '200px' : 'auto',
                transition: 'min-height 0.2s ease',
                position: 'relative',
                alignItems: 'flex-start'
              }}
            >
              {teachers.map((teacher, index) => (
                <Draggable key={teacher.id} draggableId={teacher.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                        height: viewMode === 'list' ? 'auto' : 'fit-content',
                        width: '100%',
                        position: snapshot.isDragging ? 'fixed' : 'relative',
                        transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none',
                        boxShadow: snapshot.isDragging ? 8 : 2,
                        opacity: snapshot.isDragging ? 0.9 : 1,
                        zIndex: snapshot.isDragging ? 1000 : 1,
                        transition: snapshot.isDragging ? 'none' : 'all 0.2s ease',
                        cursor: 'default',
                        '&:hover': {
                          boxShadow: snapshot.isDragging ? 8 : 4,
                        },
                        ...provided.draggableProps.style
                      }}
                    >
                      {/* 拖拽手柄區域 */}
                      <Box
                        {...provided.dragHandleProps}
                        sx={{
                          p: 1,
                          backgroundColor: snapshot.isDragging ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          textAlign: 'center',
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' },
                          borderBottom: viewMode === 'grid' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                          borderRight: viewMode === 'list' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                          minWidth: viewMode === 'list' ? '50px' : 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <DragIcon fontSize="small" color={snapshot.isDragging ? 'primary' : 'action'} />
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', alignItems: viewMode === 'list' ? 'center' : 'stretch', gap: viewMode === 'list' ? 3 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: viewMode === 'grid' ? 2 : 0, minWidth: viewMode === 'list' ? '200px' : 'auto' }}>
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
                              專長：
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                              {teacher.specialties.map((specialty, index) => (
                                <Chip key={index} label={specialty} size="small" variant="outlined" />
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
                                專長：
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {teacher.specialties.map((specialty, index) => (
                                  <Chip key={index} label={specialty} size="small" variant="outlined" />
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

                      {viewMode === 'grid' && <Divider />}

                      <CardActions sx={{ 
                        justifyContent: viewMode === 'list' ? 'flex-end' : 'space-between', 
                        flexWrap: 'wrap', 
                        gap: 1,
                        flexDirection: viewMode === 'list' ? 'row' : 'row',
                        minWidth: viewMode === 'list' ? 'auto' : 'auto'
                      }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(teacher);
                          }}
                          sx={{ pointerEvents: 'auto' }}
                        >
                          編輯
                        </Button>
                        <Button
                          size="small"
                          color="info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCourses(teacher);
                          }}
                          sx={{ pointerEvents: 'auto' }}
                        >
                          課程能力
                        </Button>
                        <Button
                          size="small"
                          color={teacher.is_active ? 'warning' : 'success'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(teacher.id);
                          }}
                          sx={{ pointerEvents: 'auto' }}
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
                              handleDeleteTeacher(teacher);
                            }}
                            sx={{ pointerEvents: 'auto' }}
                          >
                            刪除
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {teachers.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            沒有找到符合條件的師資
          </Typography>
        </Box>
      )}

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
            {/* 專長編輯 */}
            <Autocomplete
              multiple
              options={specialties}
              value={formData.specialties}
              onChange={(_, newValue) => {
                setFormData({ ...formData, specialties: newValue as string[] });
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
                  label="專長"
                  placeholder="選擇或輸入專長..."
                  helperText="可多選或輸入新專長"
                />
              )}
            />

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
    </Box>
  );
};

export default TeachersPage; 