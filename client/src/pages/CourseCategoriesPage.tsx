import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIndicatorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseCategory {
  id: number;
  category_code: string;
  category_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  course_count: number;
  teacher_count: number;
  student_count: number;
}

interface FormData {
  category_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

// 可排序的表頭組件
const SortableTableHeader = ({ 
  field, 
  label, 
  currentSortField, 
  currentSortDirection, 
  onSort,
  width,
  align = 'left',
  sx = {}
}: {
  field: string;
  label: string;
  currentSortField: string;
  currentSortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sx?: any;
}) => {
  const isActive = currentSortField === field;
  
  return (
    <TableCell 
      width={width} 
      align={align} 
      sx={{ 
        cursor: 'pointer', 
        userSelect: 'none',
        '&:hover': { backgroundColor: 'action.hover' },
        ...sx
      }}
      onClick={() => onSort(field)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        <Typography variant="body2" sx={{ mr: 0.5 }}>
          {label}
        </Typography>
        {isActive ? (
          currentSortDirection === 'asc' ? 
            <ArrowUpwardIcon fontSize="small" color="primary" /> : 
            <ArrowDownwardIcon fontSize="small" color="primary" />
        ) : (
          <Box sx={{ width: 20, height: 20 }} />
        )}
      </Box>
    </TableCell>
  );
};

// 可拖曳的表格行組件
const SortableTableRow = ({ category, index, onEdit, onDelete, onToggleActive }: {
  category: CourseCategory;
  index: number;
  onEdit: (category: CourseCategory) => void;
  onDelete: (category: CourseCategory) => void;
  onToggleActive: (category: CourseCategory) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? 'action.hover' : 'inherit',
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      hover
      sx={{
        '&:hover': {
          backgroundColor: isDragging ? 'action.hover' : 'action.hover'
        }
      }}
    >
      <TableCell>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' }
          }}
        >
          <DragIndicatorIcon color="action" />
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {category.category_name}
      </TableCell>
      <TableCell sx={{ width: '12%' }}>
        <Chip 
          label={category.category_code} 
          size="small" 
          variant="outlined"
        />
      </TableCell>
      <TableCell sx={{ width: '300px', paddingLeft: '30px' }}>
        <Box
          sx={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2em',
            maxHeight: '2.4em'
          }}
        >
          {category.description || '-'}
        </Box>
      </TableCell>
      <TableCell align="center">{category.sort_order}</TableCell>
      <TableCell align="center">
        <Chip 
          label={category.course_count} 
          size="small"
          color={category.course_count > 0 ? 'primary' : 'default'}
        />
      </TableCell>
      <TableCell align="center">
        <Chip 
          label={category.teacher_count} 
          size="small"
          color={category.teacher_count > 0 ? 'secondary' : 'default'}
        />
      </TableCell>
      <TableCell align="center">
        <Chip 
          label={category.student_count} 
          size="small"
          color={category.student_count > 0 ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell align="center">
        <IconButton
          onClick={() => onToggleActive(category)}
          color={category.is_active ? 'success' : 'default'}
        >
          {category.is_active ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
      </TableCell>
      <TableCell align="center">
        <IconButton
          onClick={() => onEdit(category)}
          color="primary"
          size="small"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={() => onDelete(category)}
          color="error"
          size="small"
          disabled={category.teacher_count > 0 || category.course_count > 0}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const CourseCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [formData, setFormData] = useState<FormData>({
    category_name: '',
    description: '',
    sort_order: 0,
    is_active: true
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CourseCategory | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sortField, setSortField] = useState<string>('sort_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 載入課程分類
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/course-categories');
      if (!response.ok) throw new Error('載入課程分類失敗');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('載入課程分類錯誤:', error);
      setSnackbar({
        open: true,
        message: '載入課程分類失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 排序函數
  const handleSort = (field: string) => {
    console.log('排序欄位:', field, '當前資料:', categories);
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序資料
  const sortedCategories = [...categories].sort((a, b) => {
    let aValue: any = a[sortField as keyof CourseCategory];
    let bValue: any = b[sortField as keyof CourseCategory];

    // 調試資訊
    console.log('排序比較:', {
      field: sortField,
      aValue: aValue,
      bValue: bValue,
      aType: typeof aValue,
      bType: typeof bValue
    });

    // 處理 null 或 undefined 值
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // 處理字串比較
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    // 處理數字比較
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // 處理布林值比較
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc' ? 
        (aValue === bValue ? 0 : aValue ? 1 : -1) : 
        (aValue === bValue ? 0 : aValue ? -1 : 1);
    }

    // 處理字串比較
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // 開啟新增/編輯對話框
  const handleOpenDialog = (category?: CourseCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category_name: category.category_name,
        description: category.description || '',
        sort_order: category.sort_order,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        category_name: '',
        description: '',
        sort_order: 0,
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      category_name: '',
      description: '',
      sort_order: 0,
      is_active: true
    });
  };

  // 儲存課程分類
  const handleSaveCategory = async () => {
    if (!formData.category_name.trim()) {
      setSnackbar({
        open: true,
        message: '請輸入課程分類名稱',
        severity: 'warning'
      });
      return;
    }

    try {
      const url = editingCategory 
        ? `/api/course-categories/${editingCategory.id}`
        : '/api/course-categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

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
        message: editingCategory ? '課程分類更新成功' : '課程分類新增成功',
        severity: 'success'
      });

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('儲存課程分類失敗:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '儲存失敗',
        severity: 'error'
      });
    }
  };

  // 刪除課程分類
  const handleDeleteCategory = (category: CourseCategory) => {
    if (category.teacher_count > 0 || category.course_count > 0) {
      setSnackbar({
        open: true,
        message: '此課程分類已被使用，無法刪除',
        severity: 'warning'
      });
      return;
    }

    setCategoryToDelete(category);
    setShowPasswordModal(true);
    setPasswordError('');
    setAdminPassword('');
  };

  const verifyPasswordAndDelete = async () => {
    if (!categoryToDelete || !adminPassword) {
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
      const deleteResponse = await fetch(`/api/course-categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) throw new Error('刪除失敗');

      setSnackbar({
        open: true,
        message: '課程分類刪除成功',
        severity: 'success'
      });

      setShowPasswordModal(false);
      setCategoryToDelete(null);
      setAdminPassword('');
      fetchCategories();
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCategoryToDelete(null);
    setAdminPassword('');
    setPasswordError('');
  };

  // 切換啟用狀態
  const handleToggleActive = async (category: CourseCategory) => {
    try {
      const response = await fetch(`/api/course-categories/${category.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !category.is_active })
      });

      if (!response.ok) throw new Error('更新失敗');

      setSnackbar({
        open: true,
        message: category.is_active ? '課程分類已停用' : '課程分類已啟用',
        severity: 'success'
      });

      fetchCategories();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '更新失敗',
        severity: 'error'
      });
    }
  };

  // 處理拖曳結束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex(item => item.id.toString() === active.id);
        const newIndex = items.findIndex(item => item.id.toString() === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // 重新計算排序值（每10個為一組）
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: (index + 1) * 10
        }));

        // 非同步更新資料庫
        updateDatabaseOrder(updatedItems);

        return updatedItems;
      });
    }
  };

  // 更新資料庫排序
  const updateDatabaseOrder = async (updatedItems: CourseCategory[]) => {
    try {
      // 批次更新資料庫排序值
      const updatePromises = updatedItems.map(item =>
        fetch(`/api/course-categories/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_name: item.category_name,
            description: item.description,
            sort_order: item.sort_order,
            is_active: item.is_active
          })
        })
      );

      await Promise.all(updatePromises);

      setSnackbar({
        open: true,
        message: '排序更新成功',
        severity: 'success'
      });
    } catch (error) {
      console.error('更新排序失敗:', error);
      setSnackbar({
        open: true,
        message: '排序更新失敗',
        severity: 'error'
      });
      // 重新載入資料以恢復原始順序
      fetchCategories();
    }
  };

  return (
    <>
      {/* 背景容器 - 確保背景延伸到內容高度 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
            課程分類管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            新增課程分類
          </Button>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell>
                    <SortableTableHeader
                      field="category_name"
                      label="分類名稱"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="11%"
                    />
                    <SortableTableHeader
                      field="category_code"
                      label="分類代碼"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="8%"
                    />
                    <SortableTableHeader
                      field="description"
                      label="描述"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="33%"
                      sx={{ paddingLeft: '30px' }}
                    />
                    <SortableTableHeader
                      field="sort_order"
                      label="排序"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="6%"
                      align="center"
                    />
                    <SortableTableHeader
                      field="course_count"
                      label="課程數量"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="8%"
                      align="center"
                    />
                    <SortableTableHeader
                      field="teacher_count"
                      label="師資數量"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="8%"
                      align="center"
                    />
                    <SortableTableHeader
                      field="student_count"
                      label="學生數量"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="8%"
                      align="center"
                    />
                    <SortableTableHeader
                      field="is_active"
                      label="狀態"
                      currentSortField={sortField}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                      width="6%"
                      align="center"
                    />
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <SortableContext
                    items={sortedCategories.map(cat => cat.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedCategories.map((category, index) => (
                      <SortableTableRow
                        key={category.id}
                        category={category}
                        index={index}
                        onEdit={handleOpenDialog}
                        onDelete={handleDeleteCategory}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </TableContainer>
          </DndContext>
        </Paper>

        {/* 新增/編輯對話框 */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCategory ? '編輯課程分類' : '新增課程分類'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="課程分類名稱"
              fullWidth
              variant="outlined"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="描述"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="排序"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="啟用"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>取消</Button>
            <Button onClick={handleSaveCategory} variant="contained">
              {editingCategory ? '更新' : '新增'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 管理員密碼驗證模態框 */}
        <Dialog open={showPasswordModal} onClose={closePasswordModal} maxWidth="sm" fullWidth>
          <DialogTitle>管理員密碼驗證</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ⚠️ 您即將刪除課程分類：<strong>{categoryToDelete?.category_name}</strong>
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

        {/* 訊息提示 */}
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
      </Container>
    </>
  );
};

export default CourseCategoriesPage; 