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
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (id: number) => {
    if (window.confirm('確定要刪除此用戶嗎？')) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('刪除用戶失敗');
        }
        
        setUsers(prev => prev.filter(user => user.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : '刪除失敗');
      }
    }
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
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增用戶
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用戶</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>部門</TableCell>
              <TableCell>聯絡方式</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} sx={{ opacity: user.is_active ? 1 : 0.6 }}>
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
                        onChange={() => toggleUserStatus(user.id)}
                        size="small"
                      />
                    }
                    label={user.is_active ? "啟用" : "停用"}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(user.id)}
                    disabled={user.role === 'admin' && user.id === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
              label="啟用狀態"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.full_name || !formData.username || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage; 