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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 新增：分頁選單狀態
  const [activeTab, setActiveTab] = useState<'schedule' | 'students' | 'stats'>('schedule');

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // 計算本週課程數
  const lessonsThisWeek = lessons.filter(l => {
    const lessonDate = new Date(l.date);
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return lessonDate >= weekStart && lessonDate <= weekEnd;
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
    setSelectedStudent(0);
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
          level: student.level || '新手'
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

      <div className='schedule-container'>
        <div className='main-content'>
          {/* 分頁選單 */}
          <div className="tab-navigation" style={{
            display: 'flex',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px 8px 0 0',
            overflow: 'hidden'
          }}>
            <button
              className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === 'schedule' ? '#1976d2' : '#f5f5f5',
                color: activeTab === 'schedule' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'schedule' ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                borderRight: '1px solid #e0e0e0'
              }}
            >
              📅 課程排程
            </button>
            <button
              className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === 'students' ? '#1976d2' : '#f5f5f5',
                color: activeTab === 'students' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'students' ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                borderRight: '1px solid #e0e0e0'
              }}
            >
              👥 學生列表
            </button>
            <button
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === 'stats' ? '#1976d2' : '#f5f5f5',
                color: activeTab === 'stats' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'stats' ? 'bold' : 'normal',
                transition: 'all 0.3s ease'
              }}
            >
              📊 統計資料
            </button>
          </div>

          {/* 課程排程區域 */}
          {activeTab === 'schedule' && (
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
          )}

          {/* 學生列表區域 */}
          {activeTab === 'students' && (
            <div className="students-section" style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>👥 學生列表</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {students.map(s => (
                  <div key={s.id} style={{
                    backgroundColor: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{s.name}</h3>
                    <p style={{ margin: '0', color: '#666' }}>程度：{s.level}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 統計資料區域 */}
          {activeTab === 'stats' && (
            <div className="stats-section" style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>📊 統計資料</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #1976d2'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{students.length}</div>
                  <div style={{ color: '#1976d2' }}>總學生數</div>
                </div>
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #388e3c'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>{lessons.length}</div>
                  <div style={{ color: '#388e3c' }}>總課程數</div>
                </div>
                <div style={{
                  backgroundColor: '#fff3e0',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #f57c00'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f57c00' }}>{lessonsThisWeek}</div>
                  <div style={{ color: '#f57c00' }}>本週課程</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新增課程對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>新增課程</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="課程主題"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>學生</InputLabel>
              <Select
                value={selectedStudent}
                label="學生"
                onChange={(e) => setSelectedStudent(Number(e.target.value))}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} ({student.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>開始時間</InputLabel>
              <Select
                value={selectedTime}
                label="開始時間"
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                {timeSlots.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleAddLesson} 
            variant="contained"
            disabled={!selectedStudent || !selectedTime || !topic.trim()}
          >
            新增課程
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
