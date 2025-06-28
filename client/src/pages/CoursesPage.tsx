import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Course {
  id: number;
  name: string;
  category: string;
  level: string;
  duration: number; // 分鐘
  price: number;
  description: string;
  prerequisites: string[];
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: 'Python 基礎程式設計',
      category: 'Python',
      level: '初級',
      duration: 90,
      price: 1200,
      description: '學習 Python 基本語法、變數、迴圈等概念',
      prerequisites: []
    },
    {
      id: 2,
      name: 'React 前端開發',
      category: 'Web開發',
      level: '中級',
      duration: 120,
      price: 1500,
      description: '學習 React 元件開發、狀態管理、路由等',
      prerequisites: ['JavaScript 基礎', 'HTML/CSS']
    },
    {
      id: 3,
      name: '資料結構與演算法',
      category: '演算法',
      level: '高級',
      duration: 90,
      price: 1800,
      description: '深入學習各種資料結構與演算法設計',
      prerequisites: ['Python 基礎程式設計']
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    level: '',
    duration: 90,
    price: 0,
    description: '',
    prerequisites: ''
  });

  const categories = ['Python', 'JavaScript', 'Web開發', '演算法', '資料科學', '機器學習'];
  const levels = ['初級', '中級', '高級'];

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price: course.price,
        description: course.description,
        prerequisites: course.prerequisites.join(', ')
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: '',
        category: '',
        level: '',
        duration: 90,
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

  const handleSave = () => {
    const courseData = {
      ...formData,
      prerequisites: formData.prerequisites
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
    };

    if (editingCourse) {
      // 編輯現有課程
      setCourses(prev => prev.map(course =>
        course.id === editingCourse.id
          ? { ...course, ...courseData }
          : course
      ));
    } else {
      // 新增課程
      const newCourse: Course = {
        id: Math.max(...courses.map(c => c.id)) + 1,
        ...courseData
      };
      setCourses(prev => [...prev, newCourse]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除此課程嗎？')) {
      setCourses(prev => prev.filter(course => course.id !== id));
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          課程管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增課程
        </Button>
      </Box>

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
                <TableCell>{course.duration}</TableCell>
                <TableCell>NT$ {course.price}</TableCell>
                <TableCell>
                  {course.prerequisites.map((prereq, index) => (
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
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="價格 (NT$)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                margin="normal"
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