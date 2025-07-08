import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  TextField,
  Box,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getEducationLevelColors } from '../utils/educationLevelColors';
import '../styles/education-level-colors.css';

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
  const { user, token } = useAuth();
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 新增：分頁選單狀態
  const [activeTab, setActiveTab] = useState<'schools' | 'stats'>('schools');

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
    // 檢查是否為管理員
    if (user?.role !== 'admin') {
      alert('權限不足，僅限系統管理員可以刪除學校');
      return;
    }
    
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

  const confirmDeleteSchool = () => {
    if (!selectedSchool) return;
    
    // 顯示密碼驗證模態框
    setShowDeleteModal(false);
    setShowPasswordModal(true);
    setPasswordError('');
    setAdminPassword('');
  };

  const verifyPasswordAndDelete = async () => {
    if (!selectedSchool || !adminPassword) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    // 調試信息
    console.log('當前用戶:', user);
    console.log('Token:', token ? '存在' : '不存在');

    try {
      // 先驗證管理員密碼
      const verifyResponse = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        
        // 如果是 Token 相關錯誤，提示用戶重新登入
        if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          if (errorData.message.includes('Token') || errorData.message.includes('過期')) {
            setPasswordError('登入已過期，請重新登入後再試');
            // 可以選擇自動跳轉到登入頁面
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            return;
          }
        }
        
        setPasswordError(errorData.message || '密碼驗證失敗');
        return;
      }

      // 密碼驗證成功，執行刪除
      const deleteResponse = await fetch(`/api/schools/${selectedSchool.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!deleteResponse.ok) {
        if (deleteResponse.status === 401 || deleteResponse.status === 403) {
          setPasswordError('登入已過期，請重新登入後再試');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        throw new Error('刪除學校失敗');
      }

      // 重新載入資料
      fetchSchools();
      fetchStats();
      setShowPasswordModal(false);
      setSelectedSchool(null);
      setAdminPassword('');
      alert('學校已成功刪除');
      
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '刪除失敗');
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
    setShowPasswordModal(false);
    setSelectedSchool(null);
    setAdminPassword('');
    setPasswordError('');
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
            marginTop: '-10px'
          }}>
            <button
              className={`tab-button ${activeTab === 'schools' ? 'active' : ''}`}
              onClick={() => setActiveTab('schools')}
              style={{
                padding: '12px 24px',
                marginRight: '10px',
                border: '2px solid #1976d2',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: activeTab === 'schools' ? '#1976d2' : 'white',
                color: activeTab === 'schools' ? 'white' : '#1976d2',
                transition: 'all 0.3s ease'
              }}
            >
              🏫 學校列表
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
              📊 統計資料
            </button>
          </div>

        {/* 內容區 */}
        <div className="main-content" style={{ display: 'block', width: '100%' }}>

          {/* 學校列表區域 */}
          {activeTab === 'schools' && (
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
                      disabled={currentPage >= totalPages}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage >= totalPages ? 0.6 : 1
                      }}
                    >
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
                      <option value="">學校類型</option>
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
                      <option value="">教育階段</option>
                      <option value="小學">小學</option>
                      <option value="國中">國中</option>
                      <option value="高中">高中</option>
                      <option value="大學">大學</option>
                    </select>
                  </div>
                </div>
                <div className="calendar-controls">
                  <span className="student-count" style={{ marginLeft: '20px', marginRight: '-5px' }}>總共 {schools.length} 所學校</span>
                  <button className="btn btn-secondary" onClick={handleAddSchool}>+ 新增學校</button>
                </div>
              </div>

              {/* 學校列表表格 */}
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>學校名稱</th>
                      <th>簡稱</th>
                      <th>學校類型</th>
                      <th>行政區</th>
                      <th>教育階段</th>
                      <th>電話</th>
                      <th>地址</th>
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
                          <span 
                            className={`badge badge-level level-${school.education_level || '未設定'}`}
                          >
                            {school.education_level || '未設定'}
                          </span>
                        </td>
                        <td>{school.phone || '未設定'}</td>
                        <td>{school.address || '未設定'}</td>
                        <td>
                          <span className="badge badge-enrollment-status">
                            {school.our_student_count}人
                          </span>
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
          )}

          {/* 統計資料區域 */}
          {activeTab === 'stats' && (
            <div className="stats-section" style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>📊 學校統計資料</h2>
              
              {/* 基本統計 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #1976d2'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{stats.find(s => s.district === null)?.total_schools || 0}</div>
                  <div style={{ color: '#1976d2' }}>總學校數</div>
                </div>
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #388e3c'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>{stats.find(s => s.district === null)?.public_schools || 0}</div>
                  <div style={{ color: '#388e3c' }}>公立學校</div>
                </div>
                <div style={{
                  backgroundColor: '#fff3e0',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #f57c00'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f57c00' }}>{stats.find(s => s.district === null)?.national_schools || 0}</div>
                  <div style={{ color: '#f57c00' }}>國立學校</div>
                </div>
                <div style={{
                  backgroundColor: '#fce4ec',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #c2185b'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#c2185b' }}>{stats.find(s => s.district === null)?.private_schools || 0}</div>
                  <div style={{ color: '#c2185b' }}>私立學校</div>
                </div>
              </div>

              {/* 總學生數統計 */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>👥 我們的學生總數</h3>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #1976d2'
                }}>
                  <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1976d2' }}>{stats.find(s => s.district === null)?.total_our_students || 0}</div>
                  <div style={{ color: '#1976d2', fontSize: '18px' }}>位學生</div>
                </div>
              </div>

              {/* 行政區統計 */}
              {stats.length > 1 && (
                <div>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>🗺️ 行政區分布</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {stats.filter(s => s.district !== null).map((stat, index) => (
                      <div key={index} style={{
                        backgroundColor: '#f5f5f5',
                        padding: '15px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #e0e0e0'
                      }}>
                        <span style={{ fontWeight: 'bold' }}>{stat.district}</span>
                        <span style={{
                          backgroundColor: '#1976d2',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '14px'
                        }}>
                          {stat.district_count}所
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 編輯模態框 */}
      <Dialog open={showEditModal} onClose={closeModals} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSchool ? '編輯學校' : '新增學校'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <SchoolEditForm
              school={selectedSchool}
              onSave={handleSaveSchool}
              onCancel={closeModals}
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
              確定要刪除學校「{selectedSchool?.school_name}」嗎？
            </Typography>
            <Alert severity="warning">
              此操作無法復原！
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>取消</Button>
          <Button onClick={confirmDeleteSchool} color="error" variant="contained">
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
              ⚠️ 您即將刪除學校：<strong>{selectedSchool?.school_name}</strong>
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
        <DialogTitle>學校詳情</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedSchool && (
              <div style={{ padding: '20px' }}>
                <h3 style={{ color: '#1976d2', marginBottom: '20px' }}>🏫 {selectedSchool.school_name}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '10px' }}>基本資訊</h4>
                    <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '6px' }}>
                      <p><strong>簡稱：</strong>{selectedSchool.short_name}</p>
                      <p><strong>學校類型：</strong>{selectedSchool.school_type}</p>
                      <p><strong>行政區：</strong>{selectedSchool.district}</p>
                      <p><strong>教育階段：</strong>{selectedSchool.education_level}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '10px' }}>聯絡資訊</h4>
                    <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '6px' }}>
                      <p><strong>電話：</strong>{selectedSchool.phone || '未設定'}</p>
                      <p><strong>地址：</strong>{selectedSchool.address || '未設定'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '10px' }}>學生統計</h4>
                    <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{selectedSchool.our_student_count}</div>
                      <div style={{ color: '#1976d2' }}>我們的學生數</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>關閉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// 學校編輯表單組件
const SchoolEditForm: React.FC<{
  school: School | null;
  onSave: (data: Partial<School>) => void;
  onCancel: () => void;
}> = ({ school, onSave, onCancel }) => {
  const schoolNameRef = useRef<HTMLInputElement>(null);
  const shortNameRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => {
    return {
      school_name: school?.school_name || '',
      short_name: school?.short_name || '',
      school_type: school?.school_type || '',
      district: school?.district || '',
      education_level: school?.education_level || '',
      phone: school?.phone || '',
      address: school?.address || '',
      our_student_count: school?.our_student_count || 0
    };
  });

  // 當 school prop 改變時，更新表單資料
  useEffect(() => {
    
    if (school) {
      const newFormData = {
        school_name: school.school_name || '',
        short_name: school.short_name || '',
        school_type: school.school_type || '',
        district: school.district || '',
        education_level: school.education_level || '',
        phone: school.phone || '',
        address: school.address || '',
        our_student_count: school.our_student_count || 0
              };
        setFormData(newFormData);
      
      // 直接設定輸入框的值
      if (schoolNameRef.current) {
        schoolNameRef.current.value = newFormData.school_name;
      }
      if (shortNameRef.current) {
        shortNameRef.current.value = newFormData.short_name;
      }
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
        
        // 直接清空輸入框
        if (schoolNameRef.current) {
          schoolNameRef.current.value = '';
        }
        if (shortNameRef.current) {
          shortNameRef.current.value = '';
        }
    }
  }, [school]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 從 ref 獲取最新值
    const submitData = {
      ...formData,
      school_name: schoolNameRef.current?.value || '',
      short_name: shortNameRef.current?.value || ''
    };
    
    onSave(submitData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 同步更新 ref（如果需要）
    if (field === 'school_name' && schoolNameRef.current) {
      schoolNameRef.current.value = String(value);
    }
    if (field === 'short_name' && shortNameRef.current) {
      shortNameRef.current.value = String(value);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="school-form"
    >
      <div className="form-row">
        <div className="form-group">
          <label>學校全名 *</label>
          <input
            ref={schoolNameRef}
            type="text"
            onChange={(e) => handleChange('school_name', e.target.value)}
            required
            placeholder="學校全名"
            style={{ color: '#000', backgroundColor: '#fff' }}
          />
        </div>
        <div className="form-group">
          <label>簡稱</label>
          <input
            ref={shortNameRef}
            type="text"
            onChange={(e) => handleChange('short_name', e.target.value)}
            placeholder="學校簡稱"
            style={{ color: '#000', backgroundColor: '#fff' }}
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
            style={{ color: '#000', backgroundColor: '#fff' }}
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
            style={{ color: '#000', backgroundColor: '#fff' }}
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
            style={{ color: '#000', backgroundColor: '#fff' }}
          >
            <option value="">請選擇</option>
            <option value="國小">國小</option>
            <option value="國中">國中</option>
            <option value="高中">高中</option>
            <option value="大學">大學</option>
            <option value="在職">在職</option>
          </select>
        </div>
        <div className="form-group">
          <label>我們的學生數</label>
          <input
            type="number"
            value={formData.our_student_count}
            onChange={(e) => handleChange('our_student_count', parseInt(e.target.value) || 0)}
            min="0"
            style={{ color: '#000', backgroundColor: '#fff' }}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>電話</label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          style={{ color: '#000', backgroundColor: '#fff' }}
        />
      </div>
      
      <div className="form-group">
        <label>地址</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          style={{ color: '#000', backgroundColor: '#fff' }}
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