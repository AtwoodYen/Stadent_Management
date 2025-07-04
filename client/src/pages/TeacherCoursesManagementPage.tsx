import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Button,
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
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Switch,
  Autocomplete,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { getLevelColors } from '../utils/levelColors';

// 介面定義
interface TeacherCourse {
  id: number;
  teacher_id: number;
  teacher_name: string;
  course_category: string;
  max_level: string;
  is_preferred: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface FormData {
  teacherId: number | '';
  courseCategory: string;
  maxLevel: string;
  isPreferred: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

type SortField = 'teacher_name' | 'course_category' | 'max_level' | 'is_preferred' | 'created_at' | 'sort_order';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

const TeacherCoursesManagementPage: React.FC = () => {
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TeacherCourse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    teacherId: '',
    courseCategory: '',
    maxLevel: '初級',
    isPreferred: false
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 搜尋和篩選狀態
  const [searchTeacher, setSearchTeacher] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterPreferred, setFilterPreferred] = useState('');

  // 排序狀態
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: 'asc'
  });

  const levels = ['初級', '中級', '高級'];

  // 載入所有資料
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeacherCourses(),
        fetchTeachers(),
        fetchCourseCategories()
      ]);
    } catch (error) {
      console.error('載入資料失敗:', error);
      setSnackbar({
        open: true,
        message: '載入資料失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 載入所有師資課程能力
  const fetchTeacherCourses = async () => {
    try {
      const response = await fetch('/api/teacher-courses');
      if (!response.ok) throw new Error('載入師資課程能力失敗');
      const data = await response.json();
      setTeacherCourses(data);
    } catch (error) {
      console.error('載入師資課程能力錯誤:', error);
      throw error;
    }
  };

  // 載入所有師資
  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (!response.ok) throw new Error('載入師資列表失敗');
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error('載入師資列表錯誤:', error);
      throw error;
    }
  };

  // 載入課程分類
  const fetchCourseCategories = async () => {
    try {
      const response = await fetch('/api/teachers/course-categories');
      if (!response.ok) throw new Error('載入課程分類失敗');
      const data = await response.json();
      setCourseCategories(data);
    } catch (error) {
      console.error('載入課程分類錯誤:', error);
      throw error;
    }
  };

  // 開啟新增/編輯對話框
  const handleOpenDialog = (course?: TeacherCourse) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        teacherId: course.teacher_id,
        courseCategory: course.course_category,
        maxLevel: course.max_level,
        isPreferred: course.is_preferred
      });
    } else {
      setEditingCourse(null);
      setFormData({
        teacherId: '',
        courseCategory: '',
        maxLevel: '初級',
        isPreferred: false
      });
    }
    setDialogOpen(true);
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
    setFormData({
      teacherId: '',
      courseCategory: '',
      maxLevel: '初級',
      isPreferred: false
    });
  };

  // 儲存課程能力
  const handleSaveCourse = async () => {
    if (!formData.teacherId || !formData.courseCategory) {
      setSnackbar({
        open: true,
        message: '請選擇師資和課程分類',
        severity: 'warning'
      });
      return;
    }

    try {
      const url = editingCourse 
        ? `/api/teachers/${formData.teacherId}/courses/${editingCourse.id}`
        : `/api/teachers/${formData.teacherId}/courses`;
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCategory: formData.courseCategory,
          maxLevel: formData.maxLevel,
          isPreferred: formData.isPreferred
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '儲存失敗');
      }

      setSnackbar({
        open: true,
        message: editingCourse ? '課程能力更新成功' : '課程能力新增成功',
        severity: 'success'
      });

      handleCloseDialog();
      await fetchTeacherCourses();
      
    } catch (error) {
      console.error('儲存課程能力失敗:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '儲存失敗',
        severity: 'error'
      });
    }
  };

  // 刪除課程能力
  const handleDeleteCourse = async (course: TeacherCourse) => {
    if (!confirm(`確定要刪除「${course.teacher_name}」的「${course.course_category}」課程能力嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers/${course.teacher_id}/courses/${course.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('刪除失敗');

      setSnackbar({
        open: true,
        message: '課程能力刪除成功',
        severity: 'success'
      });

      await fetchTeacherCourses();

    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '刪除失敗',
        severity: 'error'
      });
    }
  };

  // 處理排序
  const handleSort = (field: SortField) => {
    setSortState(prevState => ({
      field,
      direction: prevState.field === field && prevState.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 排序函數
  const sortCourses = (courses: TeacherCourse[]) => {
    if (!sortState.field) return courses;

    return [...courses].sort((a, b) => {
      let aValue: any = a[sortState.field!];
      let bValue: any = b[sortState.field!];

      // 特殊處理不同欄位的排序
      switch (sortState.field) {
        case 'max_level':
          // 教學水準排序：初級 < 中級 < 高級
          const levelOrder = { '初級': 1, '中級': 2, '高級': 3 };
          aValue = levelOrder[aValue as keyof typeof levelOrder] || 0;
          bValue = levelOrder[bValue as keyof typeof levelOrder] || 0;
          break;
        
        case 'is_preferred':
          // 主力課程排序：false < true
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
          break;
        
        case 'created_at':
          // 日期排序
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
          break;
        
        case 'sort_order':
          // 排序值排序
          aValue = Number(aValue);
          bValue = Number(bValue);
          break;
        
        default:
          // 字串排序
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // 篩選和排序資料
  const filteredAndSortedCourses = sortCourses(
    teacherCourses.filter(course => {
      return (
        (searchTeacher === '' || course.teacher_name.toLowerCase().includes(searchTeacher.toLowerCase())) &&
        (filterCategory === '' || course.course_category === filterCategory) &&
        (filterLevel === '' || course.max_level === filterLevel) &&
        (filterPreferred === '' || course.is_preferred.toString() === filterPreferred)
      );
    })
  );

  // 統計資料
  const stats = {
    totalCourses: teacherCourses.length,
    totalTeachers: new Set(teacherCourses.map(c => c.teacher_id)).size,
    preferredCourses: teacherCourses.filter(c => c.is_preferred).length,
    categories: new Set(teacherCourses.map(c => c.course_category)).size
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
        師資課程能力管理
      </Typography>

      {/* 統計卡片 */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              總課程能力數
            </Typography>
            <Typography variant="h5" component="div">
              {stats.totalCourses}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              參與師資數
            </Typography>
            <Typography variant="h5" component="div">
              {stats.totalTeachers}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              主力課程數
            </Typography>
            <Typography variant="h5" component="div">
              {stats.preferredCourses}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              課程分類數
            </Typography>
            <Typography variant="h5" component="div">
              {stats.categories}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 篩選和操作列 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          label="搜尋師資"
          value={searchTeacher}
          onChange={(e) => setSearchTeacher(e.target.value)}
          sx={{ 
            minWidth: 150,
            '& .MuiInputLabel-root': { color: 'white' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'white' },
              '&:hover fieldset': { borderColor: 'white' },
              '&.Mui-focused fieldset': { borderColor: 'white' }
            }
          }}
        />
        
        <FormControl size="small" sx={{ 
          minWidth: 150,
          '& .MuiInputLabel-root': { color: 'white' },
          '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
          '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': { borderColor: 'white' },
            '&:hover fieldset': { borderColor: 'white' },
            '&.Mui-focused fieldset': { borderColor: 'white' }
          },
          '& .MuiSvgIcon-root': { color: 'white' }
        }}>
          <InputLabel>課程分類</InputLabel>
          <Select
            value={filterCategory}
            label="課程分類"
            onChange={(e) => setFilterCategory(e.target.value)}
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
          '& .MuiInputLabel-root': { color: 'white' },
          '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
          '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': { borderColor: 'white' },
            '&:hover fieldset': { borderColor: 'white' },
            '&.Mui-focused fieldset': { borderColor: 'white' }
          },
          '& .MuiSvgIcon-root': { color: 'white' }
        }}>
          <InputLabel>教學水準</InputLabel>
          <Select
            value={filterLevel}
            label="教學水準"
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <MenuItem value="">全部</MenuItem>
            {levels.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ 
          minWidth: 120,
          '& .MuiInputLabel-root': { color: 'white' },
          '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
          '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': { borderColor: 'white' },
            '&:hover fieldset': { borderColor: 'white' },
            '&.Mui-focused fieldset': { borderColor: 'white' }
          },
          '& .MuiSvgIcon-root': { color: 'white' }
        }}>
          <InputLabel>主力課程</InputLabel>
          <Select
            value={filterPreferred}
            label="主力課程"
            onChange={(e) => setFilterPreferred(e.target.value)}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="true">是</MenuItem>
            <MenuItem value="false">否</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增課程能力
        </Button>
      </Box>

      {/* 課程能力表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'teacher_name'}
                  direction={sortState.field === 'teacher_name' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('teacher_name')}
                >
                  師資姓名
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'course_category'}
                  direction={sortState.field === 'course_category' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('course_category')}
                >
                  課程分類
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'max_level'}
                  direction={sortState.field === 'max_level' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('max_level')}
                >
                  教學水準
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'is_preferred'}
                  direction={sortState.field === 'is_preferred' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('is_preferred')}
                >
                  主力課程
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'created_at'}
                  direction={sortState.field === 'created_at' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('created_at')}
                >
                  建立時間
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === 'sort_order'}
                  direction={sortState.field === 'sort_order' ? sortState.direction : 'asc'}
                  onClick={() => handleSort('sort_order')}
                >
                  排序值
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    沒有找到符合條件的課程能力記錄
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCourses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography fontWeight="medium">
                        {course.teacher_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {course.course_category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.max_level}
                      sx={{
                        backgroundColor: getLevelColors(course.max_level).backgroundColor,
                        color: getLevelColors(course.max_level).color,
                        border: '1px solid',
                        borderColor: getLevelColors(course.max_level).borderColor
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={course.is_preferred ? '主力課程' : '一般課程'}>
                      {course.is_preferred ? (
                        <StarIcon sx={{ color: 'warning.main' }} />
                      ) : (
                        <StarBorderIcon sx={{ color: 'text.secondary' }} />
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(course.created_at).toLocaleDateString('zh-TW')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {course.sort_order}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(course)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCourse(course)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCourse ? '編輯課程能力' : '新增課程能力'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={teachers}
              getOptionLabel={(option) => option.name}
              value={teachers.find(t => t.id === formData.teacherId) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, teacherId: newValue?.id || '' });
              }}
              disabled={!!editingCourse}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="選擇師資"
                  required
                  helperText={editingCourse ? '編輯時無法更改師資' : '請選擇要設定課程能力的師資'}
                />
              )}
            />

            <FormControl fullWidth required>
              <InputLabel>課程分類</InputLabel>
              <Select
                value={formData.courseCategory}
                label="課程分類"
                onChange={(e) => setFormData({ ...formData, courseCategory: e.target.value })}
              >
                {courseCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>教學水準</InputLabel>
              <Select
                value={formData.maxLevel}
                label="教學水準"
                onChange={(e) => setFormData({ ...formData, maxLevel: e.target.value })}
              >
                {levels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPreferred}
                  onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                />
              }
              label="設為主力課程"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            disabled={!formData.teacherId || !formData.courseCategory}
          >
            {editingCourse ? '更新' : '新增'}
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

export default TeacherCoursesManagementPage; 