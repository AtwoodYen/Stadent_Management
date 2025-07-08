import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ShortTermScheduleEditor from '../components/ShortTermScheduleEditor';

interface Student {
  id: number;
  chinese_name: string;
  class_schedule_type: string;
}

const ShortTermSchedulePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartDate = searchParams.get('week_start') || '';
  const weekEndDate = searchParams.get('week_end') || '';

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) {
      setError('缺少學生ID');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) {
        throw new Error('無法載入學生資料');
      }

      const studentData = await response.json();
      
      // 檢查是否為短期班學生
      if (studentData.class_schedule_type !== '短期班') {
        setError('此學生不是短期班學生，無法使用短期班排課功能');
        setLoading(false);
        return;
      }

      setStudent(studentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleClose}
        >
          關閉視窗
        </Button>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          找不到學生資料
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleClose}
        >
          關閉視窗
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <ShortTermScheduleEditor
        studentId={student.id}
        studentName={student.chinese_name}
        weekStartDate={weekStartDate}
        weekEndDate={weekEndDate}
        onClose={handleClose}
      />
    </Box>
  );
};

export default ShortTermSchedulePage; 