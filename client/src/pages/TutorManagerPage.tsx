import React, { useState, useEffect } from 'react';
import '../styles/tutoring.css';

interface Schedule {
  id: number;
  student_id: number;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  course_name: string | null;
  teacher_name: string | null;
  subject: string | null;
  student_name: string;
  student_english_name: string;
  school: string;
  grade: string;
  level_type: string;
  class_type: string;
  classroom: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  notes: string;
}

interface Student {
  id: number;
  chinese_name: string;
  english_name: string;
  school: string;
  grade: string;
  level_type: string;
  is_active: boolean;
}

const TutorManagerPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'月' | '週' | '日'>('月');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 取得課表資料
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedules/calendar');
      if (!response.ok) {
        throw new Error('無法取得課表資料');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 取得學生資料
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('無法取得學生資料');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('取得學生資料失敗:', err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchStudents();
  }, []);

  // 根據星期幾取得課表
  const getSchedulesForDay = (dayOfWeek: string) => {
    return schedules
      .filter(schedule => schedule.day_of_week === dayOfWeek)
      .sort((a, b) => {
        // 取得課程的開始時間
        const getStartTime = (schedule: Schedule) => {
          if (schedule.start_time) {
            // 將 ISO 日期時間轉換為時分格式進行比較
            const date = new Date(schedule.start_time);
            return date.getHours() * 60 + date.getMinutes(); // 轉換為分鐘數便於比較
          } else {
            // 如果沒有時間，使用預設時間邏輯
            const defaultTimes = [540, 630, 840, 930, 1140, 1230]; // 對應 09:00, 10:30, 14:00, 15:30, 19:00, 20:30 的分鐘數
            return defaultTimes[schedule.student_id % defaultTimes.length];
          }
        };
        
        return getStartTime(a) - getStartTime(b);
      });
  };

  // 根據時間取得課表
  const getSchedulesForTime = (dayOfWeek: string, timeSlot: string) => {
    return schedules.filter(schedule => {
      if (schedule.day_of_week !== dayOfWeek) return false;
      
      // 如果資料庫中的時間為null，則使用預設時間邏輯
      if (!schedule.start_time) {
        // 為了展示功能，我們可以根據學生ID或課程來分配時間段
        const defaultTimes = ['09:00', '10:30', '14:00', '15:30', '19:00', '20:30'];
        const assignedTime = defaultTimes[schedule.student_id % defaultTimes.length];
        return assignedTime === timeSlot;
      }
      
      // 將時間格式統一為 HH:mm，直接從 ISO 字串提取時間部分避免時區問題
      const timeOnly = schedule.start_time.split('T')[1]; // 取得 "15:15:00.000Z"
      const scheduleStartTime = timeOnly.substring(0, 5); // 取得 "15:15"
      
      // 智能匹配：如果課程時間在時間槽範圍內，則顯示在該時間槽
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const [scheduleHour, scheduleMinute] = scheduleStartTime.split(':').map(Number);
      
      // 檢查課程是否在這個時間槽的範圍內（30分鐘時間槽）
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const slotEndMinutes = slotStartMinutes + 30;
      const scheduleMinutes = scheduleHour * 60 + scheduleMinute;
      
      return scheduleMinutes >= slotStartMinutes && scheduleMinutes < slotEndMinutes;
    });
  };

  // 專門為日視圖設計的課程取得函數，返回開始時間和持續時間
  const getSchedulesForDayView = (dayOfWeek: string) => {
    return schedules.filter(schedule => schedule.day_of_week === dayOfWeek).map(schedule => {
      let startTime, endTime;
      
      if (!schedule.start_time) {
        // 如果資料庫中的時間為null，使用預設時間邏輯
        const defaultTimes = [
          { start: '09:00', end: '10:30' },
          { start: '10:30', end: '12:00' },
          { start: '14:00', end: '15:30' },
          { start: '15:30', end: '17:00' },
          { start: '19:00', end: '20:30' },
          { start: '20:30', end: '22:00' }
        ];
        const assignedTimeSlot = defaultTimes[schedule.student_id % defaultTimes.length];
        startTime = assignedTimeSlot.start;
        endTime = assignedTimeSlot.end;
      } else {
        startTime = schedule.start_time.split('T')[1].substring(0, 5);
        endTime = schedule.end_time ? 
          schedule.end_time.split('T')[1].substring(0, 5) : startTime;
      }

      return {
        ...schedule,
        displayStartTime: startTime,
        displayEndTime: endTime
      };
    });
  };

  // 計算課程在日視圖中的位置和高度
  const calculateSchedulePosition = (startTime: string, endTime: string) => {
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return (hours - 9) * 60 + minutes; // 從9:00開始計算
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // 每個時間格是30分鐘，每格高度50px
    const slotHeight = 50;
    const minutesPerSlot = 30;
    
    // 計算開始位置（從開始時間的格子頂部開始）
    const startSlotIndex = Math.floor(startMinutes / minutesPerSlot);
    const topPosition = startSlotIndex * slotHeight;
    
    // 計算結束位置：結束時間所在格子的底部
    // 如果結束時間正好在格子邊界（如20:30），需要包含該格子
    const endSlotIndex = Math.floor(endMinutes / minutesPerSlot);
    const endPosition = (endSlotIndex + 1) * slotHeight; // +1 表示要到該格子的底部
    const height = endPosition - topPosition - 8; // 縮短8px，避免壓到下一格

    return { top: topPosition, height };
  };

  // 計算統計資料
  const totalStudents = students.length;
  const activeSchedules = schedules.filter(s => s.is_active).length;
  
  // 計算本週課程數
  const getCurrentWeekSchedules = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=週日, 1=週一, ..., 6=週六
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    
    // 計算本週的所有課程
    let weeklyScheduleCount = 0;
    for (let i = 0; i < 7; i++) {
      const dayName = dayNames[i];
      weeklyScheduleCount += getSchedulesForDay(dayName).length;
    }
    return weeklyScheduleCount;
  };
  
  // 根據當前視圖返回導航按鈕文字
  const getNavigationText = () => {
    switch (currentView) {
      case '月':
        return { prev: '前一月', next: '下一月' };
      case '週':
        return { prev: '上一週', next: '下一週' };
      case '日':
        return { prev: '前一天', next: '下一天' };
      default:
        return { prev: '上一頁', next: '下一頁' };
    }
  };
  
  const navText = getNavigationText();
  
  // 生成時間段（9:00-21:00，每半小時一行）
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) { // 最後一個時段不加 :30
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // 生成月曆日期數據
  const generateMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // 當月第一天
    const firstDay = new Date(year, month, 1);
    // 當月最後一天
    const lastDay = new Date(year, month + 1, 0);
    // 當月第一天是星期幾 (0=週日, 1=週一, ..., 6=週六)
    const firstDayOfWeek = firstDay.getDay();
    // 當月總天數
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    
    // 填入上個月的日期（如果第一天不是週日）
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month - 1, 0);
      const prevMonthDays = prevMonth.getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        calendar.push({
          date: prevMonthDays - i,
          isCurrentMonth: false,
          isPrevMonth: true,
          isNextMonth: false
        });
      }
    }
    
    // 填入當月的日期
    for (let date = 1; date <= daysInMonth; date++) {
      calendar.push({
        date: date,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        isToday: date === todayDate && month === todayMonth && year === todayYear
      });
    }
    
    // 填入下個月的日期（補足35格，5週）
    const remainingCells = 35 - calendar.length;
    for (let date = 1; date <= remainingCells; date++) {
      calendar.push({
        date: date,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true
      });
    }
    
    return calendar;
  };
  
  const monthCalendar = generateMonthCalendar();
  
  // 獲取當前日期標題
  const getCurrentTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() 返回 0-11
    const date = currentDate.getDate();
    
    switch (currentView) {
      case '月':
        return `${year}年 ${month}月`;
        
      case '週': {
        // 計算本週的開始日期（週日）和結束日期（週六）
        const dayOfWeek = currentDate.getDay(); // 0=週日, 1=週一, ..., 6=週六
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(date - dayOfWeek);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startMonth = startOfWeek.getMonth() + 1;
        const startDate = startOfWeek.getDate();
        const endMonth = endOfWeek.getMonth() + 1;
        const endDate = endOfWeek.getDate();
        
        // 如果開始和結束在同一個月
        if (startMonth === endMonth) {
          return `${year}年 ${startMonth}月${startDate}日～${endDate}日`;
        } else {
          return `${year}年 ${startMonth}月${startDate}日～${endMonth}月${endDate}日`;
        }
      }
        
      case '日':
        return `${year}年 ${month}月${date}日`;
        
      default:
        return `${year}年 ${month}月`;
    }
  };

  // 渲染課程資訊
  const renderScheduleInfo = (schedule: Schedule) => {
    // 如果時間為null，使用預設時間
    const getDisplayTime = (schedule: Schedule) => {
      if (schedule.start_time) {
        const start = schedule.start_time.split('T')[1].substring(0, 5);
        const end = schedule.end_time ? 
          schedule.end_time.split('T')[1].substring(0, 5) : '';
        return `${start} - ${end}`;
      } else {
        // 預設時間分配邏輯
        const defaultTimes = ['09:00-10:30', '10:30-12:00', '14:00-15:30', '15:30-17:00', '19:00-20:30', '20:30-22:00'];
        return defaultTimes[schedule.student_id % defaultTimes.length];
      }
    };

    return (
      <div key={schedule.id} className="schedule-item">
        <div className="schedule-student">{schedule.student_name}</div>
        <div className="schedule-course">{schedule.course_name || schedule.subject || '一般課程'}</div>
        <div className="schedule-time">{getDisplayTime(schedule)}</div>
        {schedule.teacher_name && (
          <div className="schedule-teacher">{schedule.teacher_name}</div>
        )}
      </div>
    );
  };

  // 獲取日期對應的星期幾
  const getDayOfWeek = (date: Date) => {
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return dayNames[date.getDay()];
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>載入中...</h2>
            <p>正在取得課表資料</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="error-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>⚠️ 載入失敗</h2>
            <p>{error}</p>
            <button className="btn" onClick={() => {
              setError(null);
              fetchSchedules();
              fetchStudents();
            }}>
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 載入失敗覆蓋層 */}
      <div id="app-overlay" className="app-overlay">
        <div>
          <h1>⚠️ 應用程式載入失敗</h1>
          <p>請檢查您的網路連線或後端伺服器狀態，然後重新整理頁面。</p>
        </div>
      </div>

      {/* 主要容器 */}
      <div className="container">        

        {/* ---------- 內容區 ---------- */}
        <div className="main-content">
          {/* 側邊欄 */}
          <div className="sidebar">
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-number">{totalStudents}</div>
                <div className="stat-label">學生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{students.filter(s => !s.is_active).length || 0}</div>
                <div className="stat-label">停用學生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{getCurrentWeekSchedules()}</div>
                <div className="stat-label">本週課程</div>
              </div>
            </div>

            <div className="student-list">
              <h3>📋 學生管理</h3>
              <div id="studentList">
                {students.slice(0, 5).map((student) => (
                  <div key={student.id} className="student-item">
                    <div className="student-item-details">
                      <div className="student-name">{student.chinese_name}</div>
                      <div className="student-info">{student.school} - {student.grade}</div>
                      <div className="student-info">{student.level_type}</div>
                    </div>
                  </div>
                ))}
                {students.length > 5 && (
                  <div className="student-item">
                    <div className="student-item-details">
                      <div className="student-name">還有 {students.length - 5} 位學生...</div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn" style={{ marginTop: 10 }}>➕ 新增學生</button>
            </div>
          </div>

          {/* 日曆區域 */}
          <div className="calendar-section">
            <div className="calendar-header">
              <div className="calendar-nav">
                <button 
                  className="btn"
                  onClick={() => {
                    if (currentView === '月') {
                      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    } else if (currentView === '週') {
                      setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
                    } else {
                      setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
                    }
                  }}
                >
                  ‹ {navText.prev}
                </button>
                <div className="calendar-title">{getCurrentTitle()}</div>
                <button 
                  className="btn"
                  onClick={() => {
                    if (currentView === '月') {
                      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    } else if (currentView === '週') {
                      setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
                    } else {
                      setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
                    }
                  }}
                >
                  {navText.next} ›
                </button>                                
              </div>

              <div className="calendar-controls">
                
                {/* 視圖切換按鈕移到導航右側 */}
                <div className="btn-group view-switcher" id="viewSwitcher" style={{ transform: 'translateX(-50px)' }}>
                  <button 
                    className={`btn ${currentView === '月' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('月')}
                  >
                    月
                  </button>
                  <button 
                    className={`btn ${currentView === '週' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('週')}
                  >
                    週
                  </button>
                  <button 
                    className={`btn ${currentView === '日' ? 'btn-active' : ''}`}
                    onClick={() => setCurrentView('日')}
                  >
                    日
                  </button>
                </div>

                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentDate(new Date())}
                >
                  今天
                </button>

                <button className="btn" style={{ marginLeft: 10 }}>➕ 新增課程</button>
              </div>
            </div>

            {/* 月視圖 */}
            {currentView === '月' && (
              <div className="month-view">
                {/* 星期標題 */}
                <div className="month-header">
                  {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'].map((day, index) => (
                    <div 
                      key={day} 
                      className={`month-day-header ${index === 0 || index === 6 ? 'weekend' : ''}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期格子 */}
                <div className="month-dates">
                  {monthCalendar.map((day, index) => {
                    const dayOfWeek = getDayOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date));
                    const daySchedules = getSchedulesForDay(dayOfWeek);
                    
                    return (
                      <div 
                        key={index} 
                        className={`month-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                      >
                        <div className="day-number">{day.date}</div>
                        <div className="day-schedules">
                          {daySchedules.slice(0, 3).map((schedule) => {
                            const displayTime = schedule.start_time ? 
                              schedule.start_time.split('T')[1].substring(0, 5) : 
                              ['09:00', '10:30', '14:00', '15:30', '19:00', '20:30'][schedule.student_id % 6];
                            return (
                              <div key={schedule.id} className="schedule-dot">
                                <span className="schedule-time">{displayTime}</span>
                                <span className="schedule-student">{schedule.student_name}</span>
                              </div>
                            );
                          })}
                          {daySchedules.length > 3 && (
                            <div className="schedule-more">+{daySchedules.length - 3}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 週視圖 */}
            {currentView === '週' && (
              <div className="week-view">
                <div className="week-header">
                  <div className="time-column-header">時間</div>
                  {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'].map((day, index) => {
                    const today = new Date();
                    const todayDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
                    const isToday = index === todayDayOfWeek;
                    
                    return (
                      <div 
                        key={day} 
                        className={`week-day-header ${isToday ? 'today' : ''}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div className="week-grid">
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="week-time-row">
                      <div className="time-label">{timeSlot}</div>
                      {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'].map((day) => {
                        const daySchedules = getSchedulesForTime(day, timeSlot);
                        return (
                          <div key={day} className="week-time-cell">
                            {daySchedules.map((schedule) => renderScheduleInfo(schedule))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 日視圖 */}
            {currentView === '日' && (
              <div className="day-view">
                <div className="day-schedule-container">
                  {/* 時間軸背景 */}
                  <div className="day-time-axis">
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot} className="day-time-slot">
                        <div className="time-label">{timeSlot}</div>
                        <div className="time-content-bg"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 課程覆蓋層 */}
                  <div className="day-schedules-overlay">
                    {(() => {
                      const currentDayOfWeek = getDayOfWeek(currentDate);
                      const daySchedules = getSchedulesForDayView(currentDayOfWeek);
                      
                      return daySchedules.map((schedule) => {
                        const position = calculateSchedulePosition(schedule.displayStartTime, schedule.displayEndTime);
                        
                        return (
                          <div 
                            key={schedule.id} 
                            className="schedule-block"
                            style={{
                              position: 'absolute',
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: 'var(--time-column-width, 100px)', // 時間欄寬度，支援響應式
                              right: '8px',
                              zIndex: 1
                            }}
                          >
                            <div className="schedule-item">
                              <div className="schedule-student">{schedule.student_name}</div>
                              <div className="schedule-course">{schedule.course_name || schedule.subject || '一般課程'}</div>
                              <div className="schedule-time">{schedule.displayStartTime} - {schedule.displayEndTime}</div>
                              {schedule.teacher_name && (
                                <div className="schedule-teacher">{schedule.teacher_name}</div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorManagerPage; 