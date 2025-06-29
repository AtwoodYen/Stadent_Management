/* ---------------------------  
   SchedulePage 家教排課系統  
   ---------------------------
   主要功能：
   1. 月／週／日檢視
   2. 點擊日期開啟對話框新增課程
   3. 課程資料保存在本地 state
-------------------------------- */

import React, { useState, useEffect } from 'react';
import '../styles/tutoring.css';          // 內含 .calendar-section 與 .full-width
import {
  Box,
  Button,
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
  ToggleButtonGroup
} from '@mui/material';

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
  addMinutes
} from 'date-fns';

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
  /* ---------------- 資料狀態 ---------------- */
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

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

  /* ---------- 統計計算 ---------- */
  const lessonsThisWeek = lessons.filter(l => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return l.date >= start && l.date <= end;
  }).length;

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
  const handleAddLesson = async () => {
    if (!selectedDate || !selectedStudent || !selectedTime) return;

    const endTime = (() => {
      const [hh, mm] = selectedTime.split(':').map(Number);
      const dateObj = new Date(selectedDate);
      dateObj.setHours(hh, mm, 0, 0);
      return format(addMinutes(dateObj, 90), 'HH:mm');
    })();

    const lessonData = {
      student_id: Number(selectedStudent),
      lesson_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      end_time: endTime,
      subject: topic,
      status: 'scheduled'
    };

    try {
      const response = await fetch('http://localhost:3000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });

      if (response.ok) {
        const newSchedule = await response.json();
        const newLesson: Lesson = {
          id: newSchedule.id,
          studentId: newSchedule.student_id,
          date: new Date(newSchedule.lesson_date),
          startTime: newSchedule.start_time,
          endTime: newSchedule.end_time,
          topic: newSchedule.subject,
          status: newSchedule.status
        };
        
        setLessons(prev => [...prev, newLesson]);
        handleCloseDialog();
      } else {
        console.error('新增課程失敗');
      }
    } catch (error) {
      console.error('新增課程錯誤:', error);
    }
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

  /* ---------- API 資料載入 ---------- */
  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/students');
      if (response.ok) {
        const data = await response.json();
        // 轉換資料格式以符合現有介面
        const formattedStudents = data.map((student: any) => ({
          id: student.id,
          name: student.name,
          level: student.level || '初級'
        }));
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error('載入學生資料失敗:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/schedules/calendar');
      if (response.ok) {
        const data = await response.json();
        // 轉換資料格式以符合現有介面
        const formattedLessons = data.map((schedule: any) => ({
          id: schedule.id,
          studentId: schedule.student_id,
          date: new Date(schedule.lesson_date),
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          topic: schedule.subject || '課程',
          status: schedule.status || 'scheduled'
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('載入課程資料失敗:', error);
    }
  };

  // 初始載入資料
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchLessons()]);
      setLoading(false);
    };
    loadData();
  }, []);

  
  /* ---------- 月視圖 ---------- */
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: React.ReactElement[] = [];
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
    const startDate = startOfWeek(currentDate);
    return (
      <div className='week-view'>
        {Array.from({ length: 7 }, (_, i) => {
          const currentDay = addDays(startDate, i);
          return (
            <div key={i} className='day'>
              <div className='day-header'>
                {format(currentDay, 'M/d (E)')}
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
  if (loading) {
    return (
      <div className='schedule-container' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>載入中...</div>
      </div>
    );
  }

  return (
    <div className='schedule-container'>
      <div className='main-content'>
        {/* ------------------ 側邊欄 ------------------ */}
        <div className='sidebar'>
          <div className='stats-bar'>
            <div className='stat-item'>
              <div className='stat-number'>{students.length}</div>
              <div className='stat-label'>學生</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>0</div>
              <div className='stat-label'>畢業生</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>{lessonsThisWeek}</div>
              <div className='stat-label'>本週課程</div>
            </div>
          </div>

          <div className='student-list'>
            <h3>📋 學生管理</h3>
            {students.map(s => (
              <div key={s.id} className='student-item'>
                <div className='student-item-details'>
                  <div className='student-name'>{s.name}</div>
                  <div className='student-info'>{s.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------ 主日曆區 ------------------ */}
        <div className='calendar-section'>
          <div className='calendar-header'>
            
            <div className='calendar-nav'>
              <button className='btn' onClick={handlePrevious}>‹ 上一頁</button>
              <div style={{ margin: '0 10px', fontWeight: 'bold' }}>
                {format(currentDate, view === 'month' ? 'yyyy 年 M 月' : 'yyyy 年 M 月 d 日')}
              </div>
              <button className='btn' onClick={handleNext}>下一頁 ›</button>
            </div>

            <div className='calendar-controls'>
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
              <button className='btn btn-secondary' style={{ marginLeft: 10 }} onClick={handleToday}>今天</button>
            </div>
            
          </div>

          {/* 日曆 */}
          <div>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </div>
        </div>
      </div>

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
    </div>
  );
}
