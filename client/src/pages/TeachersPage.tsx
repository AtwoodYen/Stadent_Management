import React, { useState } from 'react';
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
  FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          師資管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增老師
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={3}>
        {teachers.map((teacher) => (
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