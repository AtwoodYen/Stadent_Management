import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  availableDays: string[];
  hourlyRate: number;
  experience: number;
  bio: string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface TeacherCourse {
  id: number;
  course_category: string;
  max_level: string;
  is_preferred: boolean;
  created_at?: string;
  updated_at?: string;
}

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Record<number, TeacherCourse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
    availableDays: [] as string[],
    hourlyRate: 1200,
    experience: 0,
    bio: '',
    isActive: true
  });

  // 篩選和搜尋功能
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'experience' | 'hourlyRate'>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const allDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

  // 載入師資資料
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teachers');
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();
      setTeachers(data);
      
      // 載入每位師資的課程能力
      const coursesData: Record<number, TeacherCourse[]> = {};
      for (const teacher of data) {
        try {
          const coursesResponse = await fetch(`/api/teachers/${teacher.id}/courses`);
          if (coursesResponse.ok) {
            coursesData[teacher.id] = await coursesResponse.json();
          }
        } catch (err) {
          console.error(`Failed to fetch courses for teacher ${teacher.id}:`, err);
          coursesData[teacher.id] = [];
        }
      }
      setTeacherCourses(coursesData);
      setError(null);
    } catch (err) {
      setError('無法載入師資資料，請稍後再試');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone || '',
        specialties: teacher.specialties.join(', '),
        availableDays: teacher.availableDays,
        hourlyRate: teacher.hourlyRate,
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
        specialties: '',
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

  const handleSave = async () => {
    try {
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialties: formData.specialties
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0),
        availableDays: formData.availableDays,
        hourlyRate: formData.hourlyRate,
        experience: formData.experience,
        bio: formData.bio,
        isActive: formData.isActive
      };

      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save teacher');
      }

      await fetchTeachers(); // 重新載入資料
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError('儲存師資時發生錯誤，請稍後再試');
      console.error('Error saving teacher:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此師資嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }

      await fetchTeachers(); // 重新載入資料
      setError(null);
    } catch (err) {
      setError('刪除師資時發生錯誤，請稍後再試');
      console.error('Error deleting teacher:', err);
    }
  };

  const toggleTeacherStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/teachers/${id}/toggle-status`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle teacher status');
      }

      await fetchTeachers(); // 重新載入資料
      setError(null);
    } catch (err) {
      setError('更新師資狀態時發生錯誤，請稍後再試');
      console.error('Error toggling teacher status:', err);
    }
  };

  const getTeacherCourses = (teacherId: number): TeacherCourse[] => {
    return teacherCourses[teacherId] || [];
  };

  // 篩選和排序邏輯
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter(teacher => {
      // 搜尋篩選
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 狀態篩選
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && teacher.is_active) ||
                           (filterStatus === 'inactive' && !teacher.is_active);
      
      return matchesSearch && matchesStatus;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'experience':
          return b.experience - a.experience;
        case 'hourlyRate':
          return b.hourlyRate - a.hourlyRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [teachers, searchTerm, filterStatus, sortBy]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2d3748', fontWeight: 'bold' }}>
          師資管理
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" sx={{ color: '#2d3748' }}>
            師資總數：{teachers.length} | 啟用：{teachers.filter(t => t.is_active).length}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            新增師資
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 搜尋和篩選控制項 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="搜尋師資姓名或專長..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>狀態</InputLabel>
              <Select
                value={filterStatus}
                label="狀態"
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="active">啟用</MenuItem>
                <MenuItem value="inactive">停用</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>排序</InputLabel>
              <Select
                value={sortBy}
                label="排序"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="name">姓名</MenuItem>
                <MenuItem value="experience">經驗</MenuItem>
                <MenuItem value="hourlyRate">時薪</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent="flex-end">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="cards">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="table">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 師資列表 */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredAndSortedTeachers.map((teacher) => (
            <Grid item xs={12} md={6} lg={4} key={teacher.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: teacher.is_active ? 'success.main' : 'grey.500' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{teacher.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        NT$ {teacher.hourlyRate}/小時 • {teacher.experience}年經驗
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      專長領域：
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {teacher.specialties.map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      可授課時間：
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {teacher.availableDays.map((day, index) => (
                        <Chip
                          key={index}
                          label={day}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">
                        可教授課程 ({getTeacherCourses(teacher.id).length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {getTeacherCourses(teacher.id).map((tc, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={tc.course_category}
                              secondary={`最高可教授：${tc.max_level}`}
                            />
                            <ListItemSecondaryAction>
                              {tc.is_preferred && (
                                <Chip label="主力" size="small" color="success" />
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      📧 {teacher.email} • 📱 {teacher.phone}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={teacher.is_active}
                        onChange={() => toggleTeacherStatus(teacher.id)}
                        size="small"
                      />
                    }
                    label={teacher.is_active ? "啟用" : "停用"}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(teacher)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(teacher.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>師資姓名</TableCell>
                <TableCell>聯絡資訊</TableCell>
                <TableCell>專長</TableCell>
                <TableCell>時薪</TableCell>
                <TableCell>經驗</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: teacher.is_active ? 'success.main' : 'grey.500' }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="subtitle1">{teacher.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{teacher.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{teacher.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {teacher.specialties.slice(0, 3).map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {teacher.specialties.length > 3 && (
                        <Chip
                          label={`+${teacher.specialties.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>NT$ {teacher.hourlyRate}</TableCell>
                  <TableCell>{teacher.experience}年</TableCell>
                  <TableCell>
                    <Chip
                      label={teacher.is_active ? "啟用" : "停用"}
                      color={teacher.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(teacher)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleTeacherStatus(teacher.id)}
                    >
                      <Switch checked={teacher.is_active} size="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(teacher.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新增/編輯師資對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTeacher ? '編輯師資' : '新增師資'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="師資姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="電子信箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="聯絡電話"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="時薪 (NT$)"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="教學經驗 (年)"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="啟用狀態"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="專長領域 (以逗號分隔)"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="例如：Python, Web開發, 演算法"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>可授課日</InputLabel>
                <Select
                  multiple
                  value={formData.availableDays}
                  onChange={(e) => setFormData({ ...formData, availableDays: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {allDays.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="個人簡介"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                multiline
                rows={4}
                placeholder="請簡述教學背景、專業經驗等..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTeacher ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeachersPage; 