import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Typography,
  Alert
} from '@mui/material';

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

interface SchoolEditFormProps {
  school: School | null;
  onSave: (data: Partial<School>) => void;
  onCancel: () => void;
  districts: string[];
}

const SchoolEditForm: React.FC<SchoolEditFormProps> = ({
  school,
  onSave,
  onCancel,
  districts
}) => {
  const [formData, setFormData] = useState<Partial<School>>({
    school_name: '',
    short_name: '',
    school_type: '',
    district: '',
    education_level: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 初始化表單資料
  useEffect(() => {
    if (school) {
      setFormData({
        school_name: school.school_name,
        short_name: school.short_name,
        school_type: school.school_type,
        district: school.district,
        education_level: school.education_level,
        phone: school.phone,
        address: school.address
      });
    } else {
      setFormData({
        school_name: '',
        short_name: '',
        school_type: '',
        district: '',
        education_level: '',
        phone: '',
        address: ''
      });
    }
    setErrors({});
  }, [school]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.school_name?.trim()) {
      newErrors.school_name = '學校名稱為必填項目';
    }

    if (!formData.short_name?.trim()) {
      newErrors.short_name = '學校簡稱為必填項目';
    }

    if (!formData.school_type) {
      newErrors.school_type = '請選擇學校類型';
    }

    if (!formData.district) {
      newErrors.district = '請選擇行政區';
    }

    if (!formData.education_level) {
      newErrors.education_level = '請選擇教育階段';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('儲存失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理欄位變更
  const handleFieldChange = (field: keyof School, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        {school ? '編輯學校資料' : '新增學校'}
      </Typography>

      <Stack spacing={3}>
        {/* 第一行：學校名稱和簡稱 */}
        <Stack direction="row" spacing={2}>
          <TextField
            sx={{ flex: 2 }}
            label="學校名稱 *"
            value={formData.school_name || ''}
            onChange={(e) => handleFieldChange('school_name', e.target.value)}
            error={!!errors.school_name}
            helperText={errors.school_name}
            required
          />
          <TextField
            sx={{ flex: 1 }}
            label="簡稱 *"
            value={formData.short_name || ''}
            onChange={(e) => handleFieldChange('short_name', e.target.value)}
            error={!!errors.short_name}
            helperText={errors.short_name}
            required
          />
        </Stack>

        {/* 第二行：學校類型、行政區、教育階段 */}
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ flex: 1 }} error={!!errors.school_type} required>
            <InputLabel>學校類型 *</InputLabel>
            <Select
              value={formData.school_type || ''}
              onChange={(e) => handleFieldChange('school_type', e.target.value)}
              label="學校類型 *"
            >
              <MenuItem value="公立">公立</MenuItem>
              <MenuItem value="國立">國立</MenuItem>
              <MenuItem value="私立">私立</MenuItem>
            </Select>
          </FormControl>
          {errors.school_type && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {errors.school_type}
            </Typography>
          )}

          <FormControl sx={{ flex: 1 }} error={!!errors.district} required>
            <InputLabel>行政區 *</InputLabel>
            <Select
              value={formData.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              label="行政區 *"
            >
              {districts.map(district => (
                <MenuItem key={district} value={district}>
                  {district}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.district && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {errors.district}
            </Typography>
          )}

          <FormControl sx={{ flex: 1 }} error={!!errors.education_level} required>
            <InputLabel>教育階段 *</InputLabel>
            <Select
              value={formData.education_level || ''}
              onChange={(e) => handleFieldChange('education_level', e.target.value)}
              label="教育階段 *"
            >
              <MenuItem value="國小">國小</MenuItem>
              <MenuItem value="國中">國中</MenuItem>
              <MenuItem value="高中">高中</MenuItem>
              <MenuItem value="高職">高職</MenuItem>
              <MenuItem value="大學">大學</MenuItem>
            </Select>
          </FormControl>
          {errors.education_level && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {errors.education_level}
            </Typography>
          )}
        </Stack>

        {/* 第三行：電話 */}
        <TextField
          sx={{ width: '50%' }}
          label="電話"
          value={formData.phone || ''}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          placeholder="選填"
        />

        {/* 第四行：地址 */}
        <TextField
          fullWidth
          label="地址"
          value={formData.address || ''}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          placeholder="選填"
          multiline
          rows={3}
        />
      </Stack>

      {/* 按鈕區域 */}
      <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? '儲存中...' : (school ? '更新' : '新增')}
        </Button>
      </Stack>
    </Box>
  );
};

export default SchoolEditForm; 