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
import { getLevelColors } from '../utils/levelColors';

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
  // 定期班相關欄位
  dayOfWeek?: string;
  originalSchedule?: any;
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
  
  // 監聽 lessons 狀態變化
  useEffect(() => {
    console.log('=== lessons 狀態更新 ===');
    console.log('課程總數:', lessons.length);
    console.log('所有課程:', lessons);
    
    // 檢查學生編號19的課程
    const student19Lessons = lessons.filter(lesson => lesson.studentId === 19);
    console.log('學生編號19的課程:', student19Lessons);
  }, [lessons]);
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
      setSelectedStudents([]); // 清除選中的學生
    }
  }, [isDragging]);

  // 處理全局滑鼠點擊，檢查是否點擊在合理範圍外
  const handleGlobalMouseDown = useCallback((e: MouseEvent) => {
    console.log('=== handleGlobalMouseDown 觸發 ===');
    console.log('isDragging:', isDragging);
    console.log('draggedStudent:', draggedStudent);
    if (isDragging) {
      const target = e.target as HTMLElement;
      console.log('點擊的目標元素:', target);
      console.log('目標元素的 className:', target.className);
      console.log('目標元素的 tagName:', target.tagName);
      // 檢查是否點擊在課表區域（需在課表容器加 data-schedule-area 屬性）
      const isInScheduleArea = target.closest('[data-schedule-area]');
      const isInStudentSelect = target.closest('.student-select-container');
      console.log('isInScheduleArea:', isInScheduleArea);
      console.log('isInStudentSelect:', isInStudentSelect);
      // 如果點擊在課表區域外且不在學生選擇區域內，則只取消拖曳，不清除已選學生
      if (!isInScheduleArea && !isInStudentSelect) {
        console.log('點擊在課表區域外，取消拖曳');
        setDraggedStudent(null);
        setIsDragging(false);
        // 不要 setSelectedStudents([])
      } else {
        console.log('點擊在課表區域內或學生選擇區，保持拖曳狀態');
      }
    } else {
      console.log('未在拖曳狀態，不處理');
    }
  }, [isDragging, draggedStudent]);

  // 掛載全域 mousedown 事件
  useEffect(() => {
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
    };
  }, [handleGlobalMouseDown]);

  // 處理滑鼠放開事件，排定課程
  const handleMouseUp = async (e: React.MouseEvent, date: Date, time: string) => {
    console.log('=== handleMouseUp 觸發 ===');
    console.log('draggedStudent:', draggedStudent);
    console.log('isDragging:', isDragging);
    console.log('date:', date, 'time:', time);
    
    if (!draggedStudent) {
      console.log('handleMouseUp 結束：沒有 draggedStudent');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // 檢查點擊位置是否有效
    const target = e.target as HTMLElement;
    const isInScheduleArea = target.closest('[data-schedule-area]');
    const isInStudentSelect = target.closest('.student-select-container');
    const isInLessonItem = target.closest('.lesson-item');
    
    console.log('點擊位置檢查:', {
      isInScheduleArea,
      isInStudentSelect,
      isInLessonItem,
      targetElement: target
    });
    
    // 如果點擊在無效區域，取消拖曳和選擇
    if (!isInScheduleArea || isInLessonItem) {
      console.log('點擊在無效區域，取消拖曳和學生選擇');
      setDraggedStudent(null);
      setIsDragging(false);
      setSelectedStudents([]); // 清除左上角的學生選擇
      return;
    }
    
    // 取得星期幾（後端 API 要求的格式）
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek = dayNames[date.getDay()];
    
    // 檢查是否為有效的星期格式
    if (!['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].includes(dayOfWeek)) {
      console.error('無效的星期格式:', dayOfWeek);
      alert('無效的星期格式，請稍後再試');
      setDraggedStudent(null);
      setIsDragging(false);
      setSelectedStudents([]); // 清除選中的學生
      return;
    }
    
    // 驗證時間格式
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      console.error('無效的時間格式:', time);
      alert('無效的時間格式，請稍後再試');
      setDraggedStudent(null);
      setIsDragging(false);
      setSelectedStudents([]); // 清除選中的學生
      return;
    }
    
    // 計算結束時間（預設1小時，格式為 HH:mm）
    const pad = (n: number) => n.toString().padStart(2, '0');
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = `${pad(hours)}:${pad(minutes)}`;
    const endHours = hours + 1;
    const endTime = `${pad(endHours)}:${pad(minutes)}`;
    
    console.log('=== 調試資訊 ===');
    console.log('原始時間參數:', time);
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    console.log('時間類型:', typeof time);
    console.log('時間長度:', time.length);
    console.log('時間字元:', Array.from(time).map(c => c.charCodeAt(0)));
    console.log('計算的結束時間:', endTime);
    console.log('結束時間類型:', typeof endTime);
    console.log('結束時間長度:', endTime.length);
    
    console.log('準備傳送的資料:', {
      student_id: draggedStudent.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      course_name: `${draggedStudent.name}的課程`
    });
    
    // 準備要傳送到後端的資料
    const scheduleData = {
      student_id: draggedStudent.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      course_name: `${draggedStudent.name}的課程`,
      teacher_name: null
    };
    
    try {
      // 呼叫 API 儲存到資料庫
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('新增課程失敗:', errorData);
        console.error('HTTP 狀態碼:', response.status);
        console.error('回應標頭:', Object.fromEntries(response.headers.entries()));
        alert(`新增課程失敗: ${errorData.errors?.[0]?.msg || errorData.error || '未知錯誤'}`);
        return;
      }
      
      // 從後端取得新增的課程資料
      const newSchedule = await response.json();
      
      // 建立新課程物件
      const newLesson: Lesson = {
        id: newSchedule.id,
        studentId: newSchedule.student_id,
        date: new Date(newSchedule.lesson_date || date),
        startTime: newSchedule.start_time,
        endTime: newSchedule.end_time,
        subject: newSchedule.course_name || `${draggedStudent.name}的課程`,
        notes: '',
        status: 'scheduled' as const
      };
      
      // 重新載入課表資料以確保資料一致性
      console.log('=== 開始重新載入課表資料 ===');
      await fetchLessons();
      console.log('=== 課表資料重新載入完成 ===');
      
      // 顯示成功訊息
      console.log('新增課程成功:', newLesson);
      
    } catch (error) {
      console.error('新增課程時發生錯誤:', error);
      alert('新增課程時發生錯誤，請稍後再試');
    } finally {
      // 重置拖曳狀態
      setDraggedStudent(null);
      setIsDragging(false);
      setSelectedStudents([]); // 清除選中的學生
    }
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

  // 定義時間段（移到組件頂部，確保在渲染時可用）
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];
  
  // 調試 timeSlots
  console.log('timeSlots 定義:', timeSlots);
  console.log('timeSlots 第一個元素:', timeSlots[0]);
  console.log('timeSlots 第一個元素字元:', Array.from(timeSlots[0]).map(c => c.charCodeAt(0)));
  console.log('timeSlots 第一個元素正則測試:', /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlots[0]));

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
  
  // 獲取指定日期和時間的課程（定期班邏輯）
  const getLessonsForTimeSlot = (date: Date, time: string): Lesson[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay(); // 0=週日, 1=週一, ..., 6=週六
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const currentDayName = dayNames[dayOfWeek];
    
    console.log(`=== 查詢時間段課程 ===`);
    console.log(`查詢日期: ${dateStr}, 時間: ${time}, 星期: ${currentDayName}`);
    console.log(`當前課程總數: ${lessons.length}`);
    
    const filteredLessons = lessons.filter(lesson => {
      try {
        // 如果正在拖曳該學生，則不顯示該學生的課程
        if (isDragging && draggedStudent && lesson.studentId === draggedStudent.id) {
          console.log(`學生${lesson.studentId}正在被拖曳，隱藏其課程`);
          return false;
        }
        
        // 對於定期班，我們需要檢查：
        // 1. 課程的星期幾是否匹配當前查詢的星期幾
        // 2. 課程的開始時間是否匹配當前查詢的時間
        
                  // 檢查是否有定期班資訊
          if (lesson.dayOfWeek) {
            // 使用定期班邏輯
            const matchesDay = lesson.dayOfWeek === currentDayName;
            const matchesTime = lesson.startTime === time;
            /*
            // 記錄所有學生的定期班課程檢查
            console.log(`學生${lesson.studentId}定期班課程檢查(1):`, {
              lessonId: lesson.id,
              studentId: lesson.studentId,
              lessonDayOfWeek: lesson.dayOfWeek,
              queryDayOfWeek: currentDayName,
              lessonTime: lesson.startTime,
              queryTime: time,
              matchesDay,
              matchesTime,
              subject: lesson.subject,
              fullLesson: lesson
            });
            */
            return matchesDay && matchesTime;
          } else {
            // 備用方案：使用日期匹配（適用於非定期班課程）
            let lessonDate: string;
            
            if (typeof lesson.date === 'string') {
              lessonDate = lesson.date.split('T')[0];
            } else if (isValidDate(lesson.date)) {
              lessonDate = format(lesson.date as Date, 'yyyy-MM-dd');
            } else {
              console.warn('無效的課程日期:', lesson.date);
              return false;
            }
            
            const matchesDate = lessonDate === dateStr;
            const matchesTime = lesson.startTime === time;
            
            // 記錄所有學生的非定期班課程檢查
            console.log(`學生${lesson.studentId}非定期班課程檢查(2):`, {
              lessonId: lesson.id,
              studentId: lesson.studentId,
              lessonDate,
              queryDate: dateStr,
              lessonTime: lesson.startTime,
              queryTime: time,
              matchesDate,
              matchesTime,
              subject: lesson.subject
            });
            
            return matchesDate && matchesTime;
          }
      } catch (error) {
        console.error('處理課程日期時出錯:', error, lesson);
        return false;
      }
    });
    
    console.log(`找到 ${filteredLessons.length} 個課程在 ${dateStr} ${time}`);
    if (filteredLessons.length > 0) {
      console.log('找到的課程:', filteredLessons);
    }
    
    return filteredLessons;
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

  // 判斷學生是否為暫停狀態
  const isStudentPaused = (student: Student): boolean => {
    const status = student.originalData?.enrollment_status || student.originalData?.status;
    return status === 'inactive' || status === '暫停中' || status === 'Inactive';
  };

  // 獲取指定日期的課程
  const getLessonsForDate = (date: Date): Lesson[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay(); // 0-6 (0是週日)
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const currentDayName = dayNames[dayOfWeek];
    
    console.log(`=== 查詢日期課程 ===`);
    console.log(`查詢日期: ${dateStr}, 星期: ${currentDayName}`);
    console.log(`當前課程總數: ${lessons.length}`);
    
    const filteredLessons = lessons.filter(lesson => {
      try {
        // 如果正在拖曳該學生，則不顯示該學生的課程
        if (isDragging && draggedStudent && lesson.studentId === draggedStudent.id) {
          console.log(`學生${lesson.studentId}正在被拖曳，隱藏其課程`);
          return false;
        }
        
        // 檢查是否有定期班資訊
        if (lesson.dayOfWeek) {
          // 使用定期班邏輯：檢查星期幾是否匹配
          const matchesDay = lesson.dayOfWeek === currentDayName;
          console.log(`學生${lesson.studentId}定期班課程檢查(3): lessonId=${lesson.id}, dayOfWeek=${lesson.dayOfWeek}, queryDay=${currentDayName}, matches=${matchesDay}, subject=${lesson.subject}, time=${lesson.startTime}`);
          return matchesDay;
        } else {
          // 備用方案：使用日期匹配（適用於非定期班課程）
          let lessonDate: string;
          if (typeof lesson.date === 'string') {
            lessonDate = lesson.date.split('T')[0];
          } else if (isValidDate(lesson.date)) {
            lessonDate = format(lesson.date as Date, 'yyyy-MM-dd');
          } else {
            console.warn('無效的課程日期:', lesson.date);
            return false;
          }
          const matchesDate = lessonDate === dateStr;
          // 所有學生都印 log
          console.log(`學生${lesson.studentId}非定期班課程檢查(4): lessonId=${lesson.id}, lessonDate=${lessonDate}, queryDate=${dateStr}, matches=${matchesDate}, subject=${lesson.subject}, time=${lesson.startTime}`);
          return matchesDate;
        }
      } catch (error) {
        console.error('處理課程日期時出錯:', error, lesson);
        return false;
      }
    });
    
    console.log(`找到 ${filteredLessons.length} 個課程在 ${dateStr}`);
    if (filteredLessons.length > 0) {
      console.log('找到的課程:', filteredLessons);
    }
    
    return filteredLessons;
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
        
        // 篩選在學中的學生（包含進行中和暫停中的學生，排除已畢業的學生）
        const activeStudentsList = data
          .filter((student: any) => {
            const status = student.enrollment_status || student.status;
            console.log(`學生 ${student.chinese_name || student.name} 狀態: ${status}`);
            return status === 'active' || status === '進行中' || status === 'Active' || 
                   status === 'inactive' || status === '暫停中' || status === 'Inactive';
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
      console.log('=== 開始載入課程資料 ===');
      console.log('當前時間:', new Date().toISOString());
      
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        console.log('從 API 獲取到的原始課程資料:', data);
        console.log('原始資料筆數:', data.length);
        
        // 檢查是否有重複的學生課程
        const studentCourseCounts = data.reduce((acc: any, schedule: any) => {
          const studentId = schedule.student_id;
          acc[studentId] = (acc[studentId] || 0) + 1;
          return acc;
        }, {});
        
        console.log('每個學生的課程數量:', studentCourseCounts);
        
        // 檢查重複的學生
        const duplicateStudents = Object.entries(studentCourseCounts)
          .filter(([studentId, count]) => (count as number) > 1)
          .map(([studentId, count]) => ({ studentId, count }));
        
        if (duplicateStudents.length > 0) {
          console.warn('發現重複的學生課程:', duplicateStudents);
        }
        
        // 檢查學生編號19的資料
        const student19Data = data.filter((schedule: any) => schedule.student_id === 19);
        console.log('學生編號19的排課資料:', student19Data);
        
        // 將週期性課表轉換為定期班課程（不需要生成具體日期）
        const formattedLessons: Lesson[] = [];
        const currentDate = new Date();
        console.log('當前日期:', currentDate.toISOString());
        
        // 直接處理每個定期班課程，不生成多週的具體日期
        data.forEach((schedule: any) => {
          console.log(`處理排課資料:`, {
            id: schedule.id,
            student_id: schedule.student_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            subject: schedule.subject
          });
          
          // 處理時間格式 - 直接使用 HH:mm 格式
          const extractTime = (timeStr: string): string => {
            if (!timeStr) return '09:00';
            try {
              // 如果已經是 HH:mm 格式，直接返回
              if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
                return timeStr;
              }
              // 如果是 ISO 格式，轉換為 HH:mm
              if (timeStr.includes('T')) {
                const timePart = timeStr.split('T')[1];
                if (timePart) {
                  // 處理時區問題：如果是 UTC 時間，需要轉換為本地時間
                  if (timePart.includes('Z') || timePart.includes('+') || timePart.includes('-')) {
                    // 對於 "1970-01-01T16:00:00.000Z" 這種格式，直接提取時間部分
                    // 因為這是固定的時間，不是實際的日期時間
                    const timeOnly = timePart.split('.')[0]; // 移除毫秒部分
                    return timeOnly.slice(0, 5); // 返回 "16:00"
                  } else {
                    return timePart.slice(0, 5); // 取 HH:mm 部分
                  }
                }
              }
              return '09:00';
            } catch {
              return '09:00';
            }
          };
          
          const startTime = extractTime(schedule.start_time);
          const endTime = extractTime(schedule.end_time);
          console.log(`時間轉換: ${schedule.start_time} -> ${startTime}, ${schedule.end_time} -> ${endTime}`);
          
          // 記錄所有學生的時間轉換詳細資訊
          console.log(`學生${schedule.student_id}時間轉換詳細:`, {
            studentId: schedule.student_id,
            studentName: schedule.student_name || '未知學生',
            originalStartTime: schedule.start_time,
            originalEndTime: schedule.end_time,
            convertedStartTime: startTime,
            convertedEndTime: endTime,
            dayOfWeek: schedule.day_of_week
          });
          
          const lesson = {
            id: schedule.id, // 使用原始ID，不需要為每週生成唯一ID
            studentId: schedule.student_id,
            date: currentDate, // 使用當前日期作為佔位符，實際顯示時會根據星期幾匹配
            startTime,
            endTime,
            subject: schedule.course_name || schedule.subject || '課程',
            notes: '',
            status: 'scheduled' as const,
            // 保存原始的定期班資訊
            dayOfWeek: schedule.day_of_week,
            originalSchedule: schedule
          };
          
          console.log(`新增定期班課程:`, lesson);
          formattedLessons.push(lesson);
        });
        
        console.log('=== 轉換後的課程資料 ===');
        console.log('總課程數:', formattedLessons.length);
        console.log('所有課程:', formattedLessons);
        
        // 檢查學生編號19的轉換後資料
        const student19Lessons = formattedLessons.filter(lesson => lesson.studentId === 19);
        console.log('學生編號19的轉換後課程:', student19Lessons);
        
        setLessons(formattedLessons);
        console.log('=== 課程資料載入完成 ===');
        console.log('最終課程狀態:', formattedLessons);
        
        // 再次檢查轉換後的課程是否有重複
        const finalStudentCourseCounts = formattedLessons.reduce((acc: any, lesson: any) => {
          const studentId = lesson.studentId;
          acc[studentId] = (acc[studentId] || 0) + 1;
          return acc;
        }, {});
        
        console.log('轉換後每個學生的課程數量:', finalStudentCourseCounts);
      } else {
        console.error('課表 API 回應錯誤:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('載入課程資料失敗:', error);
    }
  };

  // 初始載入資料
  useEffect(() => {
    console.log('=== SchedulePage 組件初始化 ===');
    console.log('當前日期:', new Date().toISOString());
    console.log('當前視圖:', view);
    
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
      <Box data-schedule-area sx={{
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
                <Box 
                  key={l.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('月視圖課程項目被點擊:', l.id, studentInfo.name);
                    // 找到對應的學生並開始拖曳
                    const student = activeStudents.find(s => s.id === l.studentId);
                    if (student) {
                      console.log('開始拖曳學生:', student.name);
                      handleStudentClick(student);
                    } else {
                      console.warn('找不到對應的學生:', l.studentId);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  sx={{
                    mt: 0.5,
                    p: 0.5,
                    bgcolor: (() => {
                      const student = activeStudents.find(s => s.id === l.studentId);
                      return student && isStudentPaused(student) ? 'grey.400' : 'primary.light';
                    })(),
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    color: (() => {
                      const student = activeStudents.find(s => s.id === l.studentId);
                      return student && isStudentPaused(student) ? 'grey.700' : 'primary.contrastText';
                    })(),
                    cursor: 'grab',
                    minHeight: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease',
                      boxShadow: 2,
                      bgcolor: (() => {
                        const student = activeStudents.find(s => s.id === l.studentId);
                        return student && isStudentPaused(student) ? 'grey.500' : 'primary.main';
                      })(),
                      cursor: 'grabbing'
                    },
                    '&:active': {
                      cursor: 'grabbing',
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  <Box sx={{ fontWeight: 'bold', flex: 1, fontSize: '0.7rem' }}>
                    {studentInfo.name}：{studentInfo.classType} - 
                    <Box
                      component="span"
                      sx={{
                        ...getLevelColors(studentInfo.levelType),
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        ml: 0.5,
                        minWidth: '24px',
                        textAlign: 'center'
                      }}
                    >
                      {studentInfo.levelType}
                    </Box>
                  </Box>
                  <Box sx={{ 
                    fontSize: '0.5rem', 
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <span>拖曳</span>
                    <Box sx={{ 
                      width: '8px', 
                      height: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}>
                      <Box sx={{ width: '100%', height: '1px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                      <Box sx={{ width: '100%', height: '1px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                      <Box sx={{ width: '100%', height: '1px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                    </Box>
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
    
    // 中文星期對照表 - 修正順序以配合 startOfWeek({ weekStartsOn: 1 })
    const chineseWeekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dayOfWeek = date.getDay(); // 0-6 (0是週日)
      const chineseWeekday = chineseWeekdays[dayOfWeek];
      
      weekDays.push({
        date,
        dayName: `${format(date, 'M月d日')}(${chineseWeekday})`,
        formattedDate: `${format(date, 'MM/dd')} (星期${chineseWeekday})`
      });
    }

    // 拖曳預覽樣式
    const dragPreviewStyle: React.CSSProperties = {
      position: 'fixed',
      left: `${dragPosition.x}px`,
      top: `${dragPosition.y}px`,
      zIndex: 1500,
      pointerEvents: 'none',
      backgroundColor: 'rgba(25, 118, 210, 0.95)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap',
      transform: 'translate(-50%, -50%)',
      display: isDragging ? 'block' : 'none',
      fontSize: '14px',
      fontWeight: 'bold',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(4px)'
    };

    return (
      <Box 
        data-schedule-area
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: 'white', 
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
              正在拖曳: {draggedStudent.name}
              {draggedStudent.originalData?.level_type && (
                <Box
                  component="span"
                  sx={{
                    ...getLevelColors(draggedStudent.originalData.level_type),
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.55rem',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    ml: 0.5,
                    minWidth: '24px',
                    textAlign: 'center'
                  }}
                >
                  {draggedStudent.originalData.level_type}
                </Box>
              )}
            </div>
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
          <Box sx={{ 
            p: 1, 
            textAlign: 'center', 
            fontWeight: 'bold',
            borderRight: '1px solid',
            borderColor: 'divider'
          }}>
            時間
          </Box>
          {weekDays.map((weekDay, index) => (
            <Box key={index} sx={{ 
              p: 1, 
              textAlign: 'center', 
              fontWeight: 'bold',
              borderRight: index < 6 ? '1px solid' : 'none',
              borderColor: 'divider'
            }}>
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
                  borderRight: '1px solid',
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
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('課程項目被點擊:', lesson.id, studentInfo.name);
                            // 找到對應的學生並開始拖曳
                            const student = activeStudents.find(s => s.id === lesson.studentId);
                            if (student) {
                              console.log('開始拖曳學生:', student.name);
                              handleStudentClick(student);
                            } else {
                              console.warn('找不到對應的學生:', lesson.studentId);
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          sx={{
                            mb: 0.5,
                            p: 0.75,
                            bgcolor: (() => {
                              const student = activeStudents.find(s => s.id === lesson.studentId);
                              return student && isStudentPaused(student) ? 'grey.400' : 'primary.light';
                            })(),
                            borderRadius: 1,
                            fontSize: '0.7rem',
                            color: (() => {
                              const student = activeStudents.find(s => s.id === lesson.studentId);
                              return student && isStudentPaused(student) ? 'grey.700' : 'primary.contrastText';
                            })(),
                            cursor: 'grab',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s ease',
                              boxShadow: 2,
                              bgcolor: (() => {
                                const student = activeStudents.find(s => s.id === lesson.studentId);
                                return student && isStudentPaused(student) ? 'grey.500' : 'primary.main';
                              })(),
                              cursor: 'grabbing'
                            },
                            '&:active': {
                              cursor: 'grabbing',
                              transform: 'scale(0.98)'
                            }
                          }}
                        >
                          <Box sx={{ fontWeight: 'bold', flex: 1 }}>
                            {studentInfo.name}：{studentInfo.classType} - 
                            <Box
                              component="span"
                              sx={{
                                ...getLevelColors(studentInfo.levelType),
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontSize: '0.55rem',
                                fontWeight: 'bold',
                                display: 'inline-block',
                                ml: 0.5,
                                minWidth: '24px',
                                textAlign: 'center'
                              }}
                            >
                              {studentInfo.levelType}
                            </Box>
                          </Box>
                          <Box sx={{ 
                            fontSize: '0.6rem', 
                            opacity: 0.8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>拖曳</span>
                            <Box sx={{ 
                              width: '12px', 
                              height: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1px'
                            }}>
                              <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                              <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                              <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                            </Box>
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
    <Box data-schedule-area sx={{
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
            p: 0.75,
            minHeight: 112,
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}>
            {getLessonsForTimeSlot(currentDate, time).map(l => {
              const studentInfo = getStudentInfo(l.studentId);
              return (
                <Box 
                  key={l.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('日視圖課程項目被點擊:', l.id, studentInfo.name);
                    // 找到對應的學生並開始拖曳
                    const student = activeStudents.find(s => s.id === l.studentId);
                    if (student) {
                      console.log('開始拖曳學生:', student.name);
                      handleStudentClick(student);
                    } else {
                      console.warn('找不到對應的學生:', l.studentId);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  sx={{
                    mb: 0.5,
                    p: 0.75,
                    bgcolor: (() => {
                      const student = activeStudents.find(s => s.id === l.studentId);
                      return student && isStudentPaused(student) ? 'grey.400' : 'primary.light';
                    })(),
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    color: (() => {
                      const student = activeStudents.find(s => s.id === l.studentId);
                      return student && isStudentPaused(student) ? 'grey.700' : 'primary.main';
                    })(),
                    cursor: 'grab',
                    minHeight: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease',
                      boxShadow: 2,
                      bgcolor: (() => {
                        const student = activeStudents.find(s => s.id === l.studentId);
                        return student && isStudentPaused(student) ? 'grey.500' : 'primary.main';
                      })(),
                      color: (() => {
                        const student = activeStudents.find(s => s.id === l.studentId);
                        return student && isStudentPaused(student) ? 'grey.800' : 'primary.contrastText';
                      })(),
                      cursor: 'grabbing'
                    },
                    '&:active': {
                      cursor: 'grabbing',
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  <Box sx={{ fontWeight: 'bold' }}>
                    {studentInfo.name}：{studentInfo.classType} - 
                    <Box
                      component="span"
                      sx={{
                        ...getLevelColors(studentInfo.levelType),
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        ml: 0.5,
                        minWidth: '24px',
                        textAlign: 'center'
                      }}
                    >
                      {studentInfo.levelType}
                    </Box>
                  </Box>
                  <Box sx={{ 
                    fontSize: '0.7rem', 
                    mt: 0.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{l.startTime} - {l.endTime}</span>
                    <Box sx={{ 
                      fontSize: '0.6rem', 
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>拖曳</span>
                      <Box sx={{ 
                        width: '10px', 
                        height: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px'
                      }}>
                        <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                        <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                        <Box sx={{ width: '100%', height: '2px', bgcolor: 'currentColor', borderRadius: '1px' }} />
                      </Box>
                    </Box>
                  </Box>
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
                                  : isStudentPaused(student)
                                    ? 'grey.400'
                                    : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : isStudentPaused(student)
                                    ? 'grey.700'
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
                                  : isStudentPaused(student)
                                    ? 'grey.400'
                                    : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : isStudentPaused(student)
                                    ? 'grey.700'
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
                                  : isStudentPaused(student)
                                    ? 'grey.400'
                                    : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : isStudentPaused(student)
                                    ? 'grey.700'
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
                                  : isStudentPaused(student)
                                    ? 'grey.400'
                                    : 'action.selected',
                                color: selectedStudents.some(s => s.id === student.id)
                                  ? 'primary.contrastText'
                                  : isStudentPaused(student)
                                    ? 'grey.700'
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
