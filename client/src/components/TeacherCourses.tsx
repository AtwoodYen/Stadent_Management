import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  Autocomplete,
  TableSortLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Sync as SyncIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getLevelColors } from '../utils/levelColors';

// 型別定義
interface TeacherCourse {
  id: number;
  teacher_id: number;
  course_category: string;
  max_level: string;
  is_preferred: boolean;
  sort_order: number;
  created_at: string;
}

interface TeacherCoursesProps {
  teacherId: number | undefined;
  teacherName: string;
  open: boolean;
  onClose: () => void;
  onCoursesUpdated?: () => void; // 新增：課程能力更新時的回調函數
}

interface FormData {
  courseCategory: string;
  maxLevel: string;
  isPreferred: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const TeacherCourses: React.FC<TeacherCoursesProps> = ({
  teacherId,
  teacherName,
  open,
  onClose,
  onCoursesUpdated
}) => {
  // 課程分類名稱映射表（處理歷史資料不一致問題）
  const courseCategoryMapping: { [key: string]: string } = {
    'Web開發': '網頁開發/APP/應用程式/遊戲',
    '網頁開發': '網頁開發/APP/應用程式/遊戲',
    'web開發': '網頁開發/APP/應用程式/遊戲',
    'WEB開發': '網頁開發/APP/應用程式/遊戲'
  };

  // 統一課程分類名稱
  const normalizeCourseCategory = (category: string): string => {
    return courseCategoryMapping[category] || category;
  };

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [teacherSpecialties, setTeacherSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TeacherCourse | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    courseCategory: '',
    maxLevel: '新手',
    isPreferred: false
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 刪除確認視窗狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<TeacherCourse | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const levels = ['新手', '入門', '進階', '高階', '精英'];

  // 排序狀態
  const [sortState, setSortState] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'sort_order', direction: 'asc' });

  // 排序函數
  const sortCourses = (courses: TeacherCourse[]) => {
    if (!sortState.field) return courses;
    return [...courses].sort((a, b) => {
      let aValue: any = a[sortState.field as keyof TeacherCourse];
      let bValue: any = b[sortState.field as keyof TeacherCourse];
      // 特殊處理
      if (sortState.field === 'max_level') {
        const levelOrder = { '新手': 1, '入門': 2, '進階': 3, '高階': 4, '精英': 5 };
        aValue = levelOrder[String(aValue) as keyof typeof levelOrder] || 0;
        bValue = levelOrder[String(bValue) as keyof typeof levelOrder] || 0;
      } else if (sortState.field === 'is_preferred') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else if (sortState.field === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: string) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 載入師資課程能力
  const fetchTeacherCourses = async () => {
    if (teacherId === undefined || teacherId === null) {
      console.log('teacherId 為空，跳過載入課程能力');
      return;
    }
    
    // 檢查 teacherId 是否為 0（這是合法的 ID）
    if (teacherId === 0) {
      console.log('teacherId 為 0，這是合法的師資 ID');
    }
    
    console.log('開始載入師資課程能力, teacherId:', teacherId);
    setLoading(true);
    try {
      const url = `/api/teachers/${teacherId}/courses`;
      console.log('請求 URL:', url);
      
      const response = await fetch(url);
      console.log('課程能力 API 回應狀態:', response.status);
      console.log('課程能力 API 回應 headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`載入課程能力失敗: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('載入的課程能力資料:', data);
      console.log('課程能力資料類型:', typeof data, '是否為陣列:', Array.isArray(data));
      console.log('課程能力數量:', data?.length);
      
      if (Array.isArray(data)) {
        // 按照排序值排序
        const sortedData = data.sort((a: TeacherCourse, b: TeacherCourse) => a.sort_order - b.sort_order);
        setCourses(sortedData);
        console.log('課程能力設定成功，數量:', data.length);
      } else {
        console.error('API 返回的資料格式不正確:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('載入課程能力錯誤:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '載入課程能力失敗',
        severity: 'error'
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // 載入師資專長資訊
  const fetchTeacherSpecialties = async () => {
    if (teacherId === undefined || teacherId === null) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers/${teacherId}`);
      if (!response.ok) throw new Error('載入師資資訊失敗');
      
      const teacherData = await response.json();
      console.log('師資資料:', teacherData);
      
      // 解析 specialties 欄位
      let specialties: string[] = [];
      if (teacherData.specialties) {
        if (Array.isArray(teacherData.specialties)) {
          specialties = teacherData.specialties;
        } else if (typeof teacherData.specialties === 'string') {
          try {
            specialties = JSON.parse(teacherData.specialties);
          } catch (e) {
            // 如果不是 JSON 格式，可能是逗號分隔的字串
            specialties = teacherData.specialties.split(',').map((s: string) => s.trim());
          }
        }
      }
      
      setTeacherSpecialties(specialties);
      console.log('解析的專長:', specialties);
    } catch (error) {
      console.error('載入師資專長錯誤:', error);
      setTeacherSpecialties([]);
    }
  };

  // 載入課程分類
  const fetchCourseCategories = async () => {
    try {
      const response = await fetch('/api/teachers/course-categories');
      
      if (!response.ok) {
        throw new Error(`載入課程分類失敗: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setCourseCategories(data);
      } else {
        // 使用預設課程分類
        const defaultCategories = [
          'Python', 'JavaScript', 'Java', 'C++', 'C#',
          '網頁開發/APP/應用程式/遊戲', '資料科學', '機器學習',
          'UI/UX設計', '遊戲開發', '演算法', '資料庫設計',
          'DevOps', '雲端技術', 'iOS開發', 'Android開發'
        ];
        setCourseCategories(defaultCategories);
      }
    } catch (error) {
      console.error('載入課程分類錯誤:', error);
      // 使用預設課程分類
      const defaultCategories = [
        'Python', 'JavaScript', 'Java', 'C++', 'C#',
        '網頁開發/APP/應用程式/遊戲', '資料科學', '機器學習',
        'UI/UX設計', '遊戲開發', '演算法', '資料庫設計',
        'DevOps', '雲端技術', 'iOS開發', 'Android開發'
      ];
      setCourseCategories(defaultCategories);
    }
  };

  // 同步專長到課程能力
  const syncSpecialtiesToCourses = async () => {
    if (teacherSpecialties.length === 0) {
      setSnackbar({
        open: true,
        message: '沒有專長資料可同步',
        severity: 'warning'
      });
      return;
    }

    try {
      // 為每個專長建立課程能力記錄
      for (const specialty of teacherSpecialties) {
        // 檢查是否已存在該課程分類
        const existingCourse = courses.find(c => 
          c.course_category === specialty || 
          normalizeCourseCategory(c.course_category) === normalizeCourseCategory(specialty)
        );

        if (!existingCourse) {
          // 新增課程能力
          const response = await fetch(`/api/teachers/${teacherId}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseCategory: specialty,
              maxLevel: '新手', // 預設新手
              isPreferred: true // 預設為主力課程
            })
          });

          if (!response.ok) {
            console.warn(`新增課程能力失敗: ${specialty}`);
          }
        }
      }

      setSnackbar({
        open: true,
        message: '專長同步到課程能力完成',
        severity: 'success'
      });

      // 重新載入課程能力
      await fetchTeacherCourses();
      
      // 通知父組件課程能力已更新
      if (onCoursesUpdated) {
        onCoursesUpdated();
      }
    } catch (error) {
      console.error('同步專長錯誤:', error);
      setSnackbar({
        open: true,
        message: '同步專長失敗',
        severity: 'error'
      });
    }
  };



  // 當對話框開啟時載入資料
  useEffect(() => {
    console.log('=== TeacherCourses useEffect 觸發 ===');
    console.log('open:', open);
    console.log('teacherId:', teacherId);
    console.log('teacherId 類型:', typeof teacherId);
    console.log('teacherId 是否為真值:', !!teacherId);
    
    if (open && (teacherId !== undefined && teacherId !== null)) {
      console.log('開始載入資料...');
      fetchTeacherCourses();
      fetchTeacherSpecialties();
      fetchCourseCategories();
    } else {
      console.log('跳過載入資料，條件不滿足');
    }
  }, [open, teacherId]);

  // 開啟新增/編輯對話框
  const handleOpenDialog = (course?: TeacherCourse) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        courseCategory: course.course_category,
        maxLevel: course.max_level,
        isPreferred: course.is_preferred
      });
    } else {
      setEditingCourse(null);
      setFormData({
        courseCategory: '',
        maxLevel: '新手',
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
      courseCategory: '',
      maxLevel: '新手',
      isPreferred: false
    });
  };

  // 儲存課程能力
  const handleSaveCourse = async () => {
    if (!formData.courseCategory) {
      setSnackbar({
        open: true,
        message: '請選擇課程分類',
        severity: 'warning'
      });
      return;
    }

    try {
      const url = editingCourse 
        ? `/api/teachers/${teacherId}/courses/${editingCourse.id}`
        : `/api/teachers/${teacherId}/courses`;
      
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
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();

      setSnackbar({
        open: true,
        message: editingCourse ? '課程能力更新成功' : '課程能力新增成功',
        severity: 'success'
      });

      handleCloseDialog();
      await fetchTeacherCourses();
      
      // 通知父組件課程能力已更新
      if (onCoursesUpdated) {
        onCoursesUpdated();
      }
    } catch (error) {
      console.error('儲存課程能力錯誤:', error);
      setSnackbar({
        open: true,
        message: `儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        severity: 'error'
      });
    }
  };

  // 開啟刪除確認視窗
  const handleOpenDeleteDialog = (course: TeacherCourse) => {
    setCourseToDelete(course);
    setAdminPassword('');
    setPasswordError('');
    setDeleteDialogOpen(true);
  };

  // 關閉刪除確認視窗
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
    setAdminPassword('');
    setPasswordError('');
  };

  // 驗證管理員密碼
  const validateAdminPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return response.ok;
    } catch (error) {
      console.error('密碼驗證錯誤:', error);
      return false;
    }
  };

  // 刪除課程能力
  const handleDeleteCourse = async () => {
    if (!courseToDelete || !adminPassword.trim()) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    try {
      // 驗證管理員密碼
      const isValidPassword = await validateAdminPassword(adminPassword);
      if (!isValidPassword) {
        setPasswordError('管理員密碼錯誤');
        return;
      }

      const response = await fetch(`/api/teachers/${teacherId}/courses/${courseToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('刪除失敗');

      setSnackbar({
        open: true,
        message: '課程能力刪除成功',
        severity: 'success'
      });

      handleCloseDeleteDialog();
      
      // 重新從資料庫載入課程能力列表
      await fetchTeacherCourses();
      
      // 通知父組件課程能力已更新
      if (onCoursesUpdated) {
        onCoursesUpdated();
      }

    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '刪除失敗',
        severity: 'error'
      });
    }
  };

  return (
    <>
      {/* 主對話框 */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {teacherName} - 課程能力管理
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* 師資專長資訊 */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                師資專長資訊
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  專長領域：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {teacherSpecialties.length > 0 ? (
                    teacherSpecialties.map((specialty, index) => (
                      <Chip key={index} label={specialty} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      無專長資料
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button
                size="small"
                startIcon={<SyncIcon />}
                onClick={syncSpecialtiesToCourses}
                variant="outlined"
                disabled={teacherSpecialties.length === 0}
              >
                同步專長到課程能力
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 課程能力管理 */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                課程能力列表 ({courses.length})
              </Typography>
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
                        active={sortState.field === 'sort_order'}
                        direction={sortState.field === 'sort_order' ? sortState.direction : 'asc'}
                        onClick={() => handleSort('sort_order')}
                      >
                        排序值
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortState.field === 'created_at'}
                        direction={sortState.field === 'created_at' ? sortState.direction : 'asc'}
                        onClick={() => handleSort('created_at')}
                      >
                        新增時間
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortCourses(courses).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          尚未新增任何課程能力
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortCourses(courses).map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {course.course_category}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={course.max_level} 
                            size="small" 
                            sx={{
                              backgroundColor: getLevelColors(course.max_level).backgroundColor,
                              color: getLevelColors(course.max_level).color,
                              border: '1px solid',
                              borderColor: getLevelColors(course.max_level).borderColor
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={course.is_preferred ? '是' : '否'} 
                            size="small" 
                            color={course.is_preferred ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {course.sort_order}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(course.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(course)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(course)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 新增/編輯課程能力對話框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCourse ? '編輯課程能力' : '新增課程能力'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              freeSolo
              options={courseCategories}
              value={formData.courseCategory}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, courseCategory: newValue || '' }));
              }}
              onInputChange={(event, newInputValue) => {
                setFormData(prev => ({ ...prev, courseCategory: newInputValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="課程分類"
                  placeholder="選擇或輸入課程分類"
                  helperText="可以從現有分類中選擇，或輸入新的課程分類名稱"
                  margin="normal"
                />
              )}
            />

            <FormControl fullWidth>
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
          <Button onClick={handleSaveCourse} variant="contained">
            {editingCourse ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認視窗 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningIcon color="error" />
          確認刪除課程能力
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              您確定要刪除以下課程能力嗎？
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>師資：</strong>{teacherName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>課程分類：</strong>{courseToDelete?.course_category}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>教學水準：</strong>{courseToDelete?.max_level}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>主力課程：</strong>{courseToDelete?.is_preferred ? '是' : '否'}
              </Typography>
            </Box>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              此操作無法復原，請謹慎操作。
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="管理員密碼"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setPasswordError('');
              }}
              error={!!passwordError}
              helperText={passwordError}
              margin="normal"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button 
            onClick={handleDeleteCourse} 
            variant="contained" 
            color="error"
            disabled={!adminPassword.trim()}
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: '50% !important',
          left: '50% !important',
          transform: 'translate(-50%, -50%) !important',
          bottom: 'auto !important',
          right: 'auto !important'
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TeacherCourses; 