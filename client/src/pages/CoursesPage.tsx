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
  CircularProgress,
  TableSortLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getLevelColors } from '../utils/levelColors';

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

type SortField = 'name' | 'category' | 'level' | 'duration_minutes' | 'price';
type SortOrder = 'asc' | 'desc';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    level: '',
    duration_minutes: 90,
    price: 0,
    description: '',
    prerequisites: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const levels = ['新手', '入門', '進階', '高階', '精英'];

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

  const handleDelete = (course: Course) => {
    setCourseToDelete(course);
    setShowPasswordModal(true);
    setPasswordError('');
    setAdminPassword('');
  };

  const verifyPasswordAndDelete = async () => {
    if (!courseToDelete || !adminPassword) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    try {
      // 先驗證管理員密碼
      const verifyResponse = await fetch('/api/auth/validate-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setPasswordError(errorData.message || '密碼驗證失敗');
        return;
      }

      // 密碼驗證成功，執行刪除
      const deleteResponse = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete course');
      }

      await fetchCourses(); // 重新載入資料
      setShowPasswordModal(false);
      setCourseToDelete(null);
      setAdminPassword('');
      setError(null);
    } catch (err) {
      setPasswordError('刪除課程時發生錯誤，請稍後再試');
      console.error('Error deleting course:', err);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCourseToDelete(null);
    setAdminPassword('');
    setPasswordError('');
  };

  const getLevelColor = (level: string) => {
    const colors = getLevelColors(level);
    return {
      backgroundColor: colors.backgroundColor,
      color: colors.color,
      border: '1px solid',
      borderColor: colors.borderColor
    };
  };

  // 解析先修課程字串為陣列
  const parsePrerequisites = (prerequisites: string): string[] => {
    if (!prerequisites || prerequisites.trim() === '') return [];
    return prerequisites.split(',').map(p => p.trim()).filter(p => p.length > 0);
  };

  // 排序處理函數
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果點擊的是同一欄位，切換排序順序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果點擊的是不同欄位，設定新欄位並重設為升序
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 排序後的課程資料
  const sortedCourses = [...courses].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // 處理難度排序的特殊邏輯
    if (sortField === 'level') {
      const levelOrder = { '新手': 1, '入門': 2, '進階': 3, '高階': 4, '精英': 5 };
      aValue = levelOrder[aValue as keyof typeof levelOrder] || 0;
      bValue = levelOrder[bValue as keyof typeof levelOrder] || 0;
    }

    // 處理字串和數字的比較
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

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
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  課程名稱
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'category'}
                  direction={sortField === 'category' ? sortOrder : 'asc'}
                  onClick={() => handleSort('category')}
                >
                  分類
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'level'}
                  direction={sortField === 'level' ? sortOrder : 'asc'}
                  onClick={() => handleSort('level')}
                >
                  難度
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'duration_minutes'}
                  direction={sortField === 'duration_minutes' ? sortOrder : 'asc'}
                  onClick={() => handleSort('duration_minutes')}
                >
                  時長(分鐘)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'price'}
                  direction={sortField === 'price' ? sortOrder : 'asc'}
                  onClick={() => handleSort('price')}
                >
                  價格
                </TableSortLabel>
              </TableCell>
              <TableCell>先修課程</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCourses.map((course) => (
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
                    sx={getLevelColor(course.level)}
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
                    onClick={() => handleDelete(course)}
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
                      placeholder="輸入新分類後按 Enter 或失去焦點完成"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value.trim()) {
                            const newCategory = value.trim();
                            // 如果是新分類，添加到分類列表中
                            if (!categories.includes(newCategory)) {
                              setCategories([...categories, newCategory]);
                            }
                            setFormData({ ...formData, category: newCategory });
                            // 清空輸入框
                            (e.target as HTMLInputElement).value = '';
                            // 關閉下拉選單
                            (e.target as HTMLInputElement).blur();
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value.trim()) {
                          const newCategory = value.trim();
                          // 如果是新分類，添加到分類列表中
                          if (!categories.includes(newCategory)) {
                            setCategories([...categories, newCategory]);
                          }
                          setFormData({ ...formData, category: newCategory });
                          // 清空輸入框
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      sx={{ width: '100%' }}
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

      {/* 管理員密碼驗證模態框 */}
      <Dialog open={showPasswordModal} onClose={closePasswordModal} maxWidth="sm" fullWidth>
        <DialogTitle>管理員密碼驗證</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ⚠️ 您即將刪除課程：<strong>{courseToDelete?.name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              只有系統管理員才能執行刪除操作，請輸入您的管理員密碼以確認身份：
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="管理員密碼"
              value={adminPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  verifyPasswordAndDelete();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordModal}>取消</Button>
          <Button 
            onClick={verifyPasswordAndDelete} 
            color="error" 
            variant="contained"
            disabled={!adminPassword.trim()}
          >
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesPage; 