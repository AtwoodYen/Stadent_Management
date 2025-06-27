import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';

// 模擬數據類型
type Student = {
  id: number;
  name: string;
  level: string;
};

type Lesson = {
  id: number;
  studentId: number;
  date: Date;
  startTime: string;
  endTime: string;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number>('');
  const [topic, setTopic] = useState('');
  
  // 模擬數據
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: '張小明', level: '初級' },
    { id: 2, name: '王大同', level: '中級' },
    { id: 3, name: '李小花', level: '高級' },
  ]);
  
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 1,
      studentId: 1,
      date: addDays(new Date(), 1),
      startTime: '14:00',
      endTime: '15:30',
      topic: 'React 基礎教學',
      status: 'scheduled',
    },
    {
      id: 2,
      studentId: 2,
      date: addDays(new Date(), 2),
      startTime: '16:00',
      endTime: '17:30',
      topic: 'TypeScript 進階',
      status: 'scheduled',
    },
  ]);

  // 生成一週的日期
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // 可選的時間段
  const timeSlots = [
    '09:00', '10:30', '14:00', '16:00', '19:00', '20:30'
  ];

  const handlePrevWeek = () => {
    setWeekStart(subWeeks(weekStart, 1));
  };

  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    setCurrentDate(today);
  };

  const handleOpenDialog = (date: Date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedStudent('');
    setTopic('');
  };

  const handleAddLesson = () => {
    if (!selectedDate || !selectedTime || !selectedStudent || !topic) return;
    
    const newLesson: Lesson = {
      id: lessons.length + 1,
      studentId: selectedStudent,
      date: selectedDate,
      startTime: selectedTime,
      endTime: `${String(Number(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:30`,
      topic,
      status: 'scheduled',
    };
    
    setLessons([...lessons, newLesson]);
    handleCloseDialog();
  };

  const getLessonsForDay = (day: Date) => {
    return lessons.filter(lesson => 
      isSameDay(new Date(lesson.date), day)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '未知學生';
  };

  return (
    <Box>
      {/* 日曆標題和導航 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">課表管理</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
          >
            今天
          </Button>
          <IconButton onClick={handlePrevWeek}>
            <ArrowBackIosIcon />
          </IconButton>
          <Typography variant="h6">
            {format(weekStart, 'yyyy年MM月dd日')} - {format(addDays(weekStart, 6), 'yyyy年MM月dd日')}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ArrowForwardIosIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(new Date())}
          >
            新增課程
          </Button>
        </Box>
      </Box>

      {/* 週視圖 */}
      <Grid container spacing={1}>
        {/* 表頭 - 星期 */}
        {weekDays.map((day) => (
          <Grid item xs key={day.toString()}>
            <Paper elevation={1} sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="subtitle2">
                {format(day, 'EEEE', { locale: zhTW })}
              </Typography>
              <Typography
                variant={isSameDay(day, new Date()) ? 'h6' : 'body1'}
                color={isSameDay(day, new Date()) ? 'primary' : 'inherit'}
                sx={{
                  width: 30,
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: isSameDay(day, new Date()) ? 'primary.light' : 'transparent',
                  color: isSameDay(day, new Date()) ? 'primary.contrastText' : 'inherit',
                }}
              >
                {format(day, 'd')}
              </Typography>
            </Paper>
            
            {/* 當天課程 */}
            <Box mt={1}>
              {getLessonsForDay(day).map((lesson) => (
                <Paper 
                  key={lesson.id} 
                  elevation={2} 
                  sx={{ 
                    p: 1, 
                    mb: 1,
                    borderLeft: '4px solid',
                    borderColor: lesson.status === 'completed' ? 'success.main' : 
                                  lesson.status === 'cancelled' ? 'error.main' : 'primary.main',
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    {lesson.startTime}-{lesson.endTime}
                  </Typography>
                  <Typography variant="subtitle2">
                    {getStudentName(lesson.studentId)}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {lesson.topic}
                  </Typography>
                </Paper>
              ))}
              
              <Button 
                fullWidth 
                size="small"
                startIcon={<AddIcon />} 
                onClick={() => handleOpenDialog(day)}
                sx={{ mt: 1 }}
              >
                新增
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* 新增課程對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>新增課程</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="上課日期"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
            
            <FormControl fullWidth>
              <InputLabel id="time-select-label">上課時間</InputLabel>
              <Select
                labelId="time-select-label"
                value={selectedTime}
                label="上課時間"
                onChange={(e: SelectChangeEvent) => setSelectedTime(e.target.value as string)}
              >
                {timeSlots.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="student-select-label">學生</InputLabel>
              <Select
                labelId="student-select-label"
                value={selectedStudent}
                label="學生"
                onChange={(e: SelectChangeEvent<number>) => setSelectedStudent(e.target.value as number)}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} ({student.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="課程主題"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleAddLesson} 
            variant="contained"
            disabled={!selectedDate || !selectedTime || !selectedStudent || !topic}
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchedulePage;
