/* ---------------------------  
   SchedulePage 家教排課系統  
   ---------------------------
   主要功能：
   1. 月／週／日檢視
   2. 點擊日期開啟對話框新增課程
   3. 課程資料保存在本地 state
-------------------------------- */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';

/* date-fns 工具 */
import {
  format,
  isSameDay,
  isToday,
  addDays,
  addWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  parse,
  addMinutes
} from 'date-fns';
import { zhTW } from 'date-fns/locale/zh-TW';

/* ---------- 型別定義 ---------- */
type ViewType = 'month' | 'week' | 'day';

interface Student {
  id: number;
  name: string;
  level: string;
}

interface Lesson {
  id: number;
  studentId: number;
  date: Date;
  startTime: string;
  endTime: string;
  topic: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

/* ---------- 主元件 ---------- */
export default function SchedulePage() {
  /* ---------------- 學生清單 ---------------- */
  const [students] = useState<Student[]>([
    { id: 1, name: '張小明', level: '初級' },
    { id: 2, name: '王大同', level: '中級' },
    { id: 3, name: '李小花', level: '高級' },
    { id: 4, name: '林小華', level: '初級' },
    { id: 5, name: '陳大明', level: '中級' }
  ]);

  /* ---------------- 課程清單 ---------------- */
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 1,
      studentId: 1,
      date: addDays(new Date(), 1),
      startTime: '14:00',
      endTime: '15:30',
      topic: 'React 基礎教學',
      status: 'scheduled'
    },
    {
      id: 2,
      studentId: 2,
      date: addDays(new Date(), 2),
      startTime: '10:00',
      endTime: '11:30',
      topic: '進階 React',
      status: 'scheduled'
    }
  ]);

  /* ---------------- UI 狀態 ---------------- */
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>('day');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [selectedTime, setSelectedTime] = useState('');
  const [topic, setTopic] = useState('');

  /* ---------- 時段表：08:00 ~ 21:30, 每 30 分 ---------- */
  const timeSlots = React.useMemo(() => {
    const base = new Date();          // 只取時間部分
    base.setHours(8, 0, 0, 0);
    return Array.from({ length: 28 }, (_, i) =>
      format(addMinutes(base, i * 30), 'HH:mm')
    );
  }, []);

  /* ---------- 工具函式 ---------- */
  const getLessonsForDate = (date: Date) =>
    lessons.filter(l => isSameDay(l.date, date));

  const getLessonsForTimeSlot = (date: Date, time: string) =>
    lessons.filter(
      l => isSameDay(l.date, date) && l.startTime === time
    );

  const getStudentName = (id: number) =>
    students.find(s => s.id === id)?.name ?? '未知學生';

  /* ---------- 對話框開關 ---------- */
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate(null);
    setSelectedStudent('');
    setSelectedTime('');
    setTopic('');
  };

  /* ---------- 新增課程 ---------- */
  const handleAddLesson = () => {
    if (!selectedDate || !selectedStudent || !selectedTime) return;

    const newLesson: Lesson = {
      id: lessons.length + 1,
      studentId: Number(selectedStudent),
      date: selectedDate,
      startTime: selectedTime,
      endTime: format(
        addMinutes(parse(selectedTime, 'HH:mm', selectedDate), 90),
        'HH:mm'
      ),
      topic,
      status: 'scheduled'
    };

    setLessons(prev => [...prev, newLesson]);
    handleCloseDialog();
  };

  /* ---------- 檢視切換 ---------- */
  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewType
  ) => {
    if (newView) setView(newView);
  };

  /* ---------- 日期移動 ---------- */
  const handlePrevious = () => {
    setCurrentDate(prev =>
      view === 'week'
        ? addWeeks(prev, -1)
        : view === 'month'
        ? subMonths(prev, 1)
        : addDays(prev, -1)
    );
  };

  const handleNext = () => {
    setCurrentDate(prev =>
      view === 'week'
        ? addWeeks(prev, 1)
        : view === 'month'
        ? addMonths(prev, 1)
        : addDays(prev, 1)
    );
  };

  const handleToday = () => setCurrentDate(new Date());

  /* ---------- 月視圖 ---------- */
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: JSX.Element[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(
        <div
          key={day.toISOString()}
          className={`day ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${
            isToday(day) ? 'today' : ''
          }`}
          onClick={() => handleDateClick(day)}
        >
          <span className='date'>{format(day, 'd')}</span>
          {getLessonsForDate(day).map(lesson => (
            <div key={lesson.id} className='lesson'>
              {lesson.topic}
            </div>
          ))}
        </div>
      );
      day = addDays(day, 1);
    }

    return (
      <div className='month-view'>
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className='day-header'>
            {d}
          </div>
        ))}
        {days}
      </div>
    );
  };

  /* ---------- 週視圖 ---------- */
  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    return (
      <div className='week-view'>
        {Array.from({ length: 7 }, (_, i) => {
          const currentDay = addDays(startDate, i);
          return (
            <div key={i} className='day'>
              <div className='day-header'>
                {format(currentDay, 'M/d (E)', { locale: zhTW })}
              </div>
              <div className='time-slots'>
                {timeSlots.map(time => (
                  <div key={time} className='time-slot'>
                    <div className='time'>{time}</div>
                    <div className='lessons'>
                      {getLessonsForTimeSlot(currentDay, time).map(l => (
                        <div key={l.id} className='lesson'>
                          {getStudentName(l.studentId)}：{l.topic}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------- 日視圖 ---------- */
  const renderDayView = () => (
    <div className='day-view'>
      <div className='time-slots'>
        {timeSlots.map(time => (
          <div key={time} className='time-slot'>
            <div className='time'>{time}</div>
            <div className='lessons'>
              {getLessonsForTimeSlot(currentDate, time).map(l => (
                <div key={l.id} className='lesson'>
                  <div className='student-name'>{getStudentName(l.studentId)}</div>
                  <div className='lesson-topic'>{l.topic}</div>
                  <div className='lesson-time'>
                    {l.startTime} - {l.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------- 畫面 ---------- */
  return (
    <Box sx={{ p: 3 }}>
      {/* -------------- 工具列 -------------- */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <ToggleButtonGroup
          color='primary'
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label='schedule view'
        >
          <ToggleButton value='month'>月</ToggleButton>
          <ToggleButton value='week'>週</ToggleButton>
          <ToggleButton value='day'>日</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton aria-label='previous' size='small' onClick={handlePrevious}>
            ‹
          </IconButton>
          <Typography variant='h6'>
            {format(currentDate, 'yyyy年M月d日 (E)', { locale: zhTW })}
          </Typography>
          <IconButton aria-label='next' size='small' onClick={handleNext}>
            ›
          </IconButton>
          <Button variant='outlined' onClick={handleToday} startIcon={<TodayIcon />}>
            今天
          </Button>
        </Box>
      </Box>

      {/* -------------- 主體 -------------- */}
      <Paper sx={{ p: 2, minHeight: '70vh' }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </Paper>

      {/* -------------- 新增課程 Dialog -------------- */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>新增課程</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin='normal'
              label='主題'
              fullWidth
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
            <FormControl fullWidth margin='normal'>
              <InputLabel>學生</InputLabel>
              <Select
                value={selectedStudent}
                label='學生'
                onChange={e => setSelectedStudent(e.target.value as number)}
              >
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}（{s.level}）
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin='normal'
              label='時間'
              type='time'
              fullWidth
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            variant='contained'
            onClick={handleAddLesson}
            disabled={!topic || !selectedStudent || !selectedTime}
          >
            新增課程
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
