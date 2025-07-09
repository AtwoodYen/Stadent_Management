import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress
} from '@mui/material';
import StudentFormOptimized from '../components/StudentFormOptimized';
import StudentDetailView from '../components/StudentDetailView';
import CustomAlert from '../components/CustomAlert';
import { getLevelColors } from '../utils/levelColors';
import { getGenderColors } from '../utils/genderColors';

interface Student {
  id: number;
  chinese_name: string;
  english_name: string;
  student_phone: string;
  student_email: string;
  student_line: string;
  father_name: string;
  father_phone: string;
  father_line: string;
  mother_name: string;
  mother_phone: string;
  mother_line: string;
  school: string;
  grade: string;
  gender: string;
  level_type: string;
  class_type: string;
  enrollment_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  class_schedule_type: string; // 新增：常態班/短期班
}

interface ClassType {
  class_code: string;
  class_name: string;
  description: string;
  sort_order: number;
}

interface SortConfig {
  key: keyof Student | 'class_type_name';
  direction: 'asc' | 'desc';
}

const StudentsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [sortOptions, setSortOptions] = useState({
    school: '',
    grade: '',
    level: '',
    gender: '',
    classType: '',
    enrollmentStatus: '',
    classScheduleType: '' // 新增
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'chinese_name',
    direction: 'asc'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新增：分頁選單狀態
  const [activeTab, setActiveTab] = useState<'students' | 'stats'>('students');
  
  // 編輯相關狀態
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 統計資料狀態
  const [studentStats, setStudentStats] = useState<any>(null);
  const [classTypeStats, setClassTypeStats] = useState<any[]>([]);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 自定義 Alert 狀態
  const [customAlert, setCustomAlert] = useState({
    open: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    title: ''
  });

  // 顯示自定義 Alert 的函數
  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', title?: string) => {
    setCustomAlert({
      open: true,
      message,
      type,
      title: title || ''
    });
  };

  const closeAlert = () => {
    setCustomAlert(prev => ({ ...prev, open: false }));
  };

  // 取得學生資料
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sortOptions.school) params.append('school', sortOptions.school);
      if (sortOptions.grade) params.append('grade', sortOptions.grade);
      if (sortOptions.level) params.append('level_type', sortOptions.level);
      if (sortOptions.gender) params.append('gender', sortOptions.gender);
      if (sortOptions.classType) params.append('class_type', sortOptions.classType);
      if (sortOptions.enrollmentStatus) params.append('enrollment_status', sortOptions.enrollmentStatus);
      if (sortOptions.classScheduleType) params.append('class_schedule_type', sortOptions.classScheduleType);
      
      const response = await fetch(`/api/students?${params}`);
      if (!response.ok) {
        throw new Error('無法取得學生資料');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 取得學校列表
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/students/schools');
      if (!response.ok) {
        throw new Error('無法取得學校列表');
      }
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      console.error('取得學校列表失敗:', err);
    }
  };

  // 取得班別列表
  const fetchClassTypes = async () => {
    try {
      const response = await fetch('/api/class-types');
      if (!response.ok) {
        throw new Error('無法取得班別列表');
      }
      const data = await response.json();
      setClassTypes(data);
    } catch (err) {
      console.error('取得班別列表失敗:', err);
    }
  };

  // 取得詳細統計資料
  const fetchDetailedStats = async () => {
    try {
      setStatsLoading(true);
      
      // 並行調用多個統計API
      const [studentStatsRes, classTypeStatsRes, scheduleStatsRes] = await Promise.all([
        fetch('/api/students/stats'),
        fetch('/api/class-types/stats'),
        fetch('/api/schedules/stats')
      ]);

      if (studentStatsRes.ok) {
        const studentStatsData = await studentStatsRes.json();
        setStudentStats(studentStatsData);
      }

      if (classTypeStatsRes.ok) {
        const classTypeStatsData = await classTypeStatsRes.json();
        setClassTypeStats(classTypeStatsData);
      }

      if (scheduleStatsRes.ok) {
        const scheduleStatsData = await scheduleStatsRes.json();
        setScheduleStats(scheduleStatsData);
      }
    } catch (err) {
      console.error('取得統計資料失敗:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSchools();
    fetchClassTypes();
  }, [sortOptions]);

  // 當切換到統計頁面時，取得詳細統計資料
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchDetailedStats();
    }
  }, [activeTab]);

  // 計算統計資料
  const totalStudents = students.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);

  // 按學校統計
  const schoolStats = schools.map(school => ({
    school,
    count: students.filter(s => s.school === school).length
  }));

  // 按年級統計
  const allGrades = [
    '小一', '小二', '小三', '小四', '小五', '小六',
    '國一', '國二', '國三',
    '高一', '高二', '高三',
    '大一', '大二', '大三', '大四'
  ];
  
  const gradeStats = allGrades.map(grade => ({
    grade,
    count: students.filter(s => s.grade === grade).length
  })).filter(stat => stat.count > 0); // 只顯示有學生的年級

  // 排序學生資料
  const sortStudents = (students: Student[]) => {
    return [...students].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'class_type_name') {
        aValue = getClassTypeName(a.class_type);
        bValue = getClassTypeName(b.class_type);
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      // 處理空值
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      // 字串比較
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'zh-TW');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // 數字比較
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 預設字串比較
      const comparison = String(aValue).localeCompare(String(bValue), 'zh-TW');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  // 獲取當前頁面的學生
  const getCurrentPageStudents = () => {
    const sortedStudents = sortStudents(students);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return sortedStudents.slice(startIndex, endIndex);
  };

  // 根據班別代碼獲取班別名稱
  const getClassTypeName = (classCode: string) => {
    const classType = classTypes.find(ct => ct.class_code === classCode);
    return classType ? classType.class_name : classCode;
  };

  // 處理排序
  const handleSort = (key: keyof Student | 'class_type_name') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 獲取排序圖示
  const getSortIcon = (key: keyof Student | 'class_type_name') => {
    if (sortConfig.key !== key) {
      return '⇅'; // 未排序
    }
    return sortConfig.direction === 'asc' ? '⇑' : '⇓';
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSortChange = (field: string, value: string) => {
    setSortOptions(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // 重置到第一頁
  };

  const handleStudentsPerPageChange = (value: number) => {
    setStudentsPerPage(value);
    setCurrentPage(1); // 重置到第一頁
  };

  // 編輯相關事件處理函數
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleViewStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowEditModal(true);
  };

  const confirmDeleteStudent = () => {
    if (!selectedStudent) return;
    
    // 顯示密碼驗證模態框
    setShowDeleteModal(false);
    setShowPasswordModal(true);
    setPasswordError('');
    setAdminPassword('');
  };

  const verifyPasswordAndDelete = async () => {
    if (!selectedStudent || !adminPassword) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    try {
      // 先驗證管理員密碼
      const verifyResponse = await fetch('/api/auth/validate-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setPasswordError(errorData.message || '密碼驗證失敗');
        return;
      }

      // 密碼驗證成功，執行刪除
      const deleteResponse = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        throw new Error('刪除學生失敗');
      }
      
      // 重新載入資料
      fetchStudents();
      setShowPasswordModal(false);
      setSelectedStudent(null);
      setAdminPassword('');
      showAlert('學生已成功刪除', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    try {
      setIsSaving(true);
      const method = selectedStudent ? 'PUT' : 'POST';
      const url = selectedStudent ? `/api/students/${selectedStudent.id}` : '/api/students';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        // 嘗試解析詳細錯誤信息
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            // 將所有驗證錯誤組合成一個清楚的訊息
            const errorMessages = errorData.errors.map((error: any) => error.msg).join('\n');
            throw new Error(`儲存失敗，請檢查以下問題：\n${errorMessages}`);
          } else if (errorData.error) {
            throw new Error(`儲存失敗：${errorData.error}`);
          }
        } catch (parseError) {
          // 如果無法解析錯誤響應，使用通用錯誤訊息
          throw new Error('儲存學生資料失敗，請檢查網路連線或聯繫系統管理員');
        }
      }
      
      // 重新載入資料
      fetchStudents();
      setShowEditModal(false);
      setSelectedStudent(null);
      showAlert(selectedStudent ? '學生資料已更新' : '學生已新增', 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : '儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setShowPasswordModal(false);
    setSelectedStudent(null);
    setAdminPassword('');
    setPasswordError('');
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>載入中...</h2>
            <p>正在取得學生資料</p>
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
              fetchStudents();
              fetchSchools();
            }}>
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
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
            variant={activeTab === 'students' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('students')}
            sx={{
              backgroundColor: activeTab === 'students' ? 'primary.main' : '#e0e0e0',
              color: activeTab === 'students' ? 'white' : '#000000',
              '&:hover': {
                backgroundColor: activeTab === 'students' ? 'primary.dark' : '#d0d0d0'
              }
            }}
          >
            📋 學生列表
          </Button>

          <Button
            variant={activeTab ==='stats' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('stats')}
            sx={{
              backgroundColor: activeTab === 'stats' ? 'primary.main' : '#e0e0e0',
              color: activeTab === 'stats' ? 'white' : '#000000',
              '&:hover': {
                backgroundColor: activeTab === 'stats' ? 'primary.dark' : '#d0d0d0'
              }
            }}
          >
            📊 學生統計
          </Button>
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

          {/* 學生列表區域 */}
          {activeTab === 'students' && (
            <>
              {/* 分頁 & 篩選 & 新增 */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2,
                }}
              >
                {/* 頁碼控制 */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Button
                    size="small"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    sx={{
                      backgroundColor: 'black',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                      '&:disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    ‹ 上一頁
                  </Button>
                  <Typography>
                    {currentPage} / {totalPages}
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    sx={{
                      backgroundColor: 'black',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                      '&:disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    下一頁 ›
                  </Button>
                </Stack>

                {/* 每頁筆數 */}
                <FormControl size="small" sx={{ position: 'absolute', left: '25%' }}>
                  <InputLabel>每頁</InputLabel>
                  <Select
                    value={studentsPerPage}
                    label="每頁"
                    onChange={(e) =>
                      handleStudentsPerPageChange(Number(e.target.value))
                    }
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 篩選選單 */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[
                    { label: '學校', field: 'school', options: schools },
                    { label: '年級', field: 'grade', options: allGrades },
                    { label: '程度', field: 'level', options: ['新手', '入門', '進階', '高階', '精英'] },
                    { label: '性別', field: 'gender', options: ['男', '女'] },
                    {
                      label: '班別',
                      field: 'classType',
                      options: classTypes.map((ct) => ct.class_name),
                    },
                    {
                      label: '排程類型',
                      field: 'classScheduleType',
                      options: ['常態班', '短期班'],
                    },
                    {
                      label: '就讀狀態',
                      field: 'enrollmentStatus',
                      options: ['進行中', '暫停中', '已畢業'],
                    },
                  ].map(({ label, field, options }) => {
                    // 根據欄位設定不同的寬度
                    let width = '140px'; // 預設寬度
                    if (field === 'school') width = '112px'; // 縮小20%
                    else if (field === 'grade' || field === 'level') width = '98px'; // 縮小30%
                    else if (field === 'gender') width = '70px'; // 縮小50%
                    else if (field === 'classScheduleType') width = '126px'; // 縮小10%
                    else if (field === 'enrollmentStatus') width = '112px'; // 縮小20%
                    
                    return (
                      <FormControl key={field} size="small" sx={{ minWidth: width }}>
                        <InputLabel>{label}</InputLabel>
                        <Select
                          value={sortOptions[field as keyof typeof sortOptions]}
                          label={label}
                          onChange={(e) =>
                            handleSortChange(field, e.target.value as string)
                          }
                        >
                          <MenuItem value="">不限</MenuItem>
                          {options.map((opt: any) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  })}
                </Stack>

                {/* 新增學生按鈕 */}
                <Button variant="contained" onClick={handleAddStudent}>
                  + 新增學生
                </Button>
              </Box>

              {/* 學生列表表格 */}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        { key: 'chinese_name', label: '中文姓名' },
                        { key: 'english_name', label: '英文姓名' },
                        { key: 'school', label: '學校' },
                        { key: 'grade', label: '年級' },
                        { key: 'gender', label: '性別' },
                        { key: 'level_type', label: '程度' },
                        { key: 'class_type_name', label: '班別' },
                        { key: 'class_schedule_type', label: '排程類型' },
                        { key: 'enrollment_status', label: '就讀狀態' },
                        { key: 'actions', label: '操作' },
                      ].map(({ key, label }) => (
                        <TableCell key={key}>
                          {key !== 'actions' ? (
                            <Box
                              component="span"
                              sx={{
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                              onClick={() => handleSort(key as any)}
                            >
                              {label}
                              <Box component="span" sx={{ ml: 0.5 }}>
                                {getSortIcon(key as any)}
                              </Box>
                            </Box>
                          ) : (
                            label
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentPageStudents().map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.chinese_name}</TableCell>
                        <TableCell>{student.english_name}</TableCell>
                        <TableCell>{student.school}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              ...getGenderColors(student.gender),
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 1,
                              textAlign: 'center',
                              minWidth: '24px',
                              display: 'inline-block'
                            }}
                          >
                            {student.gender || '未設定'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              ...getLevelColors(student.level_type),
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 1,
                              textAlign: 'center',
                              minWidth: '48px',
                              display: 'inline-block'
                            }}
                          >
                            {student.level_type}
                          </Box>
                        </TableCell>
                        <TableCell>{getClassTypeName(student.class_type)}</TableCell>
                        <TableCell>{student.class_schedule_type}</TableCell>
                        <TableCell>{student.enrollment_status}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              onClick={() => handleViewStudentDetail(student)}
                            >
                              詳情
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleEditStudent(student)}
                            >
                              編輯
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteStudent(student)}
                            >
                              刪除
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        

          {/* 統計資料區域 */}
          {activeTab === 'stats' && (
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>📊 詳細學生統計資料</Typography>
              
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* 基本統計卡片 */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>基本統計</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, textAlign: 'center', minWidth: 120 }}>
                        <Typography variant="h4">{totalStudents}</Typography>
                        <Typography>總學生數</Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center', minWidth: 120 }}>
                        <Typography variant="h4">{students.filter(s => s.gender === '男').length}</Typography>
                        <Typography>男學生</Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center', minWidth: 120 }}>
                        <Typography variant="h4">{students.filter(s => s.gender === '女').length}</Typography>
                        <Typography>女學生</Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center', minWidth: 120 }}>
                        <Typography variant="h4">{students.filter(s => s.class_schedule_type === '常態班').length}</Typography>
                        <Typography>常態班</Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1, textAlign: 'center', minWidth: 120 }}>
                        <Typography variant="h4">{students.filter(s => s.class_schedule_type === '短期班').length}</Typography>
                        <Typography>短期班</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* 學校分布統計 */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>學校分布</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {schoolStats
                        .filter(stat => stat.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                        .map((stat, index) => (
                          <Paper key={stat.school} sx={{ p: 2, textAlign: 'center', minWidth: 120, flex: '1 1 200px' }}>
                            <Typography variant="h6" color="primary">{stat.count}</Typography>
                            <Typography variant="body2" color="text.secondary">{stat.school}</Typography>
                          </Paper>
                        ))}
                    </Stack>
                  </Box>

                  {/* 年級分布統計 */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>年級分布</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {gradeStats
                        .sort((a, b) => {
                          const gradeOrder = ['小一', '小二', '小三', '小四', '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'];
                          return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
                        })
                        .map((stat, index) => (
                          <Paper key={stat.grade} sx={{ p: 2, textAlign: 'center', minWidth: 80, flex: '1 1 120px' }}>
                            <Typography variant="h6" color="secondary">{stat.count}</Typography>
                            <Typography variant="body2" color="text.secondary">{stat.grade}</Typography>
                          </Paper>
                        ))}
                    </Stack>
                  </Box>

                  {/* 程度分布統計 */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>程度分布</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {['新手', '入門', '進階', '高階', '精英'].map(level => {
                        const count = students.filter(s => s.level_type === level).length;
                        return (
                          <Paper key={level} sx={{ p: 2, textAlign: 'center', minWidth: 80, flex: '1 1 120px' }}>
                            <Typography variant="h6" color="success.main">{count}</Typography>
                            <Typography variant="body2" color="text.secondary">{level}</Typography>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* 班別統計 */}
                  {classTypeStats.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>班別統計</Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {classTypeStats
                          .filter(stat => stat.student_count > 0)
                          .sort((a, b) => b.student_count - a.student_count)
                          .map((stat, index) => (
                            <Paper key={stat.class_code} sx={{ p: 2, minWidth: 250, flex: '1 1 300px' }}>
                              <Typography variant="h6" color="primary">{stat.class_name}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {stat.description}
                              </Typography>
                              <Typography variant="h5" color="success.main">{stat.student_count} 位學生</Typography>
                            </Paper>
                          ))}
                      </Stack>
                    </Box>
                  )}

                  {/* 課表統計 */}
                  {scheduleStats && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>課表統計</Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Paper sx={{ p: 2, textAlign: 'center', minWidth: 150, flex: '1 1 200px' }}>
                          <Typography variant="h6" color="primary">
                            {scheduleStats.find((s: any) => s.total_schedules)?.total_schedules || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">總課表數</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, textAlign: 'center', minWidth: 150, flex: '1 1 200px' }}>
                          <Typography variant="h6" color="success.main">
                            {scheduleStats.find((s: any) => s.students_with_schedules)?.students_with_schedules || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">有課表學生</Typography>
                        </Paper>
                      </Stack>
                      
                      {/* 按星期統計 */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>按星期分布</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map(day => {
                            const dayStats = scheduleStats.find((s: any) => s.day_of_week === day);
                            const count = dayStats?.schedules_per_day || 0;
                            return (
                              <Paper key={day} sx={{ p: 1, textAlign: 'center', minWidth: 80, flex: '1 1 100px' }}>
                                <Typography variant="body2" color="text.secondary">{day}</Typography>
                                <Typography variant="h6" color="info.main">{count}</Typography>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Box>
                  )}

                  {/* 就讀狀態統計 */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>就讀狀態</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {['進行中', '暫停中', '已畢業'].map(status => {
                        const count = students.filter(s => s.enrollment_status === status).length;
                        const color = status === '進行中' ? 'success.main' : status === '暫停中' ? 'warning.main' : 'error.main';
                        return (
                          <Paper key={status} sx={{ p: 2, textAlign: 'center', minWidth: 120, flex: '1 1 200px' }}>
                            <Typography variant="h6" color={color}>{count}</Typography>
                            <Typography variant="body2" color="text.secondary">{status}</Typography>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* 編輯模態框 */}
        <Dialog 
          open={showEditModal} 
          onClose={closeModals} 
          maxWidth={false}
          fullWidth
          slotProps={{
            paper: {
              sx: {
                maxWidth: '1104px',
                width: '93vw',
              }
            }
          }}
        >
          <DialogTitle>
            {selectedStudent ? '編輯學生' : '新增學生'}
          </DialogTitle>
          <DialogContent sx={{ mt: -2.5 }}>
            <Box sx={{ pt: 2 }}>
              <StudentFormOptimized
                student={selectedStudent}
                onSave={handleSaveStudent}
                onCancel={closeModals}
                isLoading={isSaving}
              />
            </Box>
          </DialogContent>
        </Dialog>

        {/* 刪除確認模態框 */}
        <Dialog open={showDeleteModal} onClose={closeModals} maxWidth="sm" fullWidth>
          <DialogTitle>確認刪除</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                確定要刪除學生「{selectedStudent?.chinese_name}」嗎？
              </Typography>
              <Alert severity="warning">
                此操作無法復原！
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModals}>取消</Button>
            <Button onClick={confirmDeleteStudent} color="error" variant="contained">
              確認刪除
            </Button>
          </DialogActions>
        </Dialog>

        {/* 管理員密碼驗證模態框 */}
        <Dialog open={showPasswordModal} onClose={closeModals} maxWidth="sm" fullWidth>
          <DialogTitle>管理員密碼驗證</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ⚠️ 您即將刪除學生：<strong>{selectedStudent?.chinese_name}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                只有系統管理員才能執行刪除操作，請輸入您的管理員密碼以確認身份：
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="管理員密碼"
                value={adminPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    verifyPasswordAndDelete();
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModals}>取消</Button>
            <Button 
              onClick={verifyPasswordAndDelete} 
              color="error" 
              variant="contained"
              disabled={!adminPassword.trim()}
            >
              確認刪除
            </Button>
          </DialogActions>
        </Dialog>

        {/* 詳情模態框 */}
        <Dialog 
          open={showDetailModal} 
          onClose={closeModals} 
          maxWidth={false}
          fullWidth
          slotProps={{
            paper: {
              sx: {
                maxWidth: '900px',
                width: '90vw',
              }
            }
          }}
        >
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ pt: 0 }}>
              {selectedStudent && (
                <StudentDetailView
                  student={selectedStudent}
                  onEdit={handleEditFromDetail}
                  onDelete={() => handleDeleteStudent(selectedStudent)}
                  onClose={closeModals}
                />
              )}
            </Box>
          </DialogContent>
        </Dialog>

        {/* 自定義 Alert 組件 */}
        <CustomAlert
          open={customAlert.open}
          onClose={closeAlert}
          message={customAlert.message}
          type={customAlert.type}
          title={customAlert.title}
        />
      </Box>
    </React.Fragment>
  );
};

export default StudentsPage;