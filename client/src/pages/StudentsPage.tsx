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
  TextField
} from '@mui/material';
import StudentFormOptimized from '../components/StudentFormOptimized';
import StudentDetailView from '../components/StudentDetailView';
import CustomAlert from '../components/CustomAlert';
import { getLevelColors } from '../utils/levelColors';
import { getGenderColors } from '../utils/genderColors';
import '../styles/improved-student-form.css';
import '../styles/level-colors.css';
import '../styles/gender-colors.css';

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

  useEffect(() => {
    fetchStudents();
    fetchSchools();
    fetchClassTypes();
  }, [sortOptions]);

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
      <div className="container">        

        {/* 分頁按鈕區域 */}
        <div className="tab-navigation" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0px',
            marginTop: '10px'
          }}>
            <button
              className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              style={{
                padding: '12px 24px',
                marginRight: '10px',
                border: '2px solid #1976d2',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: activeTab === 'students' ? '#1976d2' : 'white',
                color: activeTab === 'students' ? 'white' : '#1976d2',
                transition: 'all 0.3s ease'
              }}
            >
              📋 學生列表
            </button>
            <button
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '12px 24px',
                border: '2px solid #1976d2',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: activeTab === 'stats' ? '#1976d2' : 'white',
                color: activeTab === 'stats' ? 'white' : '#1976d2',
                transition: 'all 0.3s ease'
              }}
            >
              📊 學生統計
            </button>
          </div>

        {/* 內容區 */}
        <div className="main-content" style={{
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>

          {/* 學生列表區域 */}
          {activeTab === 'students' && (
            <div className="calendar-section" style={{ marginTop: '20px' }}>
              <div className="calendar-header">
                <div className="calendar-nav">
                  <div className="pagination-controls">
                    <button 
                      className="btn" 
                      onClick={handlePrevPage} 
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.6 : 1
                      }}
                    >
                      ‹ 上一頁
                    </button>
                    <div className="page-info">
                      {currentPage} / {totalPages}
                    </div>
                    <button 
                      className="btn" 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.6 : 1
                      }}
                    >
                      下一頁 ›
                    </button>
                    <select 
                      value={studentsPerPage} 
                      onChange={(e) => handleStudentsPerPageChange(Number(e.target.value))}
                      className="per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  
                  {/* 排序選項 */}
                  <div className="sort-options">
                    <select 
                      value={sortOptions.school} 
                      onChange={(e) => handleSortChange('school', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">學校</option>
                      {schools.map((school) => (
                        <option key={school} value={school}>{school}</option>
                      ))}
                    </select>
                    
                    <select 
                      value={sortOptions.grade} 
                      onChange={(e) => handleSortChange('grade', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">年級</option>
                      <optgroup label="小學">
                        <option value="小一">小一</option>
                        <option value="小二">小二</option>
                        <option value="小三">小三</option>
                        <option value="小四">小四</option>
                        <option value="小五">小五</option>
                        <option value="小六">小六</option>
                      </optgroup>
                      <optgroup label="國中">
                        <option value="國一">國一</option>
                        <option value="國二">國二</option>
                        <option value="國三">國三</option>
                      </optgroup>
                      <optgroup label="高中">
                        <option value="高一">高一</option>
                        <option value="高二">高二</option>
                        <option value="高三">高三</option>
                      </optgroup>
                      <optgroup label="大學">
                        <option value="大一">大一</option>
                        <option value="大二">大二</option>
                        <option value="大三">大三</option>
                        <option value="大四">大四</option>
                      </optgroup>
                    </select>
                    
                    <select 
                      value={sortOptions.level} 
                      onChange={(e) => handleSortChange('level', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">程度</option>
                      <option value="新手">新手</option>
                      <option value="入門">入門</option>
                      <option value="進階">進階</option>
                      <option value="高階">高階</option>
                      <option value="精英">精英</option>
                    </select>
                    
                    <select 
                      value={sortOptions.gender} 
                      onChange={(e) => handleSortChange('gender', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">性別</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                    
                    <select 
                      value={sortOptions.classType} 
                      onChange={(e) => handleSortChange('classType', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">班別</option>
                      {classTypes.map((classType) => (
                        <option key={classType.class_code} value={classType.class_code}>
                          {classType.class_name}
                        </option>
                      ))}
                    </select>
                    
                    <select 
                      value={sortOptions.enrollmentStatus} 
                      onChange={(e) => handleSortChange('enrollmentStatus', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">就讀狀態</option>
                      <option value="進行中">進行中</option>
                      <option value="暫停中">暫停中</option>
                      <option value="已畢業">已畢業</option>
                    </select>

                    <select 
                      value={sortOptions.classScheduleType} 
                      onChange={(e) => handleSortChange('classScheduleType', e.target.value)}
                      className="sort-select"
                    >
                      <option value="">班級排程類型</option>
                      <option value="常態班">常態班</option>
                      <option value="短期班">短期班</option>
                    </select>
                  </div>
                </div>
                <div className="calendar-controls">
                  <span className="student-count" style={{ marginLeft: '20px', marginRight: '-5px' }}>總共 {totalStudents} 位學生</span>
                  <button className="btn btn-secondary" onClick={handleAddStudent}>+ 新增學生</button>
                </div>
              </div>

              {/* 學生列表表格 */}
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'chinese_name' ? 'active' : ''}`}
                        onClick={() => handleSort('chinese_name')}
                      >
                        中文姓名<span className="sort-icon">{getSortIcon('chinese_name')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'english_name' ? 'active' : ''}`}
                        onClick={() => handleSort('english_name')}
                      >
                        英文姓名<span className="sort-icon">{getSortIcon('english_name')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'school' ? 'active' : ''}`}
                        onClick={() => handleSort('school')}
                      >
                        學校<span className="sort-icon">{getSortIcon('school')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'grade' ? 'active' : ''}`}
                        onClick={() => handleSort('grade')}
                      >
                        年級<span className="sort-icon">{getSortIcon('grade')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'gender' ? 'active' : ''}`}
                        onClick={() => handleSort('gender')}
                      >
                        性別<span className="sort-icon">{getSortIcon('gender')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'level_type' ? 'active' : ''}`}
                        onClick={() => handleSort('level_type')}
                      >
                        程度<span className="sort-icon">{getSortIcon('level_type')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'class_type_name' ? 'active' : ''}`}
                        onClick={() => handleSort('class_type_name')}
                      >
                        班別<span className="sort-icon">{getSortIcon('class_type_name')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'enrollment_status' ? 'active' : ''}`}
                        onClick={() => handleSort('enrollment_status')}
                      >
                        就讀狀態<span className="sort-icon">{getSortIcon('enrollment_status')}</span>
                      </th>
                      <th 
                        className={`sortable-header ${sortConfig.key === 'class_schedule_type' ? 'active' : ''}`}
                        onClick={() => handleSort('class_schedule_type')}
                      >
                        班級排程類型<span className="sort-icon">{getSortIcon('class_schedule_type')}</span>
                      </th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageStudents().map((student) => (
                      <tr key={student.id} className="student-row">
                        <td className="student-chinese-name">{student.chinese_name}</td>
                        <td className="student-english-name">{student.english_name}</td>
                        <td>
                          <span className="badge badge-school">{student.school}</span>
                        </td>
                        <td>
                          <span className="badge badge-grade">{student.grade}</span>
                        </td>
                        <td>
                          <span 
                            className={`badge badge-gender gender-${student.gender || '未設定'}`}
                          >
                            {student.gender || '未設定'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`badge badge-level level-${student.level_type || '未設定'}`}
                          >
                            {student.level_type || '未設定'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge badge-class"
                            style={{
                              backgroundColor: student.class_type === 'CPP' ? '#e3f2fd' : // 淺藍色 - C/C++
                                     student.class_type === 'PROJECT' ? '#f3e5f5' : // 淺紫色 - 專題製作
                                     student.class_type === 'SCRATCH' ? '#e8f5e8' : // 淺綠色 - Scratch
                                     student.class_type === 'APCS_A' ? '#fff3e0' : // 淺橙色 - APCS A
                                     student.class_type === 'APCS_P' ? '#fce4ec' : // 淺粉色 - APCS P
                                     student.class_type === 'ANIMATION' ? '#f1f8e9' : // 淺青綠色 - 動畫美術
                                     student.class_type === 'PYTHON' ? '#fff8e1' : // 淺黃色 - Python
                                     '#f5f5f5', // 預設灰色
                              color: student.class_type === 'CPP' ? '#1976d2' : // 深藍色
                                     student.class_type === 'PROJECT' ? '#7b1fa2' : // 深紫色
                                     student.class_type === 'SCRATCH' ? '#388e3c' : // 深綠色
                                     student.class_type === 'APCS_A' ? '#f57c00' : // 深橙色
                                     student.class_type === 'APCS_P' ? '#c2185b' : // 深粉色
                                     student.class_type === 'ANIMATION' ? '#689f38' : // 深青綠色
                                     student.class_type === 'PYTHON' ? '#f57f17' : // 深黃色 - Python
                                     '#757575', // 預設深灰色
                              border: student.class_type ? '1px solid' : 'none',
                              borderColor: student.class_type === 'CPP' ? '#1976d2' :
                                          student.class_type === 'PROJECT' ? '#7b1fa2' :
                                          student.class_type === 'SCRATCH' ? '#388e3c' :
                                          student.class_type === 'APCS_A' ? '#f57c00' :
                                          student.class_type === 'APCS_P' ? '#c2185b' :
                                          student.class_type === 'ANIMATION' ? '#689f38' :
                                          student.class_type === 'PYTHON' ? '#f57f17' :
                                          'transparent'
                            }}
                          >
                            {getClassTypeName(student.class_type)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge badge-enrollment-status"
                            style={{
                              backgroundColor: student.enrollment_status === '進行中' ? '#e8f5e8' : // 淺綠色
                                     student.enrollment_status === '暫停中' ? '#fff3e0' : // 淺橙色
                                     student.enrollment_status === '已畢業' ? '#f3e5f5' : // 淺紫色
                                     '#f5f5f5', // 預設灰色
                              color: student.enrollment_status === '進行中' ? '#388e3c' : // 深綠色
                                     student.enrollment_status === '暫停中' ? '#f57c00' : // 深橙色
                                     student.enrollment_status === '已畢業' ? '#7b1fa2' : // 深紫色
                                     '#757575', // 預設深灰色
                              border: student.enrollment_status ? '1px solid' : 'none',
                              borderColor: student.enrollment_status === '進行中' ? '#388e3c' :
                                          student.enrollment_status === '暫停中' ? '#f57c00' :
                                          student.enrollment_status === '已畢業' ? '#7b1fa2' :
                                          'transparent'
                            }}
                          >
                            {student.enrollment_status || '未設定'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge badge-class-schedule-type"
                            style={{
                              backgroundColor: student.class_schedule_type === '常態班' ? '#e3f2fd' : student.class_schedule_type === '短期班' ? '#fff3e0' : '#f5f5f5',
                              color: student.class_schedule_type === '常態班' ? '#1976d2' : student.class_schedule_type === '短期班' ? '#f57c00' : '#757575',
                              border: student.class_schedule_type ? '1px solid' : 'none',
                              borderColor: student.class_schedule_type === '常態班' ? '#1976d2' : student.class_schedule_type === '短期班' ? '#f57c00' : 'transparent'
                            }}
                          >
                            {student.class_schedule_type || '未設定'}
                          </span>
                        </td>
                        <td className="student-actions">
                          <button 
                            className="btn-small btn-edit"
                            onClick={() => handleEditStudent(student)}
                          >
                            編輯
                          </button>
                          <button 
                            className="btn-small btn-delete"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            刪除
                          </button>
                          <button 
                            className="btn-small btn-schedule"
                            onClick={() => handleViewStudentDetail(student)}
                          >
                            詳情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 統計資料區域 */}
          {activeTab === 'stats' && (
            <div className="stats-section" style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto',
              marginTop: '15px'
            }}>
              <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>📊 學生統計資料</h2>
              
              {/* 基本統計 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #1976d2'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{totalStudents}</div>
                  <div style={{ color: '#1976d2' }}>總學生數</div>
                </div>
                <div style={{
                  backgroundColor: '#ffebee',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #d32f2f'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#d32f2f' }}>{students.filter(s => !s.is_active).length}</div>
                  <div style={{ color: '#d32f2f' }}>停用學生</div>
                </div>
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #388e3c'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>{students.filter(s => s.gender === '男').length}</div>
                  <div style={{ color: '#388e3c' }}>男學生</div>
                </div>
                <div style={{
                  backgroundColor: '#fce4ec',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #c2185b'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#c2185b' }}>{students.filter(s => s.gender === '女').length}</div>
                  <div style={{ color: '#c2185b' }}>女學生</div>
                </div>
              </div>

              {/* 學校統計 */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>🏫 學校分布</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  {schoolStats.map((stat) => (
                    <div key={stat.school} style={{
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e0e0e0'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{stat.school}</span>
                      <span style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}>
                        {stat.count}人
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 年級統計 */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>📚 年級分布</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {gradeStats.map((stat) => (
                    <div key={stat.grade} style={{
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e0e0e0'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{stat.grade}</span>
                      <span style={{
                        backgroundColor: '#388e3c',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}>
                        {stat.count}人
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 班級排程類型統計 */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>📅 班級排程類型分布</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #1976d2'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>常態班</span>
                    <span style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}>
                      {students.filter(s => s.class_schedule_type === '常態班').length}人
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: '#fff3e0',
                    padding: '15px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #f57c00'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>短期班</span>
                    <span style={{
                      backgroundColor: '#f57c00',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}>
                      {students.filter(s => s.class_schedule_type === '短期班').length}人
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 編輯模態框 */}
      <Dialog 
        open={showEditModal} 
        onClose={closeModals} 
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '1504px',
            width: '93vw'
          }
        }}
      >
        <DialogTitle>
          {selectedStudent ? '編輯學生' : '新增學生'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <StudentEditForm
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
              onKeyPress={(e: React.KeyboardEvent) => {
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
      <Dialog open={showDetailModal} onClose={closeModals} maxWidth="lg" fullWidth>
        <DialogTitle>學生詳情</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
    </>
  );
};

// 使用優化後的學生編輯表單組件
const StudentEditForm = StudentFormOptimized;

export default StudentsPage; 