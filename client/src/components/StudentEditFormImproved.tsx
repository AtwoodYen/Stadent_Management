import React, { useState } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  Box, 
  Typography,
  Divider
} from '@mui/material';
import FormRow from './FormRow';
import FormContainer from './FormContainer';

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
  notes: string;
}

interface StudentEditFormImprovedProps {
  student: Student | null;
  onSave: (data: Partial<Student>) => void;
  onCancel: () => void;
}

const StudentEditFormImproved: React.FC<StudentEditFormImprovedProps> = ({
  student,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    chinese_name: student?.chinese_name || '',
    english_name: student?.english_name || '',
    student_phone: student?.student_phone || '',
    student_email: student?.student_email || '',
    student_line: student?.student_line || '',
    father_name: student?.father_name || '',
    father_phone: student?.father_phone || '',
    father_line: student?.father_line || '',
    mother_name: student?.mother_name || '',
    mother_phone: student?.mother_phone || '',
    mother_line: student?.mother_line || '',
    school: student?.school || '',
    grade: student?.grade || '',
    gender: student?.gender || '',
    level_type: student?.level_type || '',
    class_type: student?.class_type || '',
    notes: student?.notes || ''
  });

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.chinese_name?.trim()) {
      alert('請填寫中文姓名');
      return;
    }
    
    onSave(formData);
  };

  return (
    <FormContainer 
      title={student ? '編輯學生' : '新增學生'}
      maxWidth={900}
    >
      <form onSubmit={handleSubmit}>
        {/* 基本資料區域 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            📝 基本資料
          </Typography>
          
          {/* 第一行：姓名和學校 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 1 }}>
            <FormRow label="中文姓名" required labelWidth={80}>
              <TextField
                size="small"
                value={formData.chinese_name}
                onChange={(e) => handleChange('chinese_name', e.target.value)}
                required
                fullWidth
              />
            </FormRow>
            
            <FormRow label="英文姓名" labelWidth={80}>
              <TextField
                size="small"
                value={formData.english_name}
                onChange={(e) => handleChange('english_name', e.target.value)}
                fullWidth
              />
            </FormRow>
          </Box>

          {/* 第二行：學校和年級 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 1 }}>
            <FormRow label="學校" required labelWidth={80}>
              <TextField
                size="small"
                value={formData.school}
                onChange={(e) => handleChange('school', e.target.value)}
                required
                fullWidth
              />
            </FormRow>
            
            <FormRow label="年級" required labelWidth={80}>
              <Select
                size="small"
                value={formData.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                fullWidth
                required
              >
                <MenuItem value="">選擇年級</MenuItem>
                <MenuItem value="高一">高一</MenuItem>
                <MenuItem value="高二">高二</MenuItem>
                <MenuItem value="高三">高三</MenuItem>
              </Select>
            </FormRow>
          </Box>

          {/* 第三行：性別、程度、班別 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <FormRow label="性別" required labelWidth={60}>
              <Select
                size="small"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                fullWidth
                required
              >
                <MenuItem value="">選擇</MenuItem>
                <MenuItem value="男">男</MenuItem>
                <MenuItem value="女">女</MenuItem>
              </Select>
            </FormRow>
            
            <FormRow label="程度" labelWidth={60}>
              <Select
                size="small"
                value={formData.level_type}
                onChange={(e) => handleChange('level_type', e.target.value)}
                fullWidth
              >
                <MenuItem value="">選擇</MenuItem>
                <MenuItem value="初級">初級</MenuItem>
                <MenuItem value="中級">中級</MenuItem>
                <MenuItem value="進階">進階</MenuItem>
              </Select>
            </FormRow>
            
            <FormRow label="班別" labelWidth={60}>
              <Select
                size="small"
                value={formData.class_type}
                onChange={(e) => handleChange('class_type', e.target.value)}
                fullWidth
              >
                <MenuItem value="">選擇</MenuItem>
                <MenuItem value="A班">A班</MenuItem>
                <MenuItem value="B班">B班</MenuItem>
                <MenuItem value="C班">C班</MenuItem>
              </Select>
            </FormRow>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 聯絡資訊區域 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            📞 聯絡資訊
          </Typography>
          
          {/* 學生聯絡方式 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            <FormRow label="學生電話" labelWidth={80}>
              <TextField
                size="small"
                type="tel"
                value={formData.student_phone}
                onChange={(e) => handleChange('student_phone', e.target.value)}
                fullWidth
              />
            </FormRow>
            
            <FormRow label="學生Line" labelWidth={80}>
              <TextField
                size="small"
                value={formData.student_line}
                onChange={(e) => handleChange('student_line', e.target.value)}
                fullWidth
              />
            </FormRow>
          </Box>

          <FormRow label="學生Email" labelWidth={80} mb={2}>
            <TextField
              size="small"
              type="email"
              value={formData.student_email}
              onChange={(e) => handleChange('student_email', e.target.value)}
              fullWidth
            />
          </FormRow>

          {/* 父親聯絡方式 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            <FormRow label="父親姓名" labelWidth={80}>
              <TextField
                size="small"
                value={formData.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)}
                fullWidth
              />
            </FormRow>
            
            <FormRow label="父親電話" labelWidth={80}>
              <TextField
                size="small"
                type="tel"
                value={formData.father_phone}
                onChange={(e) => handleChange('father_phone', e.target.value)}
                fullWidth
              />
            </FormRow>
          </Box>

          <FormRow label="父親Line" labelWidth={80} mb={2}>
            <TextField
              size="small"
              value={formData.father_line}
              onChange={(e) => handleChange('father_line', e.target.value)}
              fullWidth
            />
          </FormRow>

          {/* 母親聯絡方式 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            <FormRow label="母親姓名" labelWidth={80}>
              <TextField
                size="small"
                value={formData.mother_name}
                onChange={(e) => handleChange('mother_name', e.target.value)}
                fullWidth
              />
            </FormRow>
            
            <FormRow label="母親電話" labelWidth={80}>
              <TextField
                size="small"
                type="tel"
                value={formData.mother_phone}
                onChange={(e) => handleChange('mother_phone', e.target.value)}
                fullWidth
              />
            </FormRow>
          </Box>

          <FormRow label="母親Line" labelWidth={80}>
            <TextField
              size="small"
              value={formData.mother_line}
              onChange={(e) => handleChange('mother_line', e.target.value)}
              fullWidth
            />
          </FormRow>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 備註區域 */}
        <FormRow label="備註" labelWidth={80} mb={3}>
          <TextField
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            placeholder="請輸入備註事項..."
          />
        </FormRow>

        {/* 按鈕區域 */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={onCancel}
            sx={{ minWidth: 100 }}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            {student ? '更新' : '新增'}
          </Button>
        </Box>
      </form>
    </FormContainer>
  );
};

export default StudentEditFormImproved; 