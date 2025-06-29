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
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  // 按鈕事件處理函數
  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setShowEditModal(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteModal(true);
  };

  const handleViewSchoolDetail = (school: School) => {
    setSelectedSchool(school);
    setShowDetailModal(true);
  };

  const handleAddSchool = () => {
    setSelectedSchool(null);
    setShowEditModal(true);
  };

  const confirmDeleteSchool = async () => {
    if (!selectedSchool) return;
    
    try {
      const response = await fetch(`/api/schools/${selectedSchool.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('刪除學校失敗');
      }
      
      // 重新載入資料
      fetchSchools();
      fetchStats();
      setShowDeleteModal(false);
      setSelectedSchool(null);
      alert('學校已成功刪除');
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleSaveSchool = async (schoolData: Partial<School>) => {
    try {
      const method = selectedSchool ? 'PUT' : 'POST';
      const url = selectedSchool ? `/api/schools/${selectedSchool.id}` : '/api/schools';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schoolData),
      });
      
      if (!response.ok) {
        throw new Error('儲存學校資料失敗');
      }
      
      // 重新載入資料
      fetchSchools();
      fetchStats();
      setShowEditModal(false);
      setSelectedSchool(null);
      alert(selectedSchool ? '學校資料已更新' : '學校已新增');
    } catch (err) {
      alert(err instanceof Error ? err.message : '儲存失敗');
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setSelectedSchool(null);
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
                <button className="btn btn-secondary" onClick={handleAddSchool}>+ 新增學校</button>
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
                        <button 
                          className="btn-small btn-edit" 
                          onClick={() => handleEditSchool(school)}
                        >
                          編輯
                        </button>
                        <button 
                          className="btn-small btn-delete" 
                          onClick={() => handleDeleteSchool(school)}
                        >
                          刪除
                        </button>
                        <button 
                          className="btn-small btn-schedule" 
                          onClick={() => handleViewSchoolDetail(school)}
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
            <div className="modal-header">
              <h3>{selectedSchool ? '編輯學校' : '新增學校'}</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <SchoolEditForm 
                school={selectedSchool} 
                onSave={handleSaveSchool} 
                onCancel={closeModals}
              />
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認模態框 */}
      {showDeleteModal && selectedSchool && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>確認刪除</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p>您確定要刪除學校「{selectedSchool.school_name}」嗎？</p>
              <p className="warning-text">此操作無法復原！</p>
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={confirmDeleteSchool}>
                  確認刪除
                </button>
                <button className="btn btn-secondary" onClick={closeModals}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳情模態框 */}
      {showDetailModal && selectedSchool && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>學校詳情</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="school-detail">
                <div className="detail-row">
                  <label>學校全名：</label>
                  <span>{selectedSchool.school_name}</span>
                </div>
                <div className="detail-row">
                  <label>簡稱：</label>
                  <span>{selectedSchool.short_name}</span>
                </div>
                <div className="detail-row">
                  <label>學校性質：</label>
                  <span className="badge badge-school">{selectedSchool.school_type}</span>
                </div>
                <div className="detail-row">
                  <label>行政區：</label>
                  <span className="badge badge-grade">{selectedSchool.district}</span>
                </div>
                <div className="detail-row">
                  <label>學制：</label>
                  <span className="badge badge-level">{selectedSchool.education_level}</span>
                </div>
                <div className="detail-row">
                  <label>電話：</label>
                  <span>{selectedSchool.phone || '未提供'}</span>
                </div>
                <div className="detail-row">
                  <label>地址：</label>
                  <span>{selectedSchool.address || '未提供'}</span>
                </div>
                <div className="detail-row">
                  <label>我們的學生數：</label>
                  <span className="badge badge-gender">{selectedSchool.our_student_count}人</span>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeModals}>
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 學校編輯表單組件
const SchoolEditForm: React.FC<{
  school: School | null;
  onSave: (data: Partial<School>) => void;
  onCancel: () => void;
}> = ({ school, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    school_name: school?.school_name || '',
    short_name: school?.short_name || '',
    school_type: school?.school_type || '',
    district: school?.district || '',
    education_level: school?.education_level || '',
    phone: school?.phone || '',
    address: school?.address || '',
    our_student_count: school?.our_student_count || 0
  });

  // 當 school prop 改變時，更新表單資料
  useEffect(() => {
    if (school) {
      setFormData({
        school_name: school.school_name || '',
        short_name: school.short_name || '',
        school_type: school.school_type || '',
        district: school.district || '',
        education_level: school.education_level || '',
        phone: school.phone || '',
        address: school.address || '',
        our_student_count: school.our_student_count || 0
      });
    } else {
      // 新增模式，清空表單
      setFormData({
        school_name: '',
        short_name: '',
        school_type: '',
        district: '',
        education_level: '',
        phone: '',
        address: '',
        our_student_count: 0
      });
    }
  }, [school]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="school-form">
      <div className="form-row">
        <div className="form-group">
          <label>學校全名 *</label>
          <input
            type="text"
            value={formData.school_name}
            onChange={(e) => handleChange('school_name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>簡稱</label>
          <input
            type="text"
            value={formData.short_name}
            onChange={(e) => handleChange('short_name', e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>學校性質 *</label>
          <select
            value={formData.school_type}
            onChange={(e) => handleChange('school_type', e.target.value)}
            required
          >
            <option value="">請選擇</option>
            <option value="公立">公立</option>
            <option value="國立">國立</option>
            <option value="私立">私立</option>
          </select>
        </div>
        <div className="form-group">
          <label>行政區 *</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => handleChange('district', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>學制 *</label>
          <select
            value={formData.education_level}
            onChange={(e) => handleChange('education_level', e.target.value)}
            required
          >
            <option value="">請選擇</option>
            <option value="國小">國小</option>
            <option value="國中">國中</option>
            <option value="高中">高中</option>
            <option value="高職">高職</option>
            <option value="大學">大學</option>
          </select>
        </div>
        <div className="form-group">
          <label>我們的學生數</label>
          <input
            type="number"
            value={formData.our_student_count}
            onChange={(e) => handleChange('our_student_count', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>電話</label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>地址</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">
          {school ? '更新' : '新增'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
};

export default SchoolsPage; 