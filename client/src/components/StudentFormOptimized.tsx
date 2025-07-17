import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Divider,
  Stack,
  FormHelperText
} from '@mui/material';
import CustomAlert from './CustomAlert';
import StudentCourseAbilities from './StudentCourseAbilities';

interface Student {
  id?: number;
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
  enrollment_status: string;
  notes: string;
  class_schedule_type?: string; // 新增
  referrer?: string; // 新增：介紹人
}

interface ClassType {
  class_code: string;
  class_name: string;
  description: string;
  sort_order: number;
}

interface StudentFormOptimizedProps {
  student: Student | null;
  onSave: (data: Partial<Student>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const StudentFormOptimized: React.FC<StudentFormOptimizedProps> = ({
  student,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    chinese_name: '',
    english_name: '',
    student_phone: '',
    student_email: 'IDK@gmail.com',
    student_line: '',
    father_name: '',
    father_phone: '',
    father_line: '',
    mother_name: '',
    mother_phone: '',
    mother_line: '',
    school: '',
    grade: '',
    gender: '',
    level_type: '',
    class_type: '',
    enrollment_status: '進行中',
    notes: '',
    class_schedule_type: '常態班', // 新增
    referrer: '' // 新增：介紹人
  });

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [referrers, setReferrers] = useState<string[]>([]);
  const [classTypesLoading, setClassTypesLoading] = useState(true);

  // 自定義 Alert 狀態
  const [customAlert, setCustomAlert] = useState({
    open: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    title: ''
  });

  // 顯示自定義 Alert 的函數
  const showAlert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', title?: string) => {
    setCustomAlert({
      open: true,
      message,
      type,
      title: title || ''
    });
  };

  const closeAlert = () => {
    setCustomAlert(prev => ({ ...prev, open: false }));
  };

  // 載入班別資料
  useEffect(() => {
    const fetchClassTypes = async () => {
      try {
        setClassTypesLoading(true);
        const response = await fetch('/api/class-types');
        if (response.ok) {
          const data = await response.json();
          setClassTypes(data);
        } else {
          console.error('無法載入班別資料');
        }
      } catch (error) {
        console.error('載入班別資料時發生錯誤:', error);
      } finally {
        setClassTypesLoading(false);
      }
    };

    fetchClassTypes();
  }, []);

  // 載入學校資料
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/students/schools');
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
        } else {
          console.error('無法載入學校資料');
        }
      } catch (error) {
        console.error('載入學校資料時發生錯誤:', error);
      }
    };

    fetchSchools();
  }, []);

  // 載入介紹人資料
  useEffect(() => {
    const fetchReferrers = async () => {
      try {
        const response = await fetch('/api/students/referrers');
        if (response.ok) {
          const data = await response.json();
          setReferrers(data);
        } else {
          console.error('無法載入介紹人資料');
        }
      } catch (error) {
        console.error('載入介紹人資料時發生錯誤:', error);
      }
    };

    fetchReferrers();
  }, []);

  useEffect(() => {
    if (student) {
      // 編輯現有學生
      setFormData({
        chinese_name: student.chinese_name || '',
        english_name: student.english_name || '',
        student_phone: student.student_phone || '',
        student_email: student.student_email || '',
        student_line: student.student_line || '',
        father_name: student.father_name || '',
        father_phone: student.father_phone || '',
        father_line: student.father_line || '',
        mother_name: student.mother_name || '',
        mother_phone: student.mother_phone || '',
        mother_line: student.mother_line || '',
        school: student.school || '',
        grade: student.grade || '',
        gender: student.gender || '',
        level_type: student.level_type || '',
        class_type: student.class_type || '',
        enrollment_status: student.enrollment_status || '進行中',
        notes: student.notes || '',
        class_schedule_type: student.class_schedule_type || '常態班', // 新增
        referrer: student.referrer || '' // 新增：介紹人
      });
    } else {
      // 新增學生，重置表單資料
      setFormData({
        chinese_name: '',
        english_name: '',
        student_phone: '',
        student_email: 'IDK@gmail.com',
        student_line: '',
        father_name: '',
        father_phone: '',
        father_line: '',
        mother_name: '',
        mother_phone: '',
        mother_line: '',
        school: '',
        grade: '',
        gender: '',
        level_type: '',
        class_type: '',
        enrollment_status: '進行中',
        notes: '',
        class_schedule_type: '常態班', // 新增
        referrer: '' // 新增：介紹人
      });
    }
  }, [student]);

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 建立錯誤訊息陣列
    const errors: string[] = [];
    
    // 驗證必填欄位
    if (!formData.chinese_name?.trim()) {
      errors.push('中文姓名');
    }
    
    if (!formData.student_email?.trim()) {
      errors.push('學生信箱');
    }
    
    if (!formData.school?.trim()) {
      errors.push('學校');
    }
    
    if (!formData.grade?.trim()) {
      errors.push('年級');
    }
    
    if (!formData.gender?.trim()) {
      errors.push('性別');
    }
    
    if (!formData.level_type?.trim()) {
      errors.push('程度');
    }
    
    if (!formData.class_type?.trim()) {
      errors.push('班別');
    }
    
    // 如果有錯誤，顯示所有缺失的欄位
    if (errors.length > 0) {
      const errorMessage = `請填寫以下必要欄位：\n${errors.join('、')}`;
      showAlert(errorMessage, 'warning', '表單驗證失敗');
      return;
    }
    
    // 驗證信箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.student_email || '')) {
      showAlert('請輸入有效的學生信箱格式', 'warning', '信箱格式錯誤');
      return;
    }
    
    onSave(formData);
  };

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 1000,
          mx: 'auto',
          p: 3,
          bgcolor: 'white',
          borderRadius: 1,
          boxShadow: 1,
          opacity: isLoading ? 0.7 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          position: 'relative'
        }}
      >
        {/* 基本資料區域 */}
        <Typography
          variant="h6"
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: 'black',
            mb: 2,
            pb: 1,
            borderBottom: '2px solid #e3f2fd',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          基本資料
        </Typography>
        
        {/* 基本資料：第一行 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, width: 'fit-content' }}>
          <Box sx={{ width: '140px' }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                中文姓名<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <TextField
                value={formData.chinese_name}
                onChange={(e) => handleChange('chinese_name', e.target.value)}
                required
                placeholder="請輸入中文姓名"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              />
            </FormControl>
          </Box>
          
          <Box sx={{ width: '168px' }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                英文姓名
              </InputLabel>
              <TextField
                value={formData.english_name}
                onChange={(e) => handleChange('english_name', e.target.value)}
                placeholder="請輸入英文姓名"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              />
            </FormControl>
          </Box>
          
          <Box sx={{ width: '120px' }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                學校<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Autocomplete
                options={schools}
                value={formData.school}
                onChange={(event, newValue) => handleChange('school', newValue || '')}
                onInputChange={(event, newInputValue) => {
                  if (!schools.includes(newInputValue)) {
                    handleChange('school', newInputValue);
                  }
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="請輸入或選擇學校"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        fontSize: '14px'
                      }
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-input': {
                    padding: '8px 12px !important'
                  }
                }}
              />
            </FormControl>
          </Box>
          
          <Box sx={{ width: '120px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                年級<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Select
                value={formData.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '13px'
                  }
                }}
              >
                <MenuItem value="">年級</MenuItem>
                <MenuItem disabled>小學</MenuItem>
                <MenuItem value="小一">小一</MenuItem>
                <MenuItem value="小二">小二</MenuItem>
                <MenuItem value="小三">小三</MenuItem>
                <MenuItem value="小四">小四</MenuItem>
                <MenuItem value="小五">小五</MenuItem>
                <MenuItem value="小六">小六</MenuItem>
                <MenuItem disabled>國中</MenuItem>
                <MenuItem value="國一">國一</MenuItem>
                <MenuItem value="國二">國二</MenuItem>
                <MenuItem value="國三">國三</MenuItem>
                <MenuItem disabled>高中</MenuItem>
                <MenuItem value="高一">高一</MenuItem>
                <MenuItem value="高二">高二</MenuItem>
                <MenuItem value="高三">高三</MenuItem>
                <MenuItem disabled>大學</MenuItem>
                <MenuItem value="大一">大一</MenuItem>
                <MenuItem value="大二">大二</MenuItem>
                <MenuItem value="大三">大三</MenuItem>
                <MenuItem value="大四">大四</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '100px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                性別<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '13px'
                  }
                }}
              >
                <MenuItem value="">選</MenuItem>
                <MenuItem value="男">男</MenuItem>
                <MenuItem value="女">女</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* 基本資料：第二行 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, width: 'fit-content' }}>
          <Box sx={{ width: '180px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                班別<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Select
                value={classTypesLoading || classTypes.length === 0 ? '' : (formData.class_type || '')}
                onChange={(e) => handleChange('class_type', e.target.value)}
                required
                size="small"
                disabled={classTypesLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              >
                <MenuItem value="">
                  {classTypesLoading ? '載入中...' : '請選擇'}
                </MenuItem>
                {classTypes.map((classType) => (
                  <MenuItem key={classType.class_code} value={classType.class_code}>
                    {classType.class_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '100px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>程度</InputLabel>
              <Select
                value={formData.level_type}
                onChange={(e) => handleChange('level_type', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              >
                <MenuItem value="">請選擇</MenuItem>
                <MenuItem value="新手">新手</MenuItem>
                <MenuItem value="入門">入門</MenuItem>
                <MenuItem value="中階">中階</MenuItem>
                <MenuItem value="高階">高階</MenuItem>
                <MenuItem value="精英">精英</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '120px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>就讀狀態</InputLabel>
              <Select
                value={formData.enrollment_status}
                onChange={(e) => handleChange('enrollment_status', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              >
                <MenuItem value="進行中">進行中</MenuItem>
                <MenuItem value="暫停中">暫停中</MenuItem>
                <MenuItem value="已畢業">已畢業</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ width: '150px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                班級排程類型<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Select
                value={formData.class_schedule_type || '常態班'}
                onChange={(e) => handleChange('class_schedule_type', e.target.value)}
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              >
                <MenuItem value="常態班">常態班</MenuItem>
                <MenuItem value="短期班">短期班</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '140px' }}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                介紹人
              </InputLabel>
              <Autocomplete
                options={referrers}
                value={formData.referrer}
                onChange={(event, newValue) => handleChange('referrer', newValue || '')}
                onInputChange={(event, newInputValue) => {
                  if (!referrers.includes(newInputValue)) {
                    handleChange('referrer', newInputValue);
                  }
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="請輸入或選擇介紹人"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        fontSize: '14px'
                      }
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-input': {
                    padding: '8px 12px !important'
                  }
                }}
              />
            </FormControl>
          </Box>
        </Box>

        {/* 課程程度管理區域 */}
        {student?.id && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: 'black',
                mb: 2,
                pb: 1,
                borderBottom: '2px solid #e3f2fd',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              課程程度管理
            </Typography>
            <StudentCourseAbilities studentId={student.id} />
          </Box>
        )}

        {/* 聯絡資訊區域 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: 'black',
              mb: 2,
              pb: 1,
              borderBottom: '2px solid #e3f2fd',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            聯絡資訊
          </Typography>

          {/* 學生聯絡方式 */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  學生電話
                </InputLabel>
                <TextField
                  type="tel"
                  value={formData.student_phone}
                  onChange={(e) => handleChange('student_phone', e.target.value)}
                  placeholder="請輸入電話號碼"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  學生信箱<span style={{ color: '#d32f2f' }}>*</span>
                </InputLabel>
                <TextField
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => handleChange('student_email', e.target.value)}
                  required
                  placeholder="請輸入電子信箱"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  學生Line
                </InputLabel>
                <TextField
                  type="text"
                  value={formData.student_line}
                  onChange={(e) => handleChange('student_line', e.target.value)}
                  placeholder="請輸入Line ID"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
          </Stack>

          {/* 父親聯絡方式 */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  父親姓名
                </InputLabel>
                <TextField
                  type="text"
                  value={formData.father_name}
                  onChange={(e) => handleChange('father_name', e.target.value)}
                  placeholder="請輸入父親姓名"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  父親電話
                </InputLabel>
                <TextField
                  type="tel"
                  value={formData.father_phone}
                  onChange={(e) => handleChange('father_phone', e.target.value)}
                  placeholder="請輸入電話號碼"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  父親Line
                </InputLabel>
                <TextField
                  type="text"
                  value={formData.father_line}
                  onChange={(e) => handleChange('father_line', e.target.value)}
                  placeholder="請輸入Line ID"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
          </Stack>

          {/* 母親聯絡方式 */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  母親姓名
                </InputLabel>
                <TextField
                  type="text"
                  value={formData.mother_name}
                  onChange={(e) => handleChange('mother_name', e.target.value)}
                  placeholder="請輸入母親姓名"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  母親電話
                </InputLabel>
                <TextField
                  type="tel"
                  value={formData.mother_phone}
                  onChange={(e) => handleChange('mother_phone', e.target.value)}
                  placeholder="請輸入電話號碼"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
            
            <Box sx={{ width: '33%' }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -9px) scale(0.75)'
                    }
                  }}
                >
                  母親Line
                </InputLabel>
                <TextField
                  type="text"
                  value={formData.mother_line}
                  onChange={(e) => handleChange('mother_line', e.target.value)}
                  placeholder="請輸入Line ID"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px'
                    }
                  }}
                />
              </FormControl>
            </Box>
          </Stack>
        </Box>

        {/* 備註與按鈕並排區域 */}
        <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
          {/* 備註區域 */}
          <Box sx={{ width: '78%' }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: 'black',
                mb: 2,
                pb: 1,
                borderBottom: '2px solid #e3f2fd',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              備註
            </Typography>
            <FormControl fullWidth>
              <TextField
                multiline
                rows={8}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="請輸入備註資訊"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px'
                  }
                }}
              />
            </FormControl>
          </Box>

          {/* 按鈕區域 */}
          <Box sx={{ width: '22%', display: 'flex', alignItems: 'flex-end', pb: 1 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                sx={{
                  px: 3,
                  py: 1,
                  borderColor: '#666',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#333',
                    color: '#333'
                  }
                }}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  px: 3,
                  py: 1,
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0'
                  }
                }}
              >
                {isLoading ? '儲存中...' : (student ? '更新' : '新增')}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* 自定義 Alert 組件 */}
      <CustomAlert
        open={customAlert.open}
        onClose={closeAlert}
        message={customAlert.message}
        type={customAlert.type}
        title={customAlert.title}
      />
    </>
  );
};

export default StudentFormOptimized; 