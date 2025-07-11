// src/pages/SchoolsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getEducationLevelColors } from '../utils/educationLevelColors';
import SchoolDetailView from '../components/SchoolDetailView';
import SchoolEditForm from '../components/SchoolEditForm';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

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

  /* ---------------- state ---------------- */
  const [activeTab, setActiveTab] = useState<'schools' | 'stats'>('schools');
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolsPerPage, setSchoolsPerPage] = useState(10);
  const [sortOptions, setSortOptions] = useState({ type: '', district: '', level: '' });
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<SchoolStats[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  /* 編輯 / 刪除 / 詳情 */
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showEditModal, setShowEditModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal]       = useState(false);
  const [showPasswordModal, setShowPasswordModal]   = useState(false);
  const [showDetailModal, setShowDetailModal]       = useState(false);
  const [adminPassword, setAdminPassword]           = useState('');
  const [passwordError, setPasswordError]           = useState('');
  const [sortField, setSortField] = useState<string>('school_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /* ---------------- APIs ---------------- */
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (sortOptions.type) qs.append('type', sortOptions.type);
      if (sortOptions.district) qs.append('district', sortOptions.district);
      if (sortOptions.level) qs.append('education_level', sortOptions.level);
      const res = await fetch(`/api/schools?${qs}`);
      if (!res.ok) throw new Error('無法取得學校資料');
      setSchools(await res.json());
    } catch (e: any) {
      setError(e.message ?? '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const saveSchool = async (data: Partial<School>) => {
    try {
      const url = selectedSchool ? `/api/schools/${selectedSchool.id}` : '/api/schools';
      const method = selectedSchool ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '儲存失敗');
      }

      // 重新載入學校資料
      await fetchSchools();
      closeModals();
    } catch (e: any) {
      setError(e.message ?? '儲存失敗');
    }
  };
  const fetchStats = async () => {
    const res = await fetch('/api/schools/stats');
    res.ok && setStats(await res.json());
  };
  const fetchDistricts = async () => {
    const res = await fetch('/api/schools/districts');
    res.ok && setDistricts(await res.json());
  };

  useEffect(() => { fetchSchools(); fetchStats(); fetchDistricts(); }, [sortOptions]);

  // 排序函數
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序資料
  const sortedSchools = [...schools].sort((a, b) => {
    let aValue: any = a[sortField as keyof School];
    let bValue: any = b[sortField as keyof School];

    // 處理 null 或 undefined 值
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // 特殊處理教育階段排序
    if (sortField === 'education_level') {
      const levelOrder = ['國小', '國中', '高中', '高職', '大學'];
      const aIndex = levelOrder.indexOf(aValue);
      const bIndex = levelOrder.indexOf(bValue);
      
      // 如果找不到對應的順序，放在最後
      const aOrder = aIndex === -1 ? levelOrder.length : aIndex;
      const bOrder = bIndex === -1 ? levelOrder.length : bIndex;
      
      return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
    }

    // 處理字串比較
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    // 處理數字比較
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // 處理字串比較
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  /* ---------------- 分頁 & 篩選 ---------------- */
  const totalPages   = Math.ceil(sortedSchools.length / schoolsPerPage);
  const pagedSchools = sortedSchools.slice((currentPage - 1) * schoolsPerPage, currentPage * schoolsPerPage);
  const handleFilter = (field: string, val: string) => { setSortOptions(o => ({ ...o, [field]: val })); setCurrentPage(1); };

  /* ---------------- 事件 ---------------- */
  const handleDeleteClick = (sc: School) => {
    if (user?.role !== 'admin') { alert('權限不足'); return; }
    setSelectedSchool(sc); setShowDeleteModal(true);
  };
  const confirmDelete   = () => { setShowDeleteModal(false); setShowPasswordModal(true); };
  const confirmDeleteSchool = () => { setShowDeleteModal(false); setShowPasswordModal(true); };
  const verifyAndDelete = async () => {/* 驗證密碼 + 刪除，省略實作 */};
  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowPasswordModal(false);
    setShowDetailModal(false);
    setSelectedSchool(null);
    setAdminPassword('');
    setPasswordError('');
  };

  /* ---------------- UI blocks ---------------- */
  const TabButton = ({ tab, label }: { tab: 'schools'|'stats'; label: string }) => (
    <Button
      variant={activeTab===tab ? 'contained' : 'outlined'}
      onClick={() => setActiveTab(tab)}
      sx={{ 
        minWidth: 140,
        ...(activeTab !== tab && {
          backgroundColor: '#e0e0e0',
          color: '#555555',
          borderColor: '#cccccc',
          '&:hover': {
            backgroundColor: '#d5d5d5',
            borderColor: '#bbbbbb'
          }
        })
      }}
    >
      {label}
    </Button>
  );

  // 可排序的表頭組件
  const SortableTableHeader = ({ 
    field, 
    label, 
    currentSortField, 
    currentSortDirection, 
    onSort,
    width,
    align = 'left',
    sx = {}
  }: {
    field: string;
    label: string;
    currentSortField: string;
    currentSortDirection: 'asc' | 'desc';
    onSort: (field: string) => void;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sx?: any;
  }) => {
    const isActive = currentSortField === field;
    
    return (
      <TableCell 
        width={width} 
        align={align} 
        sx={{ 
          cursor: 'pointer', 
          userSelect: 'none',
          '&:hover': { backgroundColor: 'action.hover' },
          ...sx
        }}
        onClick={() => onSort(field)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          <Typography variant="body2" sx={{ mr: 0.5 }}>
            {label}
          </Typography>
          {isActive ? (
            currentSortDirection === 'asc' ? 
              <ArrowUpwardIcon fontSize="small" color="primary" /> : 
              <ArrowDownwardIcon fontSize="small" color="primary" />
          ) : (
            <Box sx={{ width: 20, height: 20 }} />
          )}
        </Box>
      </TableCell>
    );
  };

  const FilterSelect = (
    { label, field, options }:
    { label: string; field: keyof typeof sortOptions; options: string[] }
  ) => (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={sortOptions[field]}
        onChange={e => handleFilter(field, e.target.value)}
      >
        <MenuItem value="">不限</MenuItem>
        {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
    </FormControl>
  );

  /* ---------------- Render ---------------- */
  if (loading) return <Box p={4}><Typography>載入中…</Typography></Box>;
  if (error)   return <Box p={4}><Alert severity="error">{error}</Alert></Box>;

  return (
    <>
      {/* 背景漸層 */}
      <Box sx={{ position:'fixed', inset:0, zIndex:-1,
                 background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }} />

      <Box sx={{ p:2, display:'flex', flexDirection:'column', gap:2 }}>
        {/* 標題與分頁按鈕同一行 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', letterSpacing: 2 }}>
            學校管理
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TabButton tab="schools" label="🏫 學校列表"/>
            <TabButton tab="stats"   label="📊 統計資料"/>
          </Box>
        </Box>
        {/* 內容區塊 */}
        <Box sx={{ p:3, bgcolor:'background.paper', borderRadius:1, boxShadow:1 }}>

          {/* === 學校列表 === */}
          {activeTab==='schools' && (
            <>
              {/* 分頁 + 篩選 */}
              <Stack direction="row" flexWrap="wrap" gap={2} mb={2} alignItems="center">
                {/* 分頁控制 */}
                <Stack direction="row" gap={1} alignItems="center">
                  <Button 
                    size="small" 
                    disabled={currentPage===1} 
                    onClick={()=>setCurrentPage(p=>p-1)}
                    sx={{
                      backgroundColor: currentPage === 1 ? 'grey.300' : 'primary.main',
                      color: currentPage === 1 ? 'grey.500' : 'white',
                      '&:hover': {
                        backgroundColor: currentPage === 1 ? 'grey.300' : 'primary.dark'
                      }
                    }}
                  >
                    ‹ 上一頁
                  </Button>
                  <Typography>{currentPage} / {totalPages}</Typography>
                  <Button 
                    size="small" 
                    disabled={currentPage===totalPages} 
                    onClick={()=>setCurrentPage(p=>p+1)}
                    sx={{
                      backgroundColor: currentPage === totalPages ? 'grey.300' : 'primary.main',
                      color: currentPage === totalPages ? 'grey.500' : 'white',
                      '&:hover': {
                        backgroundColor: currentPage === totalPages ? 'grey.300' : 'primary.dark'
                      }
                    }}
                  >
                    下一頁 ›
                  </Button>
                  <FormControl size="small" sx={{ minWidth:80 }}>
                    <InputLabel>每頁</InputLabel>
                    <Select
                      label="每頁"
                      value={schoolsPerPage}
                      onChange={e=>setSchoolsPerPage(+e.target.value)}
                    >
                      {[10,20,50,100].map(n=><MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>

                {/* 篩選 */}
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ flexGrow:1 }}>
                  <FilterSelect label="學校類型" field="type"     options={['公立','國立','私立']} />
                  <FilterSelect label="行政區"   field="district" options={districts} />
                  <FilterSelect label="教育階段" field="level"    options={['國小','國中','高中','高職','大學']} />
                </Stack>

                {/* 新增 */}
                <Button variant="contained" onClick={()=>{ setSelectedSchool(null); setShowEditModal(true); }}>
                  + 新增學校
                </Button>
              </Stack>

              {/* 資料表 */}
              <TableContainer component={Paper} sx={{ maxHeight: 550 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <SortableTableHeader
                        field="school_name"
                        label="學校名稱"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="20%"
                      />
                      <SortableTableHeader
                        field="short_name"
                        label="簡稱"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="10%"
                      />
                      <SortableTableHeader
                        field="school_type"
                        label="類型"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="7%"
                        align="center"
                      />
                      <SortableTableHeader
                        field="district"
                        label="行政區"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="8%"
                      />
                      <SortableTableHeader
                        field="education_level"
                        label="階段"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="8%"
                        align="center"
                      />
                      <SortableTableHeader
                        field="phone"
                        label="電話"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="10%"
                      />
                      <SortableTableHeader
                        field="address"
                        label="地址"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="26%"
                      />
                      <SortableTableHeader
                        field="our_student_count"
                        label="學生數"
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        width="8%"
                        align="center"
                      />
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedSchools.map(sc=>(
                      <TableRow key={sc.id} hover>
                        <TableCell>{sc.school_name}</TableCell>
                        <TableCell>{sc.short_name}</TableCell>
                        <TableCell>
                          <Chip label={sc.school_type} color="primary" variant="outlined" size="small" />
                        </TableCell>
                        <TableCell>{sc.district}</TableCell>
                        <TableCell>
                          <Chip
                            label={sc.education_level}
                            size="small"
                            sx={{ ...getEducationLevelColors(sc.education_level) }}
                          />
                        </TableCell>
                        <TableCell>{sc.phone || '—'}</TableCell>
                        <TableCell>{sc.address || '—'}</TableCell>
                        <TableCell>
                          <Chip label={`${sc.our_student_count} 人`} size="small" color="info" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={()=>{setSelectedSchool(sc); setShowDetailModal(true);}}>詳情</Button>
                            <Button size="small" onClick={()=>{setSelectedSchool(sc); setShowEditModal(true);}}>編輯</Button>
                            <Button size="small" color="error" onClick={()=>handleDeleteClick(sc)}>刪除</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* === 統計 === */}
          {activeTab==='stats' && (
            <>
              <Typography variant="h6" mb={2}>📊 學校統計資料</Typography>

              {/* 基本統計卡片 */}
              <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                {[
                  { label:'總學校數',  value: stats.find(s => s.district === null)?.total_schools,      color:'primary' },
                  { label:'公立',      value: stats.find(s => s.district === null)?.public_schools,     color:'success' },
                  { label:'國立',      value: stats.find(s => s.district === null)?.national_schools,   color:'warning' },
                  { label:'私立',      value: stats.find(s => s.district === null)?.private_schools,    color:'error'   },
                ].map(({label,value,color})=>(
                  <Box key={label} sx={{ p:2, flex:'1 1 200px', bgcolor:`${color}.light`, borderRadius:1, textAlign:'center' }}>
                    <Typography variant="h4">{value ?? 0}</Typography>
                    <Typography>{label}</Typography>
                  </Box>
                ))}
              </Stack>

              {/* 我們的學生總數 */}
              <Box sx={{ mb:3, p:3, bgcolor:'primary.light', borderRadius:1, textAlign:'center' }}>
                <Typography variant="h3">{stats.find(s => s.district === null)?.total_our_students ?? 0}</Typography>
                <Typography>我們的學生數</Typography>
              </Box>

              {/* 行政區分佈 */}
              {stats.filter(s=>s.district).length>0 && (
                <>
                  <Typography variant="subtitle1" mb={1}>🗺️ 行政區分布</Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: 2 
                  }}>
                    {stats.filter(s=>s.district).map(d=>(
                      <Box key={d.district} sx={{ 
                        p: 2, 
                        height: '80px',
                        bgcolor: 'background.default', 
                        borderRadius: 1, 
                        boxShadow: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography fontWeight="bold" variant="body1">
                          {d.district}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {d.district_count} 所
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </>
          )}

        </Box>
      </Box>

      {/* ---------------- Modals ---------------- */}
      {/* 編輯 */}
      <Dialog open={showEditModal} onClose={closeModals} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSchool ? '編輯學校' : '新增學校'}</DialogTitle>
        <DialogContent>
          <SchoolEditForm 
            school={selectedSchool} 
            onSave={saveSchool} 
            onCancel={closeModals}
            districts={districts}
          />
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <Dialog open={showDeleteModal} onClose={closeModals}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent sx={{ py:2 }}>
          <Typography>確定刪除「{selectedSchool?.school_name}」？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>取消</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteSchool}>刪除</Button>
        </DialogActions>
      </Dialog>

      {/* 密碼驗證 */}
      <Dialog open={showPasswordModal} onClose={closeModals}>
        <DialogTitle>管理員密碼驗證</DialogTitle>
        <DialogContent sx={{ pt:2 }}>
            <TextField
              fullWidth
            label="管理員密碼"
              type="password"
              value={adminPassword}
            onChange={e=>setAdminPassword(e.target.value)}
              error={!!passwordError}
            helperText={passwordError}
            autoFocus
            onKeyDown={e=>{ if(e.key==='Enter') verifyAndDelete(); }}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>取消</Button>
          <Button variant="contained" color="error" disabled={!adminPassword} onClick={verifyAndDelete}>確認</Button>
        </DialogActions>
      </Dialog>

      {/* 詳情 */}
      <Dialog open={showDetailModal} onClose={closeModals} maxWidth="lg" fullWidth>
        <DialogTitle>學校詳情</DialogTitle>
        <DialogContent dividers>
          {selectedSchool && (
            <SchoolDetailView
              school={selectedSchool}
              onEdit={() => {
                setShowDetailModal(false);
                setShowEditModal(true);
              }}
              onClose={closeModals}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>關閉</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
          >
            編輯
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};



export default SchoolsPage; 
