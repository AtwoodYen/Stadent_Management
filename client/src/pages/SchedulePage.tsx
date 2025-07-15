/* ---------------------------  
   SchedulePage 家教排課系統  
   ---------------------------
   主要功能：
   1. 月／週／日檢視
   2. 點擊日期開啟對話框新增課程
   3. 課程資料保存在本地 state
-------------------------------- */

import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  addWeeks, 
  subMonths, 
  addMonths, 
  isSameMonth, 
  isToday,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  isSameWeek,
  addMinutes,
  getDay,
  getDate,
  getMonth,
  getYear,
  parse
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  Box, 
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

/* ---------- 型別定義 ---------- */
type ViewType = 'month' | 'week' | 'day';
type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'makeup';

interface Student {
  id: number;
  name: string;
  grade: number; // 1-16: 1-6(小學), 7-9(國中), 10-12(高中), 13-16(大學)
  level: 'elementary' | 'middle' | 'high' | 'university';
  school?: string;
  contactInfo?: string;
  parentInfo?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'trial';
  originalData?: any; // 保留原始資料以便訪問 class_type 和 level_type
}

interface Lesson {
  id: number;
  studentId: number;
  student?: Student;
  date: Date | string;
  startTime: string;
  endTime: string;
  subject: string;
  notes: string;
  status?: LessonStatus;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  formattedTime: string;
}

/* ---------- 主元件 ---------- */
export default function SchedulePage() {
  // State declarations
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
  
  // 分頁選單狀態
  const [activeTab, setActiveTab] = useState<'schedule' | 'students' | 'stats'>('schedule');
  
  // 在學中學生狀態
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  // 選中的學生狀態
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  // 控制學生選擇下拉選單的開啟/關閉狀態
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
  // 拖曳相關狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  
  // 處理學生點擊事件，開始拖曳
  const handleStudentClick = (student: Student) => {
    console.log('學生被點擊:', student.name);
    setDraggedStudent(student);
    setIsDragging(true);
    // 關閉下拉選單
    setIsStudentSelectOpen(false);
  };

  // 處理滑鼠移動事件，更新拖曳位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };
  
  // 處理全局滑鼠移動
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging]);
  
  // 處理全局右鍵點擊
  const handleGlobalContextMenu = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setDraggedStudent(null);
      setIsDragging(false);
    }
  }, [isDragging]);

  // 處理滑鼠放開事件，排定課程
  const handleMouseUp = (e: React.MouseEvent, date: Date, time: string) => {
    if (!draggedStudent) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 檢查是否點擊在課程格內
    const target = e.target as HTMLElement;
    if (target.closest('.lesson-item')) return;
    
    // 建立新課程
    const newLesson: Omit<Lesson, 'id'> = {
      studentId: draggedStudent.id,
      date: format(date, 'yyyy-MM-dd'),
      startTime: time,
      endTime: format(addMinutes(parseTimeString(time), 60), 'HH:mm'),
      subject: `${draggedStudent.name}的課程`,
      notes: '',
      status: 'scheduled' as const
    };
    
    // 更新課程列表
    setLessons(prev => [...prev, { ...newLesson, id: Date.now() }]);
    
    // 顯示成功訊息
    console.log('新增課程:', newLesson);
    
    // 重置拖曳狀態
    setDraggedStudent(null);
    setIsDragging(false);
  };

  // 輔助函數：將時間字符串轉換為Date對象
  const parseTimeString = (timeStr: string): Date => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`無效的時間格式: ${timeStr}`);
      }
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('解析時間字符串時出錯:', error);
      // 返回當前時間作為後備
      return new Date();
    }
  };

  // 處理右鍵點擊事件，取消拖曳
  const handleContextMenu = (e: React.MouseEvent) => {
    if (draggedStudent) {
      e.preventDefault();
      setDraggedStudent(null);
      setIsDragging(false);
    }
  };

  // 監聽 activeTab 變化
  useEffect(() => {
    console.log('activeTab 變更為:', activeTab);
  }, [activeTab]);

  // 調試日誌
  useEffect(() => {
    console.log('=== SchedulePage 組件渲染 ===');
    console.log('activeTab:', activeTab);
    console.log('activeStudents:', activeStudents);
    console.log('activeStudents 長度:', activeStudents.length);
  }, [activeTab, activeStudents]);

  // 點擊外部關閉下拉選單並清除選擇（僅當下拉選單開啟時）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isClickInside = target.closest('.student-select-container');
      
      // 只在選菜開啟時處理外部點擊
      if (isStudentSelectOpen && !isClickInside) {
        setSelectedStudents([]);
        setIsStudentSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStudentSelectOpen]); // 添加依賴，當 isStudentSelectOpen 變化時重新綁定事件

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // 模擬載入學生資料
  useEffect(() => {
    console.log('=== 組件掛載，開始載入學生資料 ===');
    console.log('當前 activeTab:', activeTab);
    console.log('當前 activeStudents:', activeStudents);
    
    // 模擬 API 請求
    const fetchStudents = async () => {
      try {
        console.log('正在從 API 獲取學生資料...');
        const response = await fetch('/api/students');
        const data = await response.json();
        console.log('獲取到的學生資料:', data);
        
        if (Array.isArray(data)) {
          // 將資料庫的 grade 轉換為前端需要的格式
          const validStudents = data.map(student => {
            // 解析年級和學校階段
            let grade = 1;
            let level: 'elementary' | 'middle' | 'high' | 'university' = 'elementary';
            
            // 解析年級字串，例如：'小一', '國一', '高一', '大一'
            const gradeStr = String(student.grade || '').trim();
            
            if (gradeStr.startsWith('小')) {
              level = 'elementary';
              grade = parseInt(gradeStr.replace('小', '')) || 1;
            } else if (gradeStr.startsWith('國')) {
              level = 'middle';
              grade = 7 + (parseInt(gradeStr.replace('國', '')) || 1) - 1; // 國一為7年級
            } else if (gradeStr.startsWith('高')) {
              level = 'high';
              grade = 10 + (parseInt(gradeStr.replace('高', '')) || 1) - 1; // 高一為10年級
            } else if (gradeStr.startsWith('大')) {
              level = 'university';
              grade = 13 + (parseInt(gradeStr.replace('大', '')) || 1) - 1; // 大一為13年級
            } else {
              // 默認處理
              level = 'elementary';
              grade = 1;
            }
            
            return {
              id: Number(student.id) || 0,
              name: String(student.chinese_name || student.english_name || '未命名學生'),
              level,
              grade,
              originalData: student // 保留原始資料以便調試
            };
          });
          
          console.log('轉換後的學生資料:', validStudents);
          setStudents(validStudents);
          setActiveStudents(validStudents);
          console.log('學生資料已更新到狀態');
        } else {
          console.error('獲取的學生資料不是陣列:', data);
          throw new Error('Invalid student data format');
        }
      } catch (error) {
        console.error('載入學生資料時出錯:', error);
        
        // 如果 API 請求失敗，使用模擬資料
        console.log('使用模擬學生資料');
        const mockStudents: Student[] = [
          // 國小學生 (1-6年級)
          { id: 1, name: '王小明', level: 'elementary', grade: 1 },
          { id: 2, name: '林小華', level: 'elementary', grade: 2 },
          { id: 3, name: '陳小美', level: 'elementary', grade: 3 },
          { id: 4, name: '黃小強', level: 'elementary', grade: 4 },
          // 國中學生 (7-9年級)
          { id: 5, name: '張大偉', level: 'middle', grade: 7 },
          { id: 6, name: '李曉華', level: 'middle', grade: 8 },
          { id: 7, name: '劉小玲', level: 'middle', grade: 9 },
          // 高中學生 (10-12年級)
          { id: 8, name: '陳大明', level: 'high', grade: 10 },
          { id: 9, name: '林小芳', level: 'high', grade: 11 },
          { id: 10, name: '吳小龍', level: 'high', grade: 12 },
          // 大學生 (13-16年級)
          { id: 11, name: '楊大華', level: 'university', grade: 13 },
          { id: 12, name: '王小玉', level: 'university', grade: 14 },
        ];
        setStudents(mockStudents);
        setActiveStudents(mockStudents);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  // 計算本週課程數
  const [lessonsThisWeek, setLessonsThisWeek] = useState(0);
  
  // 使用全局定義的 timeSlots
  
  // 獲取指定日期和時間的課程
  const getLessonsForTimeSlot = (date: Date, time: string): Lesson[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return lessons.filter(lesson => {
      try {
        let lessonDate: string;
        
        if (typeof lesson.date === 'string') {
          lessonDate = lesson.date.split('T')[0];
        } else if (isValidDate(lesson.date)) {
          lessonDate = format(lesson.date as Date, 'yyyy-MM-dd');
        } else {
          // 如果日期無效，跳過這個課程
          console.warn('無效的課程日期:', lesson.date);
          return false;
        }
        
        return lessonDate === dateStr && lesson.startTime === time;
      } catch (error) {
        console.error('處理課程日期時出錯:', error, lesson);
        return false;
      }
    });
  };
  
  // 驗證日期是否有效
  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    return false;
  };

  // 獲取學生姓名
  const getStudentName = (studentId: number): string => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '未知學生';
  };

  // 獲取學生詳細資訊（包括課程和等級）
  const getStudentInfo = (studentId: number): { name: string; classType: string; levelType: string } => {
    const student = activeStudents.find(s => s.id === studentId);
    if (!student) {
      return { name: '未知學生', classType: '未知課程', levelType: '未知等級' };
    }
    
    // 從 originalData 中獲取 class_type 和 level_type
    const originalData = student.originalData;
    const classType = originalData?.class_type || '未知課程';
    const levelType = originalData?.level_type || '未知等級';
    
    return {
      name: student.name,
      classType,
      levelType
    };
  };

  // 獲取指定日期的課程
  const getLessonsForDate = (date: Date): Lesson[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return lessons.filter(lesson => {
      try {
        let lessonDate: string;
        
        if (typeof lesson.date === 'string') {
          lessonDate = lesson.date.split('T')[0];
        } else if (isValidDate(lesson.date)) {
          lessonDate = format(lesson.date as Date, 'yyyy-MM-dd');
        } else {
          // 如果日期無效，跳過這個課程
          console.warn('無效的課程日期:', lesson.date);
          return false;
        }
        
        return lessonDate === dateStr;
      } catch (error) {
        console.error('處理課程日期時出錯:', error, lesson);
        return false;
      }
    });
  };

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };

  // ...

  // 處理日期移動
  const handleDateNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    setCurrentDate(prev => {
      if (direction === 'today') return new Date();
      
      const offset = direction === 'prev' ? -1 : 1;
      
      return view === 'week' 
        ? addWeeks(prev, offset)
        : view === 'month'
        ? addMonths(prev, offset)
        : addDays(prev, offset);
    });
  }, [view]);
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
      const response = await fetch('/api/schedules', {
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
          subject: newSchedule.subject,
          notes: '',
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
    setView(newView);
  };

  const handlePrevious = () => {
    setCurrentDate(prev =>
      view === 'week'
        ? addWeeks(prev, -1)
        : view === 'month'
        ? addMonths(prev, -1)
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
      console.log('=== 課表排程 fetchStudents 開始 ===');
      const response = await fetch('/api/students');
      console.log('課表排程API 回應狀態:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('載入的學生資料數量:', data.length);
        console.log('前3個學生:', data.slice(0, 3));
        
        // 轉換資料格式以符合現有介面
        const formattedStudents = data.map((student: any) => ({
          id: student.id,
          name: student.chinese_name || student.name,
          level: student.level_type || student.level || '新手'
        }));
        setStudents(formattedStudents);
        
        // 篩選在學中的學生（排除畢業和暫停的學生）
        const activeStudentsList = data
          .filter((student: any) => {
            const status = student.enrollment_status || student.status;
            console.log(`學生 ${student.chinese_name || student.name} 狀態: ${status}`);
            return status === 'active' || status === '進行中' || status === 'Active';
          })
          .map((student: any) => {
            // 解析年級和學校階段
            let grade = 1;
            let level: 'elementary' | 'middle' | 'high' | 'university' = 'elementary';
            
            // 解析年級字串，例如：'小一', '國一', '高一', '大一'
            const gradeStr = String(student.grade || '').trim();
            
            if (gradeStr.startsWith('小')) {
              level = 'elementary';
              grade = parseInt(gradeStr.replace('小', '')) || 1;
            } else if (gradeStr.startsWith('國')) {
              level = 'middle';
              grade = 7 + (parseInt(gradeStr.replace('國', '')) || 1) - 1; // 國一為7年級
            } else if (gradeStr.startsWith('高')) {
              level = 'high';
              grade = 10 + (parseInt(gradeStr.replace('高', '')) || 1) - 1; // 高一為10年級
            } else if (gradeStr.startsWith('大')) {
              level = 'university';
              grade = 13 + (parseInt(gradeStr.replace('大', '')) || 1) - 1; // 大一為13年級
            } else {
              // 默認處理
              level = 'elementary';
              grade = 1;
            }
            
            return {
              id: student.id,
              name: student.chinese_name || student.name || '未命名學生',
              level,
              grade,
              originalData: student // 保留原始資料以便調試
            };
          });
        
        console.log('篩選後的在學中學生數量:', activeStudentsList.length);
        console.log('篩選後的學生:', activeStudentsList);
        setActiveStudents(activeStudentsList);
      } else {
        console.error('API 回應錯誤:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('載入學生資料失敗:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/schedules/calendar');
      if (response.ok) {
        const data = await response.json();
        // 轉換資料格式以符合現有介面
        const formattedLessons = data.map((schedule: any) => {
          try {
            const lessonDate = new Date(schedule.lesson_date);
            if (isNaN(lessonDate.getTime())) {
              console.warn('無效的課程日期:', schedule.lesson_date);
              return null;
            }
            
            return {
              id: schedule.id,
              studentId: schedule.student_id,
              date: lessonDate,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              subject: schedule.subject || '課程',
              notes: '',
              status: schedule.status || 'scheduled'
            };
          } catch (error) {
            console.error('處理課程資料時出錯:', error, schedule);
            return null;
          }
        }).filter(Boolean); // 過濾掉 null 值
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('載入課程資料失敗:', error);
    }
  };

  // 初始載入資料
  useEffect(() => {
    console.log('=== useEffect 執行 ===');
    const loadData = async () => {
      console.log('開始載入資料...');
      setLoading(true);
      await Promise.all([fetchStudents(), fetchLessons()]);
      setLoading(false);
      console.log('資料載入完成');
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

            {getLessonsForDate(d).map(l => {
              const studentInfo = getStudentInfo(l.studentId);
              return (
                <Box key={l.id} sx={{
                  mt: 0.5,
                  p: 0.5,
                  bgcolor: 'primary.light',
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                  color: 'primary.main'
                }}>
                  <Box sx={{ fontWeight: 'bold' }}>
                    {studentInfo.name}：{studentInfo.classType} - {studentInfo.levelType}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  /* ---------- 週視圖 ---------- */
  const renderWeekView = () => {
    // 定義星期幾的類型
    interface WeekDay {
      date: Date;
      dayName: string;
      formattedDate: string;
    }
    
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays: WeekDay[] = [];
    
    // 中文星期對照表
    const chineseWeekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dayOfWeek = date.getDay(); // 0-6 (0是週日)
      const chineseWeekday = chineseWeekdays[dayOfWeek];
      
      weekDays.push({
        date,
        dayName: `星期${chineseWeekday}`,
        formattedDate: `${format(date, 'MM/dd')} (星期${chineseWeekday})`
      });
    }

    // 拖曳預覽樣式
    const dragPreviewStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${dragPosition.x + 10}px`,
      top: `${dragPosition.y + 10}px`,
      zIndex: 1500,
      pointerEvents: 'none',
      backgroundColor: 'rgba(25, 118, 210, 0.9)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap',
      transform: 'translate(-50%, -50%)',
      display: isDragging ? 'block' : 'none'
    };

    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 200px)'
        }}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
      >
        {/* 拖曳預覽 */}
        {draggedStudent && (
          <div style={dragPreviewStyle}>
            正在排課: {draggedStudent.name}
          </div>
        )}

        {/* 星期標題 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '100px repeat(7, 1fr)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default'
        }}>
          <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>時間</Box>
          {weekDays.map((weekDay, index) => (
            <Box key={index} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
              {weekDay.dayName}
            </Box>
          ))}
        </Box>

        {/* 時間格 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '100px repeat(7, 1fr)',
          flex: 1
        }}>
          {timeSlots.map((time, timeIndex) => (
            <Fragment key={time}>
              {/* 時間標籤 */}
              <Box 
                sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  position: 'sticky',
                  left: 0,
                  zIndex: 5
                }}
              >
                {time}
              </Box>

              {/* 時間格 */}
              {weekDays.map((weekDay, dayIndex) => {
                const lessonsInSlot = getLessonsForTimeSlot(weekDay.date, time);
                const isCurrentDay = isToday(weekDay.date);
                return (
                  <Box
                    key={`${dayIndex}-${timeIndex}`}
                    onMouseUp={(e) => handleMouseUp(e, weekDay.date, time)}
                    sx={{
                      p: 1,
                      minHeight: 112,
                      bgcolor: isCurrentDay ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                      overflow: 'hidden',
                      position: 'relative',
                      borderBottom: '1px solid',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      cursor: draggedStudent ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: draggedStudent 
                          ? 'rgba(25, 118, 210, 0.08)' 
                          : isCurrentDay 
                            ? 'rgba(25, 118, 210, 0.06)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        outline: draggedStudent ? '2px dashed' : 'none',
                        outlineColor: 'primary.main'
                      }
                    }}
                  >
                    {lessonsInSlot.map(lesson => {
                      const studentInfo = getStudentInfo(lesson.studentId);
                      return (
                        <Box 
                          key={lesson.id}
                          sx={{
                            mb: 0.5,
                            p: 0.5,
                            bgcolor: 'primary.light',
                            borderRadius: 0.5,
                            fontSize: '0.75rem',
                            color: 'primary.contrastText',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              transition: 'transform 0.2s',
                              boxShadow: 1
                            }
                          }}
                        >
                          <Box sx={{ fontWeight: 'bold' }}>
                            {studentInfo.name}：{studentInfo.classType} - {studentInfo.levelType}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Fragment>
          ))}
        </Box>
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
            {getLessonsForTimeSlot(currentDate, time).map(l => {
              const studentInfo = getStudentInfo(l.studentId);
              return (
                <Box key={l.id} sx={{
                  mb: 0.5,
                  p: 0.5,
                  bgcolor: 'primary.light',
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                  color: 'primary.main'
                }}>
                  <Box sx={{ fontWeight: 'bold' }}>
                    {studentInfo.name}：{studentInfo.classType} - {studentInfo.levelType}
                  </Box>
                  <Box sx={{ fontSize: '0.75rem', mt: 0.25 }}>{l.startTime} - {l.endTime}</Box>
                </Box>
              );
            })}
          </Box>
        </Fragment>
      ))}
    </Box>
  );

  /* ---------- 畫面 ---------- */
  console.log('=== SchedulePage 渲染開始 ===');
  console.log('loading:', loading);
  console.log('activeTab:', activeTab);
  console.log('activeStudents:', activeStudents);
  
  if (loading) {
    console.log('顯示載入中...');
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
        {/* 標題與分頁按鈕同一行 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', letterSpacing: 2 }}>
              課表管理
            </Typography>

            {/* 在學中學生下拉選單 */}
            <div className="student-select-container" style={{ position: 'relative' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: 'white' }}>
                  {selectedStudents.length > 0 ? '已選學生' : '在學中學生'}
                </InputLabel>
                <Select
                  open={isStudentSelectOpen}
                  onOpen={() => setIsStudentSelectOpen(true)}
                  onClose={() => setIsStudentSelectOpen(false)}
                  value={selectedStudents.length > 0 ? 'selected' : ''}
                  label={selectedStudents.length > 0 ? '已選學生' : '在學中學生'}
                  displayEmpty
                  renderValue={() => {
                    if (selectedStudents.length === 0) return '在學中學生';
                    if (selectedStudents.length === 1) return selectedStudents[0].name;
                    return `已選 ${selectedStudents.length} 位學生`;
                  }}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                    '& .MuiSelect-icon': {
                      color: 'white',
                    },
                    '& .MuiSelect-select': {
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px',
                      paddingRight: '32px !important',
                    },
                    '&:focus': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: '70vh',
                        width: 'auto',
                        minWidth: 600,
                        p: 2,
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  <Box sx={{ p: 1, minWidth: 800, maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* 國小學生 */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 0.25, fontSize: '0.875rem' }}>
                        國小學生
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', rowGap: '3px' }}>
                        {activeStudents
                          .filter(student => student.level === 'elementary')
                          .sort((a, b) => {
                            // 國小一～六年級排序
                            return a.grade - b.grade || a.name.localeCompare(b.name);
                          })
                          .map(student => (
                            <Chip
                              key={student.id}
                              label={student.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStudentClick(student);
                              }}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.main'
                                  : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                width: '85%',  // 減少寬度10%
                                maxWidth: '100px',
                                height: '24px',
                                transition: 'all 0.2s ease-in-out',
                                transform: 'scale(1)',
                                '& .MuiChip-label': {
                                  padding: '0 1px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s ease-in-out'
                                },
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  zIndex: 1,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  '& .MuiChip-label': {
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                  }
                                },
                              }}
                            />
                          ))}
                      </Box>
                    </Box>

                    {/* 國中學生 */}
                    <Box sx={{ mb: 1.5, mt: 3 }}>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 0.25, fontSize: '0.875rem' }}>
                        國中學生
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', rowGap: '3px' }}>
                        {activeStudents
                          .filter(student => student.level === 'middle')
                          .sort((a, b) => {
                            // 國中一～三年級排序
                            return a.grade - b.grade || a.name.localeCompare(b.name);
                          })
                          .map(student => (
                            <Chip
                              key={student.id}
                              label={student.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStudentClick(student);
                              }}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.main'
                                  : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                width: '85%',  // 減少寬度10%
                                maxWidth: '100px',
                                height: '24px',
                                transition: 'all 0.2s ease-in-out',
                                transform: 'scale(1)',
                                '& .MuiChip-label': {
                                  padding: '0 1px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s ease-in-out'
                                },
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  zIndex: 1,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  '& .MuiChip-label': {
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                  }
                                },
                              }}
                            />
                          ))}
                      </Box>
                    </Box>

                    {/* 高中學生 */}
                    <Box sx={{ mb: 1.5, mt: 3 }}>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 0.25, fontSize: '0.875rem' }}>
                        高中學生
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', rowGap: '3px' }}>
                        {activeStudents
                          .filter(student => student.level === 'high')
                          .sort((a, b) => {
                            // 高中一～三年級排序
                            return a.grade - b.grade || a.name.localeCompare(b.name);
                          })
                          .map(student => (
                            <Chip
                              key={student.id}
                              label={student.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStudentClick(student);
                              }}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.main'
                                  : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                width: '85%',  // 減少寬度10%
                                maxWidth: '100px',
                                height: '24px',
                                transition: 'all 0.2s ease-in-out',
                                transform: 'scale(1)',
                                '& .MuiChip-label': {
                                  padding: '0 1px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s ease-in-out'
                                },
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  zIndex: 1,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  '& .MuiChip-label': {
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                  }
                                },
                              }}
                            />
                          ))}
                      </Box>
                    </Box>

                    {/* 大學生 */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 0.25, fontSize: '0.875rem' }}>
                        大學生
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', rowGap: '3px' }}>
                        {activeStudents
                          .filter(student => student.level === 'university')
                          .sort((a, b) => {
                            // 大學一～四年級排序
                            return a.grade - b.grade || a.name.localeCompare(b.name);
                          })
                          .map(student => (
                            <Chip
                              key={student.id}
                              label={student.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStudentClick(student);
                              }}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.main'
                                  : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                width: '85%',  // 減少寬度10%
                                maxWidth: '100px',
                                height: '24px',
                                transition: 'all 0.2s ease-in-out',
                                transform: 'scale(1)',
                                '& .MuiChip-label': {
                                  padding: '0 1px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.2s ease-in-out'
                                },
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  zIndex: 1,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                  '& .MuiChip-label': {
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                  }
                                },
                              }}
                            />
                          ))}
                      </Box>
                    </Box>
                  </Box>
                </Select>
              </FormControl>
            </div>
            
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
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
          </Box>
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
                left: 'calc(35% + 60px)',
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
              {(() => {
                console.log('=== 學生列表區域渲染 ===');
                console.log('activeStudents:', activeStudents);
                console.log('activeStudents 類型:', typeof activeStudents);
                console.log('activeStudents 長度:', activeStudents.length);
                console.log('activeStudents 是否為陣列:', Array.isArray(activeStudents));
                console.log('selectedStudents:', selectedStudents);
                return null;
              })()}
              <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>👥 學生列表</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {(() => {
                  console.log('activeStudents 長度:', activeStudents.length);
                  if (activeStudents.length === 0) {
                    console.log('沒有在學中的學生');
                    return <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                      <p>沒有在學中的學生</p>
                    </div>;
                  }
                  return null;
                })()}
                {activeStudents.map((s, index) => {
                  console.log(`渲染學生: ${s.name}`);
                  const isSelected = selectedStudents.some(selected => selected.id === s.id);
                  return (
                    <div 
                      key={s.id} 
                      style={{
                        backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
                        padding: '15px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: 'scale(1)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.zIndex = 'auto';
                      }}
                      onClick={(e) => {
                        console.log('=== 學生點擊事件觸發 ===');
                        console.log('點擊的學生:', { id: s.id, name: s.name, level: s.level });
                        console.log('當前選中學生 (點擊前):', selectedStudents);
                        
                        if (isSelected) {
                          console.log('取消選中學生:', s.name);
                          const newSelected = selectedStudents.filter(student => student.id !== s.id);
                          console.log('新的選中列表 (取消後):', newSelected);
                          setSelectedStudents(newSelected);
                        } else {
                          console.log('新增選中學生:', s.name);
                          const newSelected = [...selectedStudents, s];
                          console.log('新的選中列表 (新增後):', newSelected);
                          const activeStudents = students.filter(student => student.status === 'active');
                          const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
                          const handleStudentClick = (student: Student) => {
                            setSelectedStudents([student]);
                            setIsStudentSelectOpen(false);
                          };
                          handleStudentClick(s);
                          setSelectedStudents(newSelected);
                        }
                        
                        // 添加延遲以確保狀態已更新
                        setTimeout(() => {
                          console.log('當前選中學生 (狀態更新後):', selectedStudents);
                        }, 0);
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px 0', color: isSelected ? '#1976d2' : '#333' }}>{s.name}</h3>
                      <p style={{ margin: '0', color: isSelected ? '#1976d2' : '#666' }}>程度：{s.level}</p>
                      {isSelected && (
                        <p style={{ margin: '5px 0 0 0', color: '#1976d2', fontSize: '0.8em' }}>
                          ✓ 已選中
                        </p>
                      )}
                    </div>
                  );
                })}
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
