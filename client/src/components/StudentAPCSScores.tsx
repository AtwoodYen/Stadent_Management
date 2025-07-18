import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface APCSScore {
  id: number;
  student_id: number;
  exam_year: number;
  exam_month: number;
  reading_score: number | null;
  reading_level: number | null;
  programming_level: string | null;
  programming_score: number | null;
  programming_level_achieved: number | null;
  created_at: string;
  updated_at: string;
}

interface StudentAPCSScoresProps {
  studentId: number;
}

const StudentAPCSScores: React.FC<StudentAPCSScoresProps> = ({ studentId }) => {
  const [scores, setScores] = useState<APCSScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScore, setEditingScore] = useState<APCSScore | null>(null);
  const [formData, setFormData] = useState({
    exam_year: new Date().getFullYear(),
    exam_month: 1,
    reading_score: '',
    programming_level: '',
    programming_score: ''
  });
  const [availableProgrammingLevels, setAvailableProgrammingLevels] = useState<string[]>([]);

  // 載入APCS成績記錄
  const loadScores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/${studentId}/apcs-scores`);
      if (response.ok) {
        const data = await response.json();
        setScores(data);
      } else {
        setError('載入APCS成績記錄失敗');
      }
    } catch (err) {
      setError('載入APCS成績記錄時發生錯誤');
      console.error('載入APCS成績記錄錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 載入指定月份可報名的程式實作等級
  const loadProgrammingLevels = async (month: number) => {
    try {
      const response = await fetch(`/api/apcs/programming-levels/${month}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProgrammingLevels(data);
      }
    } catch (err) {
      console.error('載入程式實作等級失敗:', err);
    }
  };

  useEffect(() => {
    loadScores();
  }, [studentId]);

  useEffect(() => {
    loadProgrammingLevels(formData.exam_month);
  }, [formData.exam_month]);

  // 處理表單變更
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 開啟新增對話框
  const handleAdd = () => {
    setEditingScore(null);
    setFormData({
      exam_year: new Date().getFullYear(),
      exam_month: 1,
      reading_score: '',
      programming_level: '',
      programming_score: ''
    });
    setOpenDialog(true);
  };

  // 開啟編輯對話框
  const handleEdit = (score: APCSScore) => {
    setEditingScore(score);
    setFormData({
      exam_year: score.exam_year,
      exam_month: score.exam_month,
      reading_score: score.reading_score?.toString() || '',
      programming_level: score.programming_level || '',
      programming_score: score.programming_score?.toString() || ''
    });
    setOpenDialog(true);
  };

  // 處理刪除
  const handleDelete = async (scoreId: number) => {
    if (!window.confirm('確定要刪除這筆APCS成績記錄嗎？')) return;

    try {
      const response = await fetch(`/api/students/${studentId}/apcs-scores/${scoreId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadScores();
      } else {
        setError('刪除失敗');
      }
    } catch (err) {
      setError('刪除APCS成績記錄時發生錯誤');
      console.error('刪除APCS成績記錄錯誤:', err);
    }
  };

  // 處理表單提交
  const handleSubmit = async () => {
    try {
      const scoreData = {
        exam_year: parseInt(formData.exam_year.toString()),
        exam_month: parseInt(formData.exam_month.toString()),
        reading_score: formData.reading_score ? parseInt(formData.reading_score) : null,
        programming_level: formData.programming_level || null,
        programming_score: formData.programming_score ? parseInt(formData.programming_score) : null
      };

      const url = editingScore 
        ? `/api/students/${studentId}/apcs-scores/${editingScore.id}`
        : `/api/students/${studentId}/apcs-scores`;
      
      const method = editingScore ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      });

      if (response.ok) {
        setOpenDialog(false);
        loadScores();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '操作失敗');
      }
    } catch (err) {
      setError('操作APCS成績記錄時發生錯誤');
      console.error('操作APCS成績記錄錯誤:', err);
    }
  };

  // 獲取級數顯示文字
  const getLevelText = (level: number | null) => {
    if (level === null) return '-';
    return `${level}級`;
  };

  // 獲取月份顯示文字
  const getMonthText = (month: number) => {
    const monthNames = {
      1: '1月', 3: '3月', 6: '6月', 7: '7月', 10: '10月', 11: '11月'
    };
    return monthNames[month as keyof typeof monthNames] || month.toString();
  };

  if (loading) {
    return <Typography>載入中...</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">臺灣APCS成績</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
        >
          新增成績
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {scores.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            尚未有任何APCS成績記錄
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>考試時間</TableCell>
                <TableCell align="center">程式識讀</TableCell>
                <TableCell align="center">程式實作</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map((score) => (
                <TableRow key={score.id}>
                  <TableCell>
                    {score.exam_year}年{getMonthText(score.exam_month)}
                  </TableCell>
                  <TableCell align="center">
                    {score.reading_score !== null ? (
                      <Box>
                        <Typography variant="body2">
                          {score.reading_score}分
                        </Typography>
                        <Chip 
                          label={getLevelText(score.reading_level)} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {score.programming_score !== null ? (
                      <Box>
                        <Typography variant="body2">
                          {score.programming_score}分
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {score.programming_level}
                        </Typography>
                        <Chip 
                          label={getLevelText(score.programming_level_achieved)} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(score)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(score.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新增/編輯對話框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingScore ? '編輯APCS成績' : '新增APCS成績'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="考試年份"
                type="number"
                value={formData.exam_year}
                onChange={(e) => handleFormChange('exam_year', e.target.value)}
                inputProps={{ min: 2020, max: 2030 }}
              />
              <FormControl fullWidth>
                <InputLabel>考試月份</InputLabel>
                <Select
                  value={formData.exam_month}
                  label="考試月份"
                  onChange={(e) => handleFormChange('exam_month', e.target.value)}
                >
                  <MenuItem value={1}>1月</MenuItem>
                  <MenuItem value={3}>3月</MenuItem>
                  <MenuItem value={6}>6月</MenuItem>
                  <MenuItem value={7}>7月</MenuItem>
                  <MenuItem value={10}>10月</MenuItem>
                  <MenuItem value={11}>11月</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="程式識讀分數"
                type="number"
                value={formData.reading_score}
                onChange={(e) => handleFormChange('reading_score', e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                helperText="0-100分"
              />
              <FormControl fullWidth>
                <InputLabel>程式實作報名等級</InputLabel>
                <Select
                  value={formData.programming_level}
                  label="程式實作報名等級"
                  onChange={(e) => handleFormChange('programming_level', e.target.value)}
                >
                  <MenuItem value="">請選擇</MenuItem>
                  {availableProgrammingLevels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="程式實作分數"
              type="number"
              value={formData.programming_score}
              onChange={(e) => handleFormChange('programming_score', e.target.value)}
              inputProps={{ min: 0, max: 300 }}
              helperText="0-300分"
              disabled={!formData.programming_level}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingScore ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAPCSScores; 