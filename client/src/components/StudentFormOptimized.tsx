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
    student_email: '',
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
    class_schedule_type: '常態班' // 新增
  });

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

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
        const response = await fetch('/api/class-types');
        if (response.ok) {
          const data = await response.json();
          setClassTypes(data);
        } else {
          console.error('無法載入班別資料');
        }
      } catch (error) {
        console.error('載入班別資料時發生錯誤:', error);
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
        class_schedule_type: student.class_schedule_type || '常態班' // 新增
      });
    } else {
      // 新增學生，重置表單資料
      setFormData({
        chinese_name: '',
        english_name: '',
        student_phone: '',
        student_email: '',
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
        class_schedule_type: '常態班' // 新增
      });
    }
  }, [student]);

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證必填欄位
    if (!formData.chinese_name?.trim()) {
      showAlert('請填寫中文姓名', 'warning');
      return;
    }
    
    if (!formData.student_email?.trim()) {
      showAlert('請填寫學生信箱', 'warning');
      return;
    }
    
    if (!formData.school?.trim()) {
      showAlert('請選擇學校', 'warning');
      return;
    }
    
    if (!formData.grade?.trim()) {
      showAlert('請選擇年級', 'warning');
      return;
    }
    
    if (!formData.gender?.trim()) {
      showAlert('請選擇性別', 'warning');
      return;
    }
    
    if (!formData.class_type?.trim()) {
      showAlert('請選擇班別', 'warning');
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
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ width: '14%' }}>
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
          
          <Box sx={{ width: '16.8%' }}>
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
          
          <Box sx={{ width: '12%' }}>
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
          
          <Box sx={{ width: '12%', pl: 0.75 }}>
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
          
          <Box sx={{ width: '14.4%', pl: 1.25 }}>
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
        </Stack>

        {/* 基本資料：第二行 */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ width: '10%' }}>
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
          
          <Box sx={{ width: '18.2%' }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                班別<span style={{ color: '#d32f2f' }}>*</span>
              </InputLabel>
              <Select
                value={formData.class_type}
                onChange={(e) => handleChange('class_type', e.target.value)}
                required
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px'
                  }
                }}
              >
                <MenuItem value="">請選擇</MenuItem>
                {classTypes.map((classType) => (
                  <MenuItem key={classType.class_code} value={classType.class_code}>
                    {classType.class_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '20%', pl: 3.75 }}>
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

          <Box sx={{ width: '20%', pl: 10 }}>
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
                  width: '160%',
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
        </Stack>

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