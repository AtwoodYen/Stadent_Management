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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { getLevelColors } from '../utils/levelColors';

// 型別定義
interface TeacherCourse {
  id: number;
  teacher_id: number;
  course_category: string;
  max_level: string;
  is_preferred: boolean;
  created_at: string;
}

interface TeacherCoursesProps {
  teacherId: number | undefined;
  teacherName: string;
  open: boolean;
  onClose: () => void;
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
  onClose
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
    maxLevel: '初級',
    isPreferred: false
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const levels = ['初級', '中級', '高級'];

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
        setCourses(data);
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
      const response = await fetch('/api/courses/categories');
      
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
              maxLevel: '中級', // 預設中級
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
    
    if (open && teacherId) {
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
      courseCategory: '',
      maxLevel: '初級',
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
      fetchTeacherCourses();
    } catch (error) {
      console.error('儲存課程能力錯誤:', error);
      setSnackbar({
        open: true,
        message: `儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        severity: 'error'
      });
    }
  };

  // 刪除課程能力
  const handleDeleteCourse = async (course: TeacherCourse) => {
    if (!confirm(`確定要刪除「${course.course_category}」課程能力嗎？`)) return;

    try {
      const response = await fetch(`/api/teachers/${teacherId}/courses/${course.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('刪除失敗');

      setSnackbar({
        open: true,
        message: '課程能力刪除成功',
        severity: 'success'
      });

      // 重新從資料庫載入課程能力列表
      await fetchTeacherCourses();

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
                    <TableCell>課程分類</TableCell>
                    <TableCell>教學水準</TableCell>
                    <TableCell>主力課程</TableCell>
                    <TableCell>新增時間</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          尚未新增任何課程能力
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
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
                            color={
                              course.max_level === '高級' ? 'success' :
                              course.max_level === '中級' ? 'warning' : 'default'
                            }
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
                            onClick={() => handleDeleteCourse(course)}
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
            <FormControl fullWidth>
              <InputLabel>課程分類</InputLabel>
              <Select
                value={formData.courseCategory}
                label="課程分類"
                onChange={(e) => setFormData({ ...formData, courseCategory: e.target.value })}
              >
                {courseCategories.map((category, index) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
    </>
  );
};

export default TeacherCourses; 