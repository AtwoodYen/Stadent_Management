import React, { useState, useEffect } from 'react';

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
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStudents();
    fetchSchools();
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
  const gradeStats = ['高一', '高二', '高三'].map(grade => ({
    grade,
    count: students.filter(s => s.grade === grade).length
  }));

  // 獲取當前頁面的學生
  const getCurrentPageStudents = () => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return students.slice(startIndex, endIndex);
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
                  <button className="btn" onClick={handlePrevPage} disabled={currentPage === 1}>
                    ‹ 上一頁
                  </button>
                  <div className="page-info">
                    {currentPage} / {totalPages}
                  </div>
                  <button className="btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
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
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                  </select>
                  
                  <select 
                    value={sortOptions.level} 
                    onChange={(e) => handleSortChange('level', e.target.value)}
                    className="sort-select"
                  >
                    <option value="">程度</option>
                    <option value="初級">初級</option>
                    <option value="中級">中級</option>
                    <option value="進階">進階</option>
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
                    <option value="A班">A班</option>
                    <option value="B班">B班</option>
                    <option value="C班">C班</option>
                  </select>
                </div>
              </div>
              <div className="calendar-controls">
                <span className="student-count">總共 {totalStudents} 位學生</span>
                <button className="btn btn-secondary">+ 新增學生</button>
              </div>
            </div>

            {/* 學生列表表格 */}
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>中文姓名</th>
                    <th>英文姓名</th>
                    <th>學校</th>
                    <th>年級</th>
                    <th>性別</th>
                    <th>程度</th>
                    <th>班別</th>
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
                        <span className="badge badge-gender">{student.gender}</span>
                      </td>
                      <td>
                        <span className="badge badge-level">{student.level_type}</span>
                      </td>
                      <td>
                        <span className="badge badge-class">{student.class_type}</span>
                      </td>
                      <td className="student-actions">
                        <button className="btn-small btn-edit">編輯</button>
                        <button className="btn-small btn-delete">刪除</button>
                        <button className="btn-small btn-schedule">詳情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentsPage; 