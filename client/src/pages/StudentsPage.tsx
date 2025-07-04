import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box
} from '@mui/material';
import StudentFormOptimized from '../components/StudentFormOptimized';
import StudentDetailView from '../components/StudentDetailView';
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
  notes: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
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
    classType: ''
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
  
  // 編輯相關狀態
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('刪除學生失敗');
      }
      
      // 重新載入資料
      fetchStudents();
      setShowDeleteModal(false);
      setSelectedStudent(null);
      alert('學生已成功刪除');
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗');
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
      alert(selectedStudent ? '學生資料已更新' : '學生已新增');
    } catch (err) {
      alert(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setSelectedStudent(null);
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
      {/* 載入失敗覆蓋層 */}
      <div id="app-overlay" className="app-overlay">
        <div>
          <h1>⚠️ 應用程式載入失敗</h1>
          <p>請檢查您的網路連線或後端伺服器狀態，然後重新整理頁面。</p>
        </div>
      </div>

      {/* 主要容器 */}
      <div className="container">        
        {/* 內容區 */}
        <div className="main-content">
          {/* 側邊欄 */}
          <div className="sidebar">
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-number">{totalStudents}</div>
                <div className="stat-label">總學生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{students.filter(s => !s.is_active).length}</div>
                <div className="stat-label">停用學生</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{students.filter(s => s.gender === '男').length}</div>
                <div className="stat-label">男學生</div>
              </div>
            </div>

            <div className="student-list">
              <h3>📊 快速統計</h3>
              <div className="quick-stats">
                {schoolStats.map((stat) => (
                  <div key={stat.school} className="quick-stat-item">
                    <span className="quick-stat-label">{stat.school}:</span>
                    <span className="quick-stat-value">{stat.count}人</span>
                  </div>
                ))}
                {gradeStats.map((stat) => (
                  <div key={stat.grade} className="quick-stat-item">
                    <span className="quick-stat-label">{stat.grade}:</span>
                    <span className="quick-stat-value">{stat.count}人</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 學生列表區域 */}
          <div className="calendar-section">
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
                </div>
              </div>
              <div className="calendar-controls">
                <span className="student-count">總共 {totalStudents} 位學生</span>
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
                                   '#f5f5f5', // 預設灰色
                            color: student.class_type === 'CPP' ? '#1976d2' : // 深藍色
                                   student.class_type === 'PROJECT' ? '#7b1fa2' : // 深紫色
                                   student.class_type === 'SCRATCH' ? '#388e3c' : // 深綠色
                                   student.class_type === 'APCS_A' ? '#f57c00' : // 深橙色
                                   student.class_type === 'APCS_P' ? '#c2185b' : // 深粉色
                                   student.class_type === 'ANIMATION' ? '#689f38' : // 深青綠色
                                   '#757575', // 預設深灰色
                            border: student.class_type ? '1px solid' : 'none',
                            borderColor: student.class_type === 'CPP' ? '#1976d2' :
                                        student.class_type === 'PROJECT' ? '#7b1fa2' :
                                        student.class_type === 'SCRATCH' ? '#388e3c' :
                                        student.class_type === 'APCS_A' ? '#f57c00' :
                                        student.class_type === 'APCS_P' ? '#c2185b' :
                                        student.class_type === 'ANIMATION' ? '#689f38' :
                                        'transparent'
                          }}
                        >
                          {getClassTypeName(student.class_type)}
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
        </div>
      </div>

      {/* 編輯模態框 */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedStudent ? '編輯學生' : '新增學生'}</h3>
            <StudentEditForm
              student={selectedStudent}
              onSave={handleSaveStudent}
              onCancel={closeModals}
              isLoading={isSaving}
            />
          </div>
        </div>
      )}

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

      {/* 詳情模態框 */}
      {showDetailModal && selectedStudent && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <StudentDetailView
              student={selectedStudent}
              onEdit={handleEditFromDetail}
              onClose={closeModals}
            />
          </div>
        </div>
      )}
    </>
  );
};

// 使用優化後的學生編輯表單組件
const StudentEditForm = StudentFormOptimized;

export default StudentsPage; 