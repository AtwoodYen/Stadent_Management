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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  School as SchoolIcon
} from '@mui/icons-material';

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
  // 狀態管理
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

  // 刪除師資
  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('確定要刪除這位師資嗎？')) return;
    
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('刪除失敗');
      
      setSnackbar({
        open: true,
        message: '師資刪除成功',
        severity: 'success'
      });
      
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
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

        <FormControl size="small" sx={{ minWidth: 120 }}>
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
          sx={{ width: 120 }}
        />

        <TextField
          size="small"
          label="最高時薪"
          type="number"
          value={filters.max_rate}
          onChange={(e) => setFilters({ ...filters, max_rate: e.target.value })}
          sx={{ width: 120 }}
        />

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增師資
        </Button>
      </Box>

      {/* 師資列表 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {teachers.map((teacher) => (
          <Card key={teacher.id} sx={{ width: 350, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
            </CardContent>

            <Divider />

            <CardActions>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleOpenDialog(teacher)}
              >
                編輯
              </Button>
              <Button
                size="small"
                color={teacher.is_active ? 'warning' : 'success'}
                onClick={() => handleToggleStatus(teacher.id)}
              >
                {teacher.is_active ? '停用' : '啟用'}
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteTeacher(teacher.id)}
              >
                刪除
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

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
    </Box>
  );
};

export default TeachersPage; 