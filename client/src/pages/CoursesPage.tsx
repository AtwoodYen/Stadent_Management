import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Course {
  id: number;
  name: string;
  category: string;
  level: string;
  duration_minutes: number;
  price: number;
  description: string;
  prerequisites: string;
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    level: '',
    duration_minutes: 90,
    price: 0,
    description: '',
    prerequisites: ''
  });

  const levels = ['初級', '中級', '高級'];

  // 載入課程資料
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError('無法載入課程資料，請稍後再試');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // 載入課程分類
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/courses/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        category: course.category,
        level: course.level,
        duration_minutes: course.duration_minutes,
        price: course.price,
        description: course.description,
        prerequisites: course.prerequisites
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: '',
        category: '',
        level: '',
        duration_minutes: 90,
        price: 0,
        description: '',
        prerequisites: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCourse(null);
  };

  const handleSave = async () => {
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save course');
      }

      await fetchCourses(); // 重新載入資料
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError('儲存課程時發生錯誤，請稍後再試');
      console.error('Error saving course:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此課程嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      await fetchCourses(); // 重新載入資料
      setError(null);
    } catch (err) {
      setError('刪除課程時發生錯誤，請稍後再試');
      console.error('Error deleting course:', err);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case '初級': return 'success';
      case '中級': return 'warning';
      case '高級': return 'error';
      default: return 'default';
    }
  };

  // 解析先修課程字串為陣列
  const parsePrerequisites = (prerequisites: string): string[] => {
    if (!prerequisites || prerequisites.trim() === '') return [];
    return prerequisites.split(',').map(p => p.trim()).filter(p => p.length > 0);
  };

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
        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
          課程管理
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" sx={{ color: 'white' }}>
            目前課程數量：{courses.length}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            新增課程
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>課程名稱</TableCell>
              <TableCell>分類</TableCell>
              <TableCell>難度</TableCell>
              <TableCell>時長(分鐘)</TableCell>
              <TableCell>價格</TableCell>
              <TableCell>先修課程</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1">{course.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{course.category}</TableCell>
                <TableCell>
                  <Chip
                    label={course.level}
                    color={getLevelColor(course.level) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{course.duration_minutes}</TableCell>
                <TableCell>NT$ {course.price}</TableCell>
                <TableCell>
                  {parsePrerequisites(course.prerequisites).map((prereq, index) => (
                    <Chip
                      key={index}
                      label={prereq}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(course)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(course.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新增/編輯課程對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCourse ? '編輯課程' : '新增課程'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="課程名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            
            <Box display="flex" gap={2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>分類</InputLabel>
                <Select
                  value={formData.category}
                  label="分類"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                  {/* 允許手動輸入新分類 */}
                  <MenuItem value="">
                    <TextField
                      size="small"
                      placeholder="輸入新分類"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value) {
                            setFormData({ ...formData, category: value });
                          }
                        }
                      }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>難度</InputLabel>
                <Select
                  value={formData.level}
                  label="難度"
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="課程時長 (分鐘)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                margin="normal"
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="價格 (NT$)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>

            <TextField
              fullWidth
              label="課程描述"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="先修課程 (用逗號分隔)"
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
              margin="normal"
              helperText="例如：JavaScript 基礎, HTML/CSS"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.category || !formData.level}
          >
            {editingCourse ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesPage; 