import React, { useState, useEffect } from 'react';

interface School {
  id: number;
  school_name: string;
  short_name: string;
  school_type: string;
  district: string;
  education_level: string;
  phone: string;
  address: string;
  our_student_count: number;
}

interface SchoolStats {
  total_schools: number;
  public_schools: number;
  national_schools: number;
  private_schools: number;
  total_our_students: number;
  district: string | null;
  district_count: number;
}

const SchoolsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolsPerPage, setSchoolsPerPage] = useState(10);
  const [sortOptions, setSortOptions] = useState({
    type: '',
    district: '',
    level: ''
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<SchoolStats[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得學校資料
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sortOptions.type) params.append('type', sortOptions.type);
      if (sortOptions.district) params.append('district', sortOptions.district);
      if (sortOptions.level) params.append('education_level', sortOptions.level);
      
      const response = await fetch(`/api/schools?${params}`);
      if (!response.ok) {
        throw new Error('無法取得學校資料');
      }
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 取得統計資料
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/schools/stats');
      if (!response.ok) {
        throw new Error('無法取得統計資料');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('取得統計資料失敗:', err);
    }
  };

  // 取得行政區列表
  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/schools/districts');
      if (!response.ok) {
        throw new Error('無法取得行政區列表');
      }
      const data = await response.json();
      setDistricts(data);
    } catch (err) {
      console.error('取得行政區列表失敗:', err);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchStats();
    fetchDistricts();
  }, [sortOptions]);

  // 計算統計資料
  const totalSchools = schools.length;
  const totalPages = Math.ceil(totalSchools / schoolsPerPage);
  const overallStats = stats.find(s => s.district === null) || {
    total_schools: 0,
    public_schools: 0,
    national_schools: 0,
    private_schools: 0,
    total_our_students: 0
  };

  // 計算各行政區統計
  const districtStats = stats.filter(s => s.district !== null);

  // 獲取當前頁面的學校
  const getCurrentPageSchools = () => {
    const startIndex = (currentPage - 1) * schoolsPerPage;
    const endIndex = startIndex + schoolsPerPage;
    return schools.slice(startIndex, endIndex);
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

  const handleSchoolsPerPageChange = (value: number) => {
    setSchoolsPerPage(value);
    setCurrentPage(1); // 重置到第一頁
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>載入中...</h2>
            <p>正在取得學校資料</p>
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
              fetchSchools();
              fetchStats();
              fetchDistricts();
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
                <div className="stat-number">{overallStats.total_schools}</div>
                <div className="stat-label">總學校</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{overallStats.public_schools}</div>
                <div className="stat-label">公立學校</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{overallStats.national_schools}</div>
                <div className="stat-label">國立學校</div>
              </div>
            </div>

            <div className="student-list">
              <h3>📊 快速統計</h3>
              <div className="quick-stats">
                {districtStats.map((district) => (
                  <div key={district.district} className="quick-stat-item">
                    <span className="quick-stat-label">{district.district}:</span>
                    <span className="quick-stat-value">{district.district_count}校</span>
                  </div>
                ))}
                <div className="quick-stat-item">
                  <span className="quick-stat-label">我們的學生:</span>
                  <span className="quick-stat-value">{overallStats.total_our_students}人</span>
                </div>
              </div>
            </div>
          </div>

          {/* 學校列表區域 */}
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
                    value={schoolsPerPage} 
                    onChange={(e) => handleSchoolsPerPageChange(Number(e.target.value))}
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
                    value={sortOptions.type} 
                    onChange={(e) => handleSortChange('type', e.target.value)}
                    className="sort-select"
                  >
                    <option value="">學校性質</option>
                    <option value="公立">公立</option>
                    <option value="國立">國立</option>
                    <option value="私立">私立</option>
                  </select>
                  
                  <select 
                    value={sortOptions.district} 
                    onChange={(e) => handleSortChange('district', e.target.value)}
                    className="sort-select"
                  >
                    <option value="">行政區</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={sortOptions.level} 
                    onChange={(e) => handleSortChange('level', e.target.value)}
                    className="sort-select"
                  >
                    <option value="">學制</option>
                    <option value="高中">高中</option>
                    <option value="國中">國中</option>
                    <option value="國小">國小</option>
                    <option value="高職">高職</option>
                    <option value="大學">大學</option>
                  </select>
                </div>
              </div>
              <div className="calendar-controls">
                <span className="student-count">總共 {totalSchools} 所學校</span>
                <button className="btn btn-secondary">+ 新增學校</button>
              </div>
            </div>

            {/* 學校列表表格 */}
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>學校全名</th>
                    <th>簡稱</th>
                    <th>性質</th>
                    <th>行政區</th>
                    <th>學制</th>
                    <th>我們的學生數</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageSchools().map((school) => (
                    <tr key={school.id} className="student-row">
                      <td className="student-chinese-name">{school.school_name}</td>
                      <td className="student-english-name">{school.short_name}</td>
                      <td>
                        <span className="badge badge-school">{school.school_type}</span>
                      </td>
                      <td>
                        <span className="badge badge-grade">{school.district}</span>
                      </td>
                      <td>
                        <span className="badge badge-level">{school.education_level}</span>
                      </td>
                      <td>
                        <span className="badge badge-gender">{school.our_student_count}</span>
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

export default SchoolsPage; 