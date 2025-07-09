/* ---------------------------  
   SchedulePage 家教排課系統  
   ---------------------------
   主要功能：
   1. 月／週／日檢視
   2. 點擊日期開啟對話框新增課程
   3. 課程資料保存在本地 state
-------------------------------- */

import React, { useState, useEffect, Fragment, useRef } from 'react';
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

  // 新增：日期顯示內容生成和寬度測量
  const dateDisplayRef = useRef<HTMLDivElement>(null);
  const [dateDisplayWidth, setDateDisplayWidth] = useState(80); // 設定預設寬度

  const generateDateDisplayText = () => {
    if (view === 'month') {
      return format(currentDate, 'yyyy年M月');
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'yyyy年MM月dd日')}～${format(weekEnd, 'yyyy年MM月dd日')}`;
    } else {
      return format(currentDate, 'yyyy年MM月dd日');
    }
  };

  // 測量日期顯示寬度
  useEffect(() => {
    const measureWidth = () => {
      if (dateDisplayRef.current) {
        const width = dateDisplayRef.current.offsetWidth;
        setDateDisplayWidth(width);
      }
    };
    
    // 使用 setTimeout 確保 DOM 完全渲染後再測量
    const timer = setTimeout(measureWidth, 100);
    
    return () => clearTimeout(timer);
  }, [currentDate, view]);

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
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    /*
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
    */
    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7,1fr)',
        gridTemplateRows: 'auto repeat(5, 2fr)',
        gap: 1,
        bgcolor: 'grey.200',
        borderRadius: 1
      }}>
                  {/* 星期標題 */}
          {['星期一','星期二','星期三','星期四','星期五','星期六','星期日'].map((d, index) => {
            const today = new Date();
            const todayDayOfWeek = today.getDay(); // 0=週日, 1=週一, ..., 6=週六
            const isToday = (todayDayOfWeek === 0 && index === 6) || (todayDayOfWeek === index + 1);
            
            return (
              <Box key={d} sx={{
                bgcolor: isToday ? 'primary.dark' : 'primary.light', 
                color: 'white',
                textAlign: 'center', 
                py: 1, 
                fontWeight: 'bold'
              }}>{d}</Box>
            );
          })}
        {/* 日期格子，使用原 days 陣列 */}
        {days.map((d, i) => (
          <Box
            key={i}
            sx={{
              bgcolor: isToday(d) ? '#ffebee' : (isSameMonth(d, monthStart) ? 'background.paper' : 'grey.50'),
              p: 1,
              cursor: 'pointer',
              overflow: 'hidden',
              minHeight: '120px'
            }}
            onClick={() => handleDateClick(d)}
          >
            <Box sx={{
              fontSize: '0.875rem', fontWeight: 'bold',
              color: isToday(d)
                ? 'primary.main'
                : isSameMonth(d, monthStart)
                ? 'text.primary'
                : 'text.disabled'
            }}>{format(d, 'd')}</Box>

            {getLessonsForDate(d).map(l => (
              <Box key={l.id} sx={{
                mt: 0.5,
                p: 0.5,
                bgcolor: 'primary.light',
                borderRadius: 0.5,
                fontSize: '0.75rem',
                color: 'primary.main'
              }}>{l.topic}</Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  /* ---------- 週視圖 ---------- */
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '80px repeat(7,1fr)',
        gridAutoRows: 'auto',
        gap: 1,
        bgcolor: 'grey.200'
      }}>
        <Box />
                    {days.map(d => (
              <Box key={d.toISOString()} sx={{
                p: 1,
                textAlign: 'center',
                fontWeight: 'bold',
                bgcolor: isToday(d) ? 'primary.light' : 'grey.100'
              }}>{format(d, 'MM/dd')}</Box>
            ))}

            {timeSlots.map(time => (
              <Fragment key={time}>
                <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>{time}</Box>
                {days.map(d => (
                  <Box key={`${d.toISOString()}-${time}`} sx={{
                    p: 1,
                    minHeight: 112,
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                  }}>
                {getLessonsForTimeSlot(d, time).map(l => (
                  <Box key={l.id} sx={{
                    mb: 0.5,
                    p: 0.5,
                    bgcolor: 'primary.light',
                    borderRadius: 0.5,
                    fontSize: '0.75rem',
                    color: 'primary.main'
                  }}>
                    {getStudentName(l.studentId)}：{l.topic}
                  </Box>
                ))}
              </Box>
            ))}
          </Fragment>
        ))}
      </Box>
    );
  };

  /* ---------- 日視圖 ---------- */
  const renderDayView = () => (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '80px 1fr',
      gridAutoRows: 'auto',
      gap: 1,
      bgcolor: 'grey.200'
    }}>
      {timeSlots.map(time => (
        <Fragment key={time}>
          <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>{time}</Box>
          <Box sx={{
            p: 1,
            minHeight: 112,
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}>
            {getLessonsForTimeSlot(currentDate, time).map(l => (
              <Box key={l.id} sx={{
                mb: 0.5,
                p: 0.5,
                bgcolor: 'primary.light',
                borderRadius: 0.5,
                fontSize: '0.75rem',
                color: 'primary.main'
              }}>
                <Box>{getStudentName(l.studentId)}</Box>
                <Box>{l.topic}</Box>
                <Box sx={{ fontSize: '0.75rem', mt: 0.25 }}>{l.startTime} - {l.endTime}</Box>
              </Box>
            ))}
          </Box>
        </Fragment>
      ))}
    </Box>
  );

  /* ---------- 畫面 ---------- */
  if (loading) {
    return 
      <Box p={4}>載入中…</Box>;
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

      {/* 主要容器 */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>        

        {/* 分頁按鈕區域 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant={activeTab === 'schedule' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('schedule')}
            sx={{
              backgroundColor: activeTab === 'schedule' ? 'primary.main' : '#e0e0e0',
              color: activeTab === 'schedule' ? 'white' : '#000000',
              '&:hover': {
                backgroundColor: activeTab === 'schedule' ? 'primary.dark' : '#d0d0d0'
              }
            }}
          >📅 課程排程</Button>
          <Button
            variant={activeTab === 'students' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('students')}
            sx={{
              backgroundColor: activeTab === 'students' ? 'primary.main' : '#e0e0e0',
              color: activeTab === 'students' ? 'white' : '#000000',
              '&:hover': {
                backgroundColor: activeTab === 'students' ? 'primary.dark' : '#d0d0d0'
              }
            }}
          >👥 學生列表</Button>
          <Button
            variant={activeTab === 'stats' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('stats')}
            sx={{
              backgroundColor: activeTab === 'stats' ? 'primary.main' : '#e0e0e0',
              color: activeTab === 'stats' ? 'white' : '#000000',
              '&:hover': {
                backgroundColor: activeTab === 'stats' ? 'primary.dark' : '#d0d0d0'
              }
            }}
          >📊 統計資料</Button>
        </Box>

        {/* 內容區 */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}>

          {/* 導覽和時間切換 */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative',
            justifyContent: 'center',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}>
            {/* 隱藏的日期文字用於測量寬度 */}
            <Box
              ref={dateDisplayRef}
              sx={{
                position: 'absolute',
                visibility: 'hidden',
                fontWeight: 'bold',
                fontSize: '18px',
                whiteSpace: 'nowrap'
              }}
            >
              {generateDateDisplayText()}
            </Box>
            
            <Button 
              onClick={handlePrevious}
              sx={{
                backgroundColor: '#000000',
                color: 'white',
                position: 'absolute',
                left: `calc(100px - 80px)`,
                '&:hover': {
                  backgroundColor: '#333333'
                }
              }}
            >
              {view === 'month' && '上一月'}
              {view === 'week' && '上一週'}
              {view === 'day' && '前一日'}
            </Button>
            
            {/* 日期文字 */}
            <Box sx={{ 
              position: 'absolute',
              left: '100px',
              textAlign: 'left', 
              fontWeight: 'bold',
              fontSize: '18px',
              whiteSpace: 'nowrap'
            }}>
              {generateDateDisplayText()}
            </Box>
            
            {/* 下一日按鈕 */}
            <Button 
              onClick={handleNext}
              sx={{
                backgroundColor: '#000000',
                color: 'white',
                position: 'absolute',
                left: `calc(100px + ${dateDisplayWidth}px + 15px)`,
                '&:hover': {
                  backgroundColor: '#333333'
                }
              }}
            >
              {view === 'month' && '下一月'}
              {view === 'week' && '下一週'}
              {view === 'day' && '後一日'}
            </Button>
            
            <Button 
              onClick={handleToday}
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                position: 'absolute',
                left: '35%',
                '&:hover': {
                  backgroundColor: '#388e3c'
                }
              }}
            >
              今天
            </Button>
            
            <ToggleButtonGroup 
              value={view} 
              exclusive 
              onChange={handleViewChange}
              sx={{
                position: 'absolute',
                left: `calc(50% + ${dateDisplayWidth / 2}px + 140px)`,
                '& .MuiToggleButton-root': {
                  margin: '0 4px', // 每個按鈕左右各2px，總間距4px
                  width: '70px', // 比今天按鈕寬10px，再放大80%
                  height: '36px', // 與今天按鈕相同高度
                  backgroundColor: '#e3f2fd', // 未中選：淺藍底色
                  color: '#000000', // 未中選：黑色文字
                  border: '1px solid #e3f2fd', // 淺藍邊框
                  '&.Mui-selected': {
                    backgroundColor: '#1976d2', // 中選：深藍底色
                    color: 'white', // 中選：白色文字
                    border: '1px solid #1976d2', // 中選時的邊框顏色
                    '&:hover': {
                      backgroundColor: '#1565c0' // 中選懸停：更深的藍色
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#bbdefb' // 未中選懸停：稍深的淺藍色
                  },
                  '&:first-of-type': {
                    marginLeft: 0,
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px'
                  },
                  '&:last-of-type': {
                    marginRight: 0,
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px'
                  }
                }
              }}
            >
              <ToggleButton value="month">月</ToggleButton>
              <ToggleButton value="week">週</ToggleButton>
              <ToggleButton value="day">日</ToggleButton>
            </ToggleButtonGroup>
          </Box>



          {/* 日曆區塊：月/週/日 */}
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </Box>

        {/* 新增課程對話框 */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>新增課程</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField fullWidth label="課程主題" value={topic} onChange={e => setTopic(e.target.value)} margin="normal" />
              <FormControl fullWidth margin="normal">
                <InputLabel>學生</InputLabel>
                <Select value={selectedStudent} label="學生" onChange={e => setSelectedStudent(Number(e.target.value))}>
                  {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.name} ({s.level})</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>開始時間</InputLabel>
                <Select value={selectedTime} label="開始時間" onChange={e => setSelectedTime(e.target.value)}>
                  {timeSlots.map(t => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>取消</Button>
            <Button onClick={handleAddLesson} variant="contained" disabled={!selectedStudent || !selectedTime || !topic.trim()}>新增課程</Button>
          </DialogActions>
        </Dialog>

          {/* 學生列表區域 */}
          {activeTab === 'students' && (
            <Box sx={{
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
            </Box>
          )}

          {/* 統計資料區域 */}
          {activeTab === 'stats' && (
            <Box sx={{
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
            </Box>
          )}
      </Box>
    </>
  );
}
