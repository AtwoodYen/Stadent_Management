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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

// 型別定義
interface TeacherCourse {
  id: number;
  course_category: string;
  max_level: string;
  is_preferred: boolean;
  created_at: string;
  updated_at?: string;
}

interface TeacherCoursesProps {
  teacherId: number;
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

  // 載入可用的課程分類
  const fetchCourseCategories = async () => {
    try {
      console.log('開始載入課程分類...');
      const response = await fetch('/api/courses/categories');
      console.log('API 回應狀態:', response.status);
      console.log('API 回應 headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
      }
      
      const categories = await response.json();
      console.log('載入的課程分類:', categories);
      console.log('課程分類類型:', typeof categories, '是否為陣列:', Array.isArray(categories));
      
      if (Array.isArray(categories) && categories.length > 0) {
        setCourseCategories(categories);
        console.log('課程分類設定成功');
      } else {
        throw new Error('API 返回的資料格式不正確或為空');
      }
    } catch (error) {
      console.error('載入課程分類失敗:', error);
      // 提供預設課程分類
      const defaultCategories = [
        'AI工具運用', 'C/C++', 'Java', 'Python', 'Scratch',
        '資料科學', '遊戲開發', '演算法', '網頁開發/APP/應用程式/遊戲', '機器學習'
      ];
      console.log('使用預設課程分類:', defaultCategories);
      setCourseCategories(defaultCategories);
      
      // 顯示錯誤訊息給用戶
      setSnackbar({
        open: true,
        message: `載入課程分類失敗，使用預設分類: ${error instanceof Error ? error.message : '未知錯誤'}`,
        severity: 'warning'
      });
    }
  };

  useEffect(() => {
    console.log('=== TeacherCourses useEffect 觸發 ===');
    console.log('open:', open);
    console.log('teacherId:', teacherId);
    console.log('teacherId 類型:', typeof teacherId);
    console.log('條件檢查 - open && teacherId:', open && teacherId);
    console.log('條件檢查 - open && teacherId !== undefined && teacherId !== null:', open && teacherId !== undefined && teacherId !== null);
    console.log('========================================');
    
    if (open && teacherId !== undefined && teacherId !== null) {
      console.log('條件滿足，開始載入課程能力和分類...');
      fetchTeacherCourses();
      fetchCourseCategories();
    }
    // 即使對話框未開啟也先載入課程分類
    if (courseCategories.length === 0) {
      fetchCourseCategories();
    }
  }, [open, teacherId]);

  // 開啟新增/編輯對話框
  const handleOpenDialog = (course?: TeacherCourse) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        courseCategory: normalizeCourseCategory(course.course_category),
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

  // 關閉新增/編輯對話框
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

    console.log('開始儲存課程能力:', formData);
    console.log('teacherId:', teacherId, 'editingCourse:', editingCourse);

    try {
      const url = editingCourse 
        ? `/api/teachers/${teacherId}/courses/${editingCourse.id}`
        : `/api/teachers/${teacherId}/courses`;
      
      const method = editingCourse ? 'PUT' : 'POST';
      
      console.log('請求 URL:', url);
      console.log('請求方法:', method);
      console.log('請求資料:', {
        courseCategory: formData.courseCategory,
        maxLevel: formData.maxLevel,
        isPreferred: formData.isPreferred
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCategory: formData.courseCategory,
          maxLevel: formData.maxLevel,
          isPreferred: formData.isPreferred
        })
      });

      console.log('API 回應狀態:', response.status);
      console.log('API 回應 headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 錯誤回應:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('儲存成功，回應資料:', result);

      setSnackbar({
        open: true,
        message: editingCourse ? '課程能力更新成功' : '課程能力新增成功',
        severity: 'success'
      });

      handleCloseDialog();
      
      // 重新從資料庫載入課程能力列表
      console.log('重新載入課程能力列表...');
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
            {/* 操作按鈕 */}
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
                          <Typography fontWeight="medium">
                            {normalizeCourseCategory(course.course_category)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.max_level}
                            color={
                              course.max_level === '高級' ? 'error' :
                              course.max_level === '中級' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {course.is_preferred ? (
                            <Chip
                              icon={<StarIcon />}
                              label="主力課程"
                              color="primary"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<StarBorderIcon />}
                              label="次要課程"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(course.created_at).toLocaleDateString('zh-TW')}
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
                onOpen={() => {
                  console.log('Select 打開, courseCategories:', courseCategories);
                  console.log('courseCategories.length:', courseCategories.length);
                }}
              >
                {(() => {
                  console.log('渲染課程分類選項, courseCategories:', courseCategories);
                  console.log('courseCategories 長度:', courseCategories.length);
                  return null;
                })()}
                {courseCategories.length === 0 ? (
                  <MenuItem disabled value="">
                    <em>載入中...</em>
                  </MenuItem>
                ) : (
                  courseCategories.map((category, index) => {
                    console.log(`渲染選項 ${index}:`, category);
                    return (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    );
                  })
                )}
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

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                • <strong>教學水準</strong>：表示該師資能教授此課程的最高級別<br/>
                • <strong>主力課程</strong>：標示為師資的核心專長，優先排課時會參考
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            disabled={!formData.courseCategory}
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
    </>
  );
};

export default TeacherCourses; 