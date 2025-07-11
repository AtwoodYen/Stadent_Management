import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip
} from '@mui/material';

interface ClassAbility {
  id: number;
  student_id: number;
  class_type: string;
  ability_level: string;
  assessment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CourseProgress {
  id: number;
  student_id: number;
  course_id: number | null;
  course_name: string;
  ability_level: string;
  progress_percentage: number;
  notes?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

interface ClassType {
  class_code: string;
  class_name: string;
  description: string;
}

interface StudentCourseAbilitiesReadOnlyProps {
  studentId: number;
}

const StudentCourseAbilitiesReadOnly: React.FC<StudentCourseAbilitiesReadOnlyProps> = ({ studentId }) => {
  const [classAbilities, setClassAbilities] = useState<ClassAbility[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入資料
  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [classAbilitiesRes, courseProgressRes, classTypesRes] = await Promise.all([
        fetch(`/api/students/${studentId}/class-abilities`),
        fetch(`/api/students/${studentId}/course-progress`),
        fetch('/api/class-types')
      ]);

      if (classAbilitiesRes.ok) {
        const classData = await classAbilitiesRes.json();
        setClassAbilities(classData);
      } else {
        console.error('班別程度能力API錯誤:', classAbilitiesRes.status);
      }

      if (courseProgressRes.ok) {
        const courseProgressData = await courseProgressRes.json();
        setCourseProgress(courseProgressData);
      } else {
        console.error('課程進度API錯誤:', courseProgressRes.status);
      }

      if (classTypesRes.ok) {
        const classTypesData = await classTypesRes.json();
        setClassTypes(classTypesData);
      } else {
        console.error('班別類型API錯誤:', classTypesRes.status);
      }
    } catch (err) {
      setError('載入資料時發生錯誤');
      console.error('載入資料錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      '新手': '#4caf50',
      '入門': '#2196f3',
      '中階': '#ff9800',
      '高階': '#f44336',
      '精英': '#9c27b0'
    };
    return colors[level] || '#757575';
  };

  const getClassTypeName = (classCode: string) => {
    const classType = classTypes.find(ct => ct.class_code === classCode);
    return classType ? classType.class_name : classCode;
  };

  if (loading) {
    return <Typography>載入中...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2.5} justifyContent="center">
        {/* 左側：班別程度能力 */}
        <Box sx={{ width: '35.00%' }}>
          <Card sx={{ border: '2px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                fontSize: '1rem',
                mb: 1.5
              }}>
                班別程度能力
              </Typography>

              {classAbilities.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  尚無班別程度記錄
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {classAbilities.map((ability) => (
                    <Box
                      key={ability.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '60%' }}>
                          {getClassTypeName(ability.class_type) || '未設定'}
                        </Typography>
                        <Chip
                          label={ability.ability_level}
                          size="small"
                          sx={{
                            backgroundColor: getLevelColor(ability.ability_level),
                            color: 'white',
                            fontSize: '0.75rem',
                            height: '24px'
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* 右側：課程進度 */}
        <Box sx={{ width: '40.00%' }}>
          <Card sx={{ border: '2px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                fontSize: '1rem',
                mb: 1.5
              }}>
                課程進度
              </Typography>

              {courseProgress.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  尚無課程進度記錄
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {courseProgress.map((progress) => (
                    <Box
                      key={progress.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '60%' }}>
                          {progress.course_name || '未設定'}
                        </Typography>
                        <Chip
                          label={progress.ability_level}
                          size="small"
                          sx={{
                            backgroundColor: getLevelColor(progress.ability_level),
                            color: 'white',
                            fontSize: '0.75rem',
                            height: '24px'
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default StudentCourseAbilitiesReadOnly; 