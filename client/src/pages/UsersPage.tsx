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
  FormControlLabel
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
  fullName: string;
  role: 'admin' | 'manager' | 'teacher' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  department?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      fullName: '系統管理員',
      role: 'admin',
      isActive: true,
      lastLogin: '2025-01-28 09:30:00',
      createdAt: '2024-01-01 00:00:00',
      phone: '0912-345-678',
      department: '資訊部'
    },
    {
      id: 2,
      username: 'manager01',
      email: 'manager@example.com',
      fullName: '教務主任',
      role: 'manager',
      isActive: true,
      lastLogin: '2025-01-27 18:45:00',
      createdAt: '2024-02-15 10:30:00',
      phone: '0923-456-789',
      department: '教務處'
    },
    {
      id: 3,
      username: 'teacher_gang',
      email: 'gang@example.com',
      fullName: '小剛老師',
      role: 'teacher',
      isActive: true,
      lastLogin: '2025-01-28 08:15:00',
      createdAt: '2024-03-01 14:20:00',
      phone: '0934-567-890',
      department: '程式設計科'
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'user' as User['role'],
    phone: '',
    department: '',
    isActive: true
  });

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
        fullName: user.fullName,
        role: user.role,
        phone: user.phone || '',
        department: user.department || '',
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: 'user',
        phone: '',
        department: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      ));
    } else {
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        ...formData,
        lastLogin: undefined,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setUsers(prev => [...prev, newUser]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除此用戶嗎？')) {
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  const toggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(user =>
      user.id === id
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  return (
    <Box>
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
              <TableRow key={user.id} sx={{ opacity: user.isActive ? 1 : 0.6 }}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {roleIcons[user.role]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.fullName}
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
                        checked={user.isActive}
                        onChange={() => toggleUserStatus(user.id)}
                        size="small"
                      />
                    }
                    label={user.isActive ? "啟用" : "停用"}
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
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
            disabled={!formData.fullName || !formData.username || !formData.email}
          >
            {editingUser ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage; 