import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

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

interface Course {
  id: number;
  name: string;
  level: string;
  description?: string;
}

interface StudentCourseAbilitiesProps {
  studentId: number;
}

const StudentCourseAbilities: React.FC<StudentCourseAbilitiesProps> = ({ studentId }) => {
  const [classAbilities, setClassAbilities] = useState<ClassAbility[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classTypes, setClassTypes] = useState<{ class_code: string; class_name: string }[]>([]);
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
      console.log('開始載入資料，學生ID:', studentId);
      
      const [classAbilitiesRes, courseProgressRes, coursesRes, classTypesRes] = await Promise.all([
        fetch(`/api/students/${studentId}/class-abilities`),
        fetch(`/api/students/${studentId}/course-progress`),
        fetch('/api/courses/get_all_data'),
        fetch('/api/class-types')
      ]);

      console.log('API 回應狀態:', {
        classAbilities: classAbilitiesRes.status,
        courseProgress: courseProgressRes.status,
        courses: coursesRes.status,
        classTypes: classTypesRes.status
      });

      if (classAbilitiesRes.ok) {
        const classData = await classAbilitiesRes.json();
        setClassAbilities(classData);
        console.log('班別程度能力資料:', classData);
      } else {
        console.error('班別程度能力API錯誤:', classAbilitiesRes.status, await classAbilitiesRes.text());
      }

      let courseProgressData = null;
      if (courseProgressRes.ok) {
        courseProgressData = await courseProgressRes.json();
        setCourseProgress(courseProgressData);
        console.log('課程進度資料:', courseProgressData);
      } else {
        console.error('課程進度API錯誤:', courseProgressRes.status, await courseProgressRes.text());
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
        console.log('課程列表資料:', coursesData);
      } else {
        console.error('課程列表API錯誤:', coursesRes.status, await coursesRes.text());
        // 如果課程 API 失敗，嘗試從課程進度資料中提取課程資訊
        if (courseProgressRes.ok && courseProgressData) {
          const uniqueCourses = courseProgressData.reduce((acc: Course[], progress: any) => {
            const existingCourse = acc.find(c => c.id === progress.course_id);
            if (!existingCourse) {
              acc.push({
                id: progress.course_id,
                name: progress.course_name,
                level: progress.ability_level,
                description: ''
              });
            }
            return acc;
          }, []);
          setCourses(uniqueCourses);
          console.log('從課程進度提取的課程資料:', uniqueCourses);
        }
      }

      if (classTypesRes.ok) {
        const classTypesData = await classTypesRes.json();
        setClassTypes(classTypesData);
        console.log('班別類型資料:', classTypesData);
      } else {
        console.error('班別類型API錯誤:', classTypesRes.status, await classTypesRes.text());
      }
    } catch (err) {
      setError('載入資料時發生錯誤');
      console.error('載入資料錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 快速新增班別程度（新增空記錄）
  const handleQuickAddClassAbility = async () => {
    try {
      console.log('classTypes:', classTypes);
      
      // 新增一筆空的記錄，班別為空字串
      const emptyClassAbility = {
        class_type: '',
        ability_level: '新手',
        assessment_date: new Date().toISOString().split('T')[0],
        notes: ''
      };
      
      console.log('emptyClassAbility:', emptyClassAbility);

      const response = await fetch(`/api/students/${studentId}/class-abilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyClassAbility),
      });

      if (response.ok) {
        const newAbility = await response.json();
        setClassAbilities(prev => [...prev, newAbility]);
        setError(null); // 清除錯誤訊息
      } else {
        const errorData = await response.json();
        console.error('API 錯誤回應:', errorData);
        setError(errorData.error || '新增失敗');
      }
    } catch (err) {
      setError('新增班別程度時發生錯誤');
      console.error('新增班別程度錯誤:', err);
    }
  };

  // 快速新增課程進度（新增空白記錄）
  const handleQuickAddCourseProgress = async () => {
    try {
      // 新增一筆空白的記錄，課程ID為0（表示未選擇）
      const emptyCourseProgress = {
        course_id: 0, // 使用0表示未選擇課程
        ability_level: '新手',
        progress_percentage: 0,
        notes: ''
      };

      const response = await fetch(`/api/students/${studentId}/course-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyCourseProgress),
      });

      if (response.ok) {
        const newProgress = await response.json();
        setCourseProgress(prev => [...prev, newProgress]);
        setError(null); // 清除錯誤訊息
      } else {
        const errorData = await response.json();
        setError(errorData.error || '新增失敗');
      }
    } catch (err) {
      setError('新增課程進度時發生錯誤');
      console.error('新增課程進度錯誤:', err);
    }
  };

  // 更新班別程度
  const handleUpdateClassAbility = async (abilityId: number, updates: Partial<ClassAbility>) => {
    try {
      const response = await fetch(`/api/students/${studentId}/class-abilities/${abilityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedAbility = await response.json();
        setClassAbilities(prev => 
          prev.map(ability => 
            ability.id === abilityId ? updatedAbility : ability
          )
        );
        setError(null); // 清除錯誤訊息
      } else {
        const errorData = await response.json();
        setError(errorData.error || '更新失敗');
      }
    } catch (err) {
      setError('更新班別程度時發生錯誤');
      console.error('更新班別程度錯誤:', err);
    }
  };

  // 處理班別下拉選單關閉事件
  const handleClassTypeSelectClose = async (abilityId: number, currentClassType: string) => {
    // 如果班別為空，自動刪除這筆資料（不詢問確認）
    if (!currentClassType || currentClassType === '') {
      console.log('班別為空，自動刪除記錄 ID:', abilityId);
      await handleDeleteClassAbilitySilent(abilityId);
    }
  };

  // 處理課程下拉選單關閉事件
  const handleCourseSelectClose = async (progressId: number, currentCourseId: number | null) => {
    // 如果課程ID為null、0或無效值，自動刪除這筆資料（不詢問確認）
    if (!currentCourseId || currentCourseId === 0 || currentCourseId === null) {
      console.log('課程ID無效，自動刪除記錄 ID:', progressId);
      await handleDeleteCourseProgressSilent(progressId);
    }
  };

  // 更新課程進度
  const handleUpdateCourseProgress = async (progressId: number, updates: Partial<CourseProgress>) => {
    try {
      const response = await fetch(`/api/students/${studentId}/course-progress/${progressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setCourseProgress(prev => 
          prev.map(progress => 
            progress.id === progressId ? updatedProgress : progress
          )
        );
        setError(null); // 清除錯誤訊息
      } else {
        const errorData = await response.json();
        setError(errorData.error || '更新失敗');
      }
    } catch (err) {
      setError('更新課程進度時發生錯誤');
      console.error('更新課程進度錯誤:', err);
    }
  };

  // 刪除班別程度（靜默刪除，不詢問確認）
  const handleDeleteClassAbilitySilent = async (abilityId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/class-abilities/${abilityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClassAbilities(prev => prev.filter(ability => ability.id !== abilityId));
        setError(null); // 清除錯誤訊息
      } else {
        setError('刪除失敗');
      }
    } catch (err) {
      setError('刪除班別程度時發生錯誤');
      console.error('刪除班別程度錯誤:', err);
    }
  };

  // 刪除班別程度（帶確認對話框）
  const handleDeleteClassAbility = async (abilityId: number) => {
    if (!window.confirm('確定要刪除這個班別程度記錄嗎？')) return;

    try {
      const response = await fetch(`/api/students/${studentId}/class-abilities/${abilityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClassAbilities(prev => prev.filter(ability => ability.id !== abilityId));
        setError(null); // 清除錯誤訊息
      } else {
        setError('刪除失敗');
      }
    } catch (err) {
      setError('刪除班別程度時發生錯誤');
      console.error('刪除班別程度錯誤:', err);
    }
  };

  // 刪除課程進度（靜默刪除，不詢問確認）
  const handleDeleteCourseProgressSilent = async (progressId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/course-progress/${progressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourseProgress(prev => prev.filter(progress => progress.id !== progressId));
        setError(null); // 清除錯誤訊息
      } else {
        setError('刪除失敗');
      }
    } catch (err) {
      setError('刪除課程進度時發生錯誤');
      console.error('刪除課程進度錯誤:', err);
    }
  };

  // 刪除課程進度（帶確認對話框）
  const handleDeleteCourseProgress = async (progressId: number) => {
    if (!window.confirm('確定要刪除這個課程進度記錄嗎？')) return;

    try {
      const response = await fetch(`/api/students/${studentId}/course-progress/${progressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourseProgress(prev => prev.filter(progress => progress.id !== progressId));
        setError(null); // 清除錯誤訊息
      } else {
        setError('刪除失敗');
      }
    } catch (err) {
      setError('刪除課程進度時發生錯誤');
      console.error('刪除課程進度錯誤:', err);
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

  if (loading) {
    return <Typography>載入中...</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5}>
        {/* 左側：班別程度能力 */}
        <Box sx={{ width: '35.00%' }}>
          <Card>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                }}>
                  班別程度能力
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleQuickAddClassAbility}
                >
                  新增班別
                </Button>
              </Box>

              {classAbilities.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  尚無班別程度記錄
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                  {classAbilities.map((ability) => (
                    <Box
                      key={ability.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 0.576,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        backgroundColor: '#fafafa',
                        width: '100%',
                        minHeight: '40px'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <FormControl size="small" sx={{ width: '60%' }}>
                          <Select
                            value={classTypes.length > 0 && ability.class_type ? ability.class_type : ''}
                            onChange={(e) => handleUpdateClassAbility(ability.id, { class_type: e.target.value })}
                            onClose={() => handleClassTypeSelectClose(ability.id, ability.class_type)}
                            disabled={classTypes.length === 0}
                            sx={{ fontSize: '0.875rem', height: '32px' }}
                          >
                            <MenuItem value="" disabled>
                              {classTypes.length === 0 ? '載入中...' : '請選擇班別'}
                            </MenuItem>
                            {classTypes.map((type) => (
                              <MenuItem key={type.class_code} value={type.class_code}>
                                {type.class_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ width: '30%' }}>
                          <Select
                            value={ability.ability_level}
                            onChange={(e) => handleUpdateClassAbility(ability.id, { ability_level: e.target.value })}
                            sx={{ fontSize: '0.75rem', height: '28px' }}
                          >
                            <MenuItem value="新手">新手</MenuItem>
                            <MenuItem value="入門">入門</MenuItem>
                            <MenuItem value="中階">中階</MenuItem>
                            <MenuItem value="高階">高階</MenuItem>
                            <MenuItem value="精英">精英</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClassAbility(ability.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* 右側：課程進度 */}
        <Box sx={{ width: '40.00%' }}>
          <Card>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1rem' 
                }}>
                  課程進度
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleQuickAddCourseProgress}
                >
                  新增課程
                </Button>
              </Box>

              {courseProgress.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  尚無課程進度記錄
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                  {courseProgress.map((progress) => {
                    console.log('課程進度 progress:', progress);
                    console.log('目前 courses:', courses);
                    return (
                      <Box
                        key={progress.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 0.7,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          backgroundColor: '#fafafa',
                          width: '100%',
                          minHeight: '40px'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <FormControl size="small" sx={{ width: '60%' }}>
                            <Select
                              value={progress.course_id && progress.course_id > 0 ? progress.course_id.toString() : ''}
                              onChange={(e) => {
                                const courseId = e.target.value === '' ? 0 : parseInt(e.target.value);
                                handleUpdateCourseProgress(progress.id, { course_id: courseId });
                              }}
                              onClose={() => handleCourseSelectClose(progress.id, progress.course_id)}
                              sx={{ fontSize: '0.875rem', height: '32px' }}
                            >
                              <MenuItem value="" disabled>
                                {courses.length === 0 ? '載入中...' : '請選擇課程'}
                              </MenuItem>
                              {courses.length > 0 ? (
                                courses.map((course) => (
                                  <MenuItem key={course.id} value={course.id}>
                                    {course.name}
                                  </MenuItem>
                                ))
                              ) : null}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ width: '30%' }}>
                            <Select
                              value={progress.ability_level}
                              onChange={(e) => handleUpdateCourseProgress(progress.id, { ability_level: e.target.value })}
                              sx={{ fontSize: '0.75rem', height: '28px' }}
                            >
                              <MenuItem value="新手">新手</MenuItem>
                              <MenuItem value="入門">入門</MenuItem>
                              <MenuItem value="中階">中階</MenuItem>
                              <MenuItem value="高階">高階</MenuItem>
                              <MenuItem value="精英">精英</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCourseProgress(progress.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default StudentCourseAbilities; 