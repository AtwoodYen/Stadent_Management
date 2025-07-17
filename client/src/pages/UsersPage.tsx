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
  TableSortLabel,
  Chip,
  Avatar,
  IconButton,
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
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'teacher' | 'user';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  department?: string;
  login_count?: number;
  email_verified?: boolean;
  sort_order?: number;
}

// 排序類型定義
type SortField = 'full_name' | 'role' | 'department' | 'is_active' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

// 可拖拽的表格行組件
const SortableTableRow: React.FC<{
  user: User;
  roleLabels: Record<string, string>;
  roleColors: Record<string, any>;
  roleIcons: Record<string, React.ReactElement>;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (id: number) => void;
  isDragMode: boolean;
}> = ({ user, roleLabels, roleColors, roleIcons, onEdit, onDelete, onToggleStatus, isDragMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (user.is_active ? 1 : 0.6),
    height: '48px',
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell>
        {isDragMode && (
          <IconButton
            size="small"
            {...listeners}
            sx={{ cursor: 'grab', p: 0.5 }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {roleIcons[user.role]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{user.username}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={roleLabels[user.role]}
          color={roleColors[user.role]}
          size="small"
          icon={roleIcons[user.role]}
        />
      </TableCell>
      <TableCell>{user.department || '-'}</TableCell>
      <TableCell>
        <Typography variant="body2">{user.email}</Typography>
        <Typography variant="caption" color="text.secondary">
          {user.phone || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <FormControlLabel
          control={
            <Switch
              checked={user.is_active}
              onChange={() => onToggleStatus(user.id)}
              size="small"
            />
          }
          label={user.is_active ? "啟用" : "停用"}
        />
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          onClick={() => onEdit(user)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDelete(user)}
          disabled={user.role === 'admin' && user.id === 1}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 排序狀態
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    order: 'asc'
  });

  // 模式切換狀態
  const [isDragMode, setIsDragMode] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'user' as User['role'],
    phone: '',
    department: '',
    is_active: true,
    password: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 拖拽相關設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 載入用戶資料
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('載入用戶資料失敗');
      }
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入用戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 排序處理函數
  const handleSort = (field: SortField) => {
    setIsDragMode(false); // 排序時退出拖拽模式
    setSortState(prevState => ({
      field,
      order: prevState.field === field && prevState.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 排序函數
  const sortUsers = (users: User[]) => {
    if (!sortState.field) return users;

    return [...users].sort((a, b) => {
      let aValue: any = a[sortState.field!];
      let bValue: any = b[sortState.field!];

      // 特殊處理不同欄位的排序
      switch (sortState.field) {
        case 'role':
          // 角色排序：admin > manager > teacher > user
          const roleOrder = { 'admin': 4, 'manager': 3, 'teacher': 2, 'user': 1 };
          aValue = roleOrder[aValue as keyof typeof roleOrder] || 0;
          bValue = roleOrder[bValue as keyof typeof roleOrder] || 0;
          break;
        
        case 'is_active':
          // 狀態排序：啟用 > 停用
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
          break;
        
        case 'created_at':
          // 日期排序
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
          break;
        
        case 'department':
          // 部門排序，空值放在最後
          aValue = aValue || 'zzz_no_department';
          bValue = bValue || 'zzz_no_department';
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
          break;
        
        default:
          // 字串排序（姓名等）
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortState.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // 排序後的用戶資料
  const sortedUsers = sortUsers(users);
  
  // 根據模式決定顯示哪個資料
  const displayUsers = isDragMode ? users : sortedUsers;

  // 處理拖拽結束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortState({ field: null, order: 'asc' }); // 拖拽時清除排序
      setIsDragMode(true);
      
      setUsers((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

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

  // 更新資料庫中的排序
  const updateDatabaseOrder = async (updatedUsers: User[]) => {
    try {
      // 這裡可以添加更新資料庫排序的 API 調用
      // 例如：await fetch('/api/users/reorder', { method: 'PUT', body: JSON.stringify(updatedUsers) });
      console.log('用戶排序已更新:', updatedUsers);
    } catch (error) {
      console.error('更新用戶排序失敗:', error);
    }
  };

  const roleLabels = {
    admin: '系統管理員',
    manager: '管理者',
    teacher: '老師',
    user: '一般用戶'
  };

  const roleColors = {
    admin: 'error' as const,
    manager: 'warning' as const,
    teacher: 'primary' as const,
    user: 'default' as const
  };

  const roleIcons = {
    admin: <AdminPanelSettingsIcon />,
    manager: <SupervisorAccountIcon />,
    teacher: <PersonIcon />,
    user: <AccountCircleIcon />
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone || '',
        department: user.department || '',
        is_active: user.is_active,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: 'user',
        phone: '',
        department: '',
        is_active: true,
        password: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        // 更新用戶
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('更新用戶失敗');
        }
        
        const updatedUser = await response.json();
        setUsers(prev => prev.map(user =>
          user.id === editingUser.id ? updatedUser : user
        ));
      } else {
        // 新增用戶
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('新增用戶失敗');
        }
        
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowPasswordModal(true);
    setPasswordError('');
    setAdminPassword('');
  };

  const verifyPasswordAndDelete = async () => {
    if (!userToDelete || !adminPassword) {
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
      const deleteResponse = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!deleteResponse.ok) {
        throw new Error('刪除用戶失敗');
      }
      
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setShowPasswordModal(false);
      setUserToDelete(null);
      setAdminPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setUserToDelete(null);
    setAdminPassword('');
    setPasswordError('');
  };

  const toggleUserStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('切換用戶狀態失敗');
      }
      
      const updatedUser = await response.json();
      setUsers(prev => prev.map(user =>
        user.id === id ? updatedUser : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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

      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
              用戶管理
            </Typography>
            <Typography variant="h6" sx={{ color: '#ccc' }}>
              總用戶數：{users.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              {isDragMode ? '拖拽模式' : '排序模式'}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant={isDragMode ? "contained" : "outlined"}
              onClick={() => setIsDragMode(!isDragMode)}
              sx={{ 
                backgroundColor: isDragMode ? 'primary.main' : 'transparent',
                color: isDragMode ? 'white' : 'primary.main'
              }}
            >
              {isDragMode ? '退出拖拽' : '拖拽排序'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              新增用戶
            </Button>
          </Box>
        </Box>

        <DndContext
          sensors={isDragMode ? sensors : []}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <TableContainer component={Paper}>
            <Table sx={{ '& .MuiTableCell-root': { padding: '8px 16px' } }}>
              <TableHead>
                <TableRow sx={{ height: '48px' }}>
                  {isDragMode && <TableCell>拖拽</TableCell>}
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'full_name'}
                      direction={sortState.field === 'full_name' ? sortState.order : 'asc'}
                      onClick={() => !isDragMode && handleSort('full_name')}
                      disabled={isDragMode}
                    >
                      用戶名稱
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'role'}
                      direction={sortState.field === 'role' ? sortState.order : 'asc'}
                      onClick={() => !isDragMode && handleSort('role')}
                      disabled={isDragMode}
                    >
                      角色
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'department'}
                      direction={sortState.field === 'department' ? sortState.order : 'asc'}
                      onClick={() => !isDragMode && handleSort('department')}
                      disabled={isDragMode}
                    >
                      部門
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>聯絡方式</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'is_active'}
                      direction={sortState.field === 'is_active' ? sortState.order : 'asc'}
                      onClick={() => !isDragMode && handleSort('is_active')}
                      disabled={isDragMode}
                    >
                      狀態
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <SortableContext items={displayUsers.map(user => user.id)} strategy={verticalListSortingStrategy}>
                  {displayUsers.map((user) => (
                    <SortableTableRow
                      key={user.id}
                      user={user}
                      roleLabels={roleLabels}
                      roleColors={roleColors}
                      roleIcons={roleIcons}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                      onToggleStatus={toggleUserStatus}
                      isDragMode={isDragMode}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </TableContainer>
        </DndContext>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingUser ? '編輯用戶資料' : '新增用戶'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="用戶名稱"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="帳號"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  margin="normal"
                />
              </Box>

              <TextField
                fullWidth
                label="電子郵件"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />

              {!editingUser && (
                <TextField
                  fullWidth
                  label="密碼"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  margin="normal"
                  required
                />
              )}

              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="電話"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="部門"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  margin="normal"
                />
              </Box>

              <FormControl fullWidth margin="normal">
                <InputLabel>角色</InputLabel>
                <Select
                  value={formData.role}
                  label="角色"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                >
                  <MenuItem value="user">一般用戶</MenuItem>
                  <MenuItem value="teacher">老師</MenuItem>
                  <MenuItem value="manager">管理者</MenuItem>
                  <MenuItem value="admin">系統管理員</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="啟用帳號"
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>取消</Button>
            <Button 
              onClick={handleSave} 
              variant="contained"
              disabled={!formData.username || !formData.email || !formData.full_name || (!editingUser && !formData.password)}
            >
              {editingUser ? '更新' : '新增'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 管理員密碼驗證模態框 */}
        <Dialog open={showPasswordModal} onClose={closePasswordModal} maxWidth="sm" fullWidth>
          <DialogTitle>管理員密碼驗證</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ⚠️ 您即將刪除用戶：<strong>{userToDelete?.full_name}</strong>
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
    </>
  );
};

export default UsersPage; 