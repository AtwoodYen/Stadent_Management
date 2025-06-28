import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
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
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  availableDays: string[];
  hourlyRate: number;
  experience: number; // 年
  bio: string;
  isActive: boolean;
  avatar?: string;
}

interface TeacherCourse {
  teacherId: number;
  courseCategory: string;
  maxLevel: string;
  isPreferred: boolean;
}

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: 1,
      name: '小剛老師',
      email: 'gang@example.com',
      phone: '0912-345-678',
      specialties: ['Python', 'Web開發', '演算法'],
      availableDays: ['週一', '週二', '週三', '週四', '週五'],
      hourlyRate: 1500,
      experience: 5,
      bio: '資深軟體工程師，專精於 Python 和 Web 開發，有豐富的教學經驗。',
      isActive: true
    },
    {
      id: 2,
      name: '小美老師',
      email: 'mei@example.com',
      phone: '0923-456-789',
      specialties: ['JavaScript', 'React', 'Node.js'],
      availableDays: ['週二', '週四', '週六', '週日'],
      hourlyRate: 1400,
      experience: 3,
      bio: '前端開發專家，熟悉現代 JavaScript 框架，善於引導學生理解複雜概念。',
      isActive: true
    },
    {
      id: 3,
      name: '阿明老師',
      email: 'ming@example.com',
      phone: '0934-567-890',
      specialties: ['資料科學', '機器學習', 'Python'],
      availableDays: ['週三', '週五', '週六'],
      hourlyRate: 1800,
      experience: 7,
      bio: '資料科學博士，在機器學習領域有深厚造詣，教學風格嚴謹細緻。',
      isActive: false
    },
    {
      id: 4,
      name: '王老師',
      email: 'wang@example.com',
      phone: '0945-678-901',
      specialties: ['Java', 'Spring Boot', '資料庫設計'],
      availableDays: ['週一', '週三', '週五', '週日'],
      hourlyRate: 1600,
      experience: 6,
      bio: '後端開發專家，專精於 Java 企業級應用開發，有豐富的系統架構經驗。',
      isActive: true
    },
    {
      id: 5,
      name: '李老師',
      email: 'li@example.com',
      phone: '0956-789-012',
      specialties: ['UI/UX設計', 'Figma', 'Adobe Creative Suite'],
      availableDays: ['週二', '週四', '週六'],
      hourlyRate: 1300,
      experience: 4,
      bio: '視覺設計師，擅長使用者體驗設計，能夠將複雜的設計概念簡化教學。',
      isActive: true
    },
    {
      id: 6,
      name: '陳老師',
      email: 'chen@example.com',
      phone: '0967-890-123',
      specialties: ['C++', '遊戲開發', 'Unity'],
      availableDays: ['週一', '週二', '週五', '週六'],
      hourlyRate: 1700,
      experience: 8,
      bio: '遊戲開發資深工程師，專精於 C++ 和 Unity 引擎，教學風格生動有趣。',
      isActive: true
    },
    {
      id: 7,
      name: '張老師',
      email: 'zhang@example.com',
      phone: '0978-901-234',
      specialties: ['DevOps', 'Docker', 'Kubernetes', 'AWS'],
      availableDays: ['週三', '週四', '週日'],
      hourlyRate: 2000,
      experience: 9,
      bio: 'DevOps 專家，在雲端部署和容器化技術方面有豐富經驗，注重實戰教學。',
      isActive: true
    },
    {
      id: 8,
      name: '林老師',
      email: 'lin@example.com',
      phone: '0989-012-345',
      specialties: ['iOS開發', 'Swift', 'SwiftUI'],
      availableDays: ['週一', '週四', '週六', '週日'],
      hourlyRate: 1550,
      experience: 5,
      bio: 'iOS 開發專家，熟悉 Swift 和 SwiftUI，曾參與多個上架 App 的開發。',
      isActive: true
    }
  ]);

  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([
    { teacherId: 1, courseCategory: 'Python', maxLevel: '高級', isPreferred: true },
    { teacherId: 1, courseCategory: 'Web開發', maxLevel: '中級', isPreferred: true },
    { teacherId: 1, courseCategory: '演算法', maxLevel: '中級', isPreferred: false },
    { teacherId: 2, courseCategory: 'JavaScript', maxLevel: '高級', isPreferred: true },
    { teacherId: 2, courseCategory: 'Web開發', maxLevel: '高級', isPreferred: true },
    { teacherId: 3, courseCategory: '資料科學', maxLevel: '高級', isPreferred: true },
    { teacherId: 3, courseCategory: '機器學習', maxLevel: '高級', isPreferred: true },
    { teacherId: 4, courseCategory: 'Java', maxLevel: '高級', isPreferred: true },
    { teacherId: 4, courseCategory: '資料庫設計', maxLevel: '高級', isPreferred: true },
    { teacherId: 4, courseCategory: 'Web開發', maxLevel: '中級', isPreferred: false },
    { teacherId: 5, courseCategory: 'UI/UX設計', maxLevel: '高級', isPreferred: true },
    { teacherId: 5, courseCategory: '平面設計', maxLevel: '中級', isPreferred: false },
    { teacherId: 6, courseCategory: 'C++', maxLevel: '高級', isPreferred: true },
    { teacherId: 6, courseCategory: '遊戲開發', maxLevel: '高級', isPreferred: true },
    { teacherId: 6, courseCategory: '演算法', maxLevel: '中級', isPreferred: false },
    { teacherId: 7, courseCategory: 'DevOps', maxLevel: '高級', isPreferred: true },
    { teacherId: 7, courseCategory: '雲端技術', maxLevel: '高級', isPreferred: true },
    { teacherId: 7, courseCategory: 'Linux', maxLevel: '中級', isPreferred: false },
    { teacherId: 8, courseCategory: 'iOS開發', maxLevel: '高級', isPreferred: true },
    { teacherId: 8, courseCategory: 'Swift', maxLevel: '高級', isPreferred: true },
    { teacherId: 8, courseCategory: '移動應用開發', maxLevel: '中級', isPreferred: false },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
    availableDays: [] as string[],
    hourlyRate: 1200,
    experience: 0,
    bio: '',
    isActive: true
  });

  // 新增篩選和搜尋功能
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'experience' | 'hourlyRate'>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const allDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const allSpecialties = ['Python', 'JavaScript', 'Web開發', '演算法', '資料科學', '機器學習'];

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        specialties: teacher.specialties.join(', '),
        availableDays: teacher.availableDays,
        hourlyRate: teacher.hourlyRate,
        experience: teacher.experience,
        bio: teacher.bio,
        isActive: teacher.isActive
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialties: '',
        availableDays: [],
        hourlyRate: 1200,
        experience: 0,
        bio: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
  };

  const handleSave = () => {
    const teacherData = {
      ...formData,
      specialties: formData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    };

    if (editingTeacher) {
      setTeachers(prev => prev.map(teacher =>
        teacher.id === editingTeacher.id
          ? { ...teacher, ...teacherData }
          : teacher
      ));
    } else {
      const newTeacher: Teacher = {
        id: Math.max(...teachers.map(t => t.id)) + 1,
        ...teacherData
      };
      setTeachers(prev => [...prev, newTeacher]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除此老師嗎？')) {
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      setTeacherCourses(prev => prev.filter(tc => tc.teacherId !== id));
    }
  };

  const toggleTeacherStatus = (id: number) => {
    setTeachers(prev => prev.map(teacher =>
      teacher.id === id
        ? { ...teacher, isActive: !teacher.isActive }
        : teacher
    ));
  };

  const getTeacherCourses = (teacherId: number) => {
    return teacherCourses.filter(tc => tc.teacherId === teacherId);
  };

  // 篩選和排序邏輯
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter(teacher => {
      // 搜尋篩選
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 狀態篩選
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && teacher.isActive) ||
                           (filterStatus === 'inactive' && !teacher.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'experience':
          return b.experience - a.experience;
        case 'hourlyRate':
          return b.hourlyRate - a.hourlyRate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [teachers, searchTerm, filterStatus, sortBy]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            師資管理
          </Typography>
          <Typography variant="h6" sx={{ color: '#ccc' }}>
            目前老師數：{teachers.length} | 顯示：{filteredAndSortedTeachers.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增老師
        </Button>
      </Box>

      {/* 控制面板 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {/* 搜尋框 */}
          <TextField
            size="small"
            placeholder="搜尋老師姓名或專長..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          {/* 狀態篩選 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>狀態</InputLabel>
            <Select
              value={filterStatus}
              label="狀態"
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="active">啟用</MenuItem>
              <MenuItem value="inactive">停用</MenuItem>
            </Select>
          </FormControl>

          {/* 排序選擇 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>排序</InputLabel>
            <Select
              value={sortBy}
              label="排序"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="name">姓名</MenuItem>
              <MenuItem value="experience">經驗</MenuItem>
              <MenuItem value="hourlyRate">時薪</MenuItem>
            </Select>
          </FormControl>

          {/* 視圖切換 */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="cards">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* 內容區域 */}
      {viewMode === 'cards' ? (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={3}>
          {filteredAndSortedTeachers.map((teacher) => (
          <Card key={teacher.id} sx={{ opacity: teacher.isActive ? 1 : 0.6 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} />
                  ) : (
                    <PersonIcon />
                  )}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="h6">
                    {teacher.name}
                    {!teacher.isActive && (
                      <Chip label="停用" size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {teacher.experience} 年經驗 • NT$ {teacher.hourlyRate}/小時
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" paragraph>
                {teacher.bio}
              </Typography>

              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  專長領域：
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {teacher.specialties.map((specialty, index) => (
                    <Chip
                      key={index}
                      label={specialty}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  可授課時間：
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {teacher.availableDays.map((day, index) => (
                    <Chip
                      key={index}
                      label={day}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    可教授課程 ({getTeacherCourses(teacher.id).length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {getTeacherCourses(teacher.id).map((tc, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={tc.courseCategory}
                          secondary={`最高可教授：${tc.maxLevel}`}
                        />
                        <ListItemSecondaryAction>
                          {tc.isPreferred && (
                            <Chip label="主力" size="small" color="success" />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  📧 {teacher.email} • 📱 {teacher.phone}
                </Typography>
              </Box>
            </CardContent>

            <CardActions>
              <FormControlLabel
                control={
                  <Switch
                    checked={teacher.isActive}
                    onChange={() => toggleTeacherStatus(teacher.id)}
                    size="small"
                  />
                }
                label={teacher.isActive ? "啟用" : "停用"}
              />
              <Box flexGrow={1} />
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(teacher)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(teacher.id)}
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
        </Box>
      ) : (
        // 表格視圖
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>專長</TableCell>
                <TableCell>經驗</TableCell>
                <TableCell>時薪</TableCell>
                <TableCell>可授課時間</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTeachers.map((teacher) => (
                <TableRow key={teacher.id} sx={{ opacity: teacher.isActive ? 1 : 0.6 }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} />
                        ) : (
                          <PersonIcon />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {teacher.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {teacher.specialties.slice(0, 2).map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {teacher.specialties.length > 2 && (
                        <Chip
                          label={`+${teacher.specialties.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.experience} 年</TableCell>
                  <TableCell>NT$ {teacher.hourlyRate}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {teacher.availableDays.slice(0, 3).join(', ')}
                      {teacher.availableDays.length > 3 && '...'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={teacher.isActive}
                          onChange={() => toggleTeacherStatus(teacher.id)}
                          size="small"
                        />
                      }
                      label={teacher.isActive ? "啟用" : "停用"}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(teacher)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新增/編輯老師對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTeacher ? '編輯老師資料' : '新增老師'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
            </Box>

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
                label="教學經驗 (年)"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                margin="normal"
              />
            </Box>

            <TextField
              fullWidth
              label="時薪 (NT$)"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="專長領域 (用逗號分隔)"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              margin="normal"
              helperText="例如：Python, JavaScript, Web開發"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>可授課時間</InputLabel>
              <Select
                multiple
                value={formData.availableDays}
                onChange={(e) => setFormData({ ...formData, availableDays: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="個人簡介"
              multiline
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              margin="normal"
            />

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
            disabled={!formData.name || !formData.email}
          >
            {editingTeacher ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeachersPage; 