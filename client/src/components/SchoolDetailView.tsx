import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import { getEducationLevelColors } from '../utils/educationLevelColors';

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

interface SchoolDetailViewProps {
  school: School;
  onEdit: () => void;
  onClose: () => void;
}

const SchoolDetailView: React.FC<SchoolDetailViewProps> = ({
  school,
  onEdit,
  onClose
}) => {
  return (
    <Box sx={{ p: 2 }}>
      {/* 標題區域 */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {school.school_name}
        </Typography>
        {school.short_name && (
          <Typography variant="h6" color="text.secondary">
            ({school.short_name})
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* 基本資訊 */}
      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
        {/* 左側：基本資料 */}
        <Paper sx={{ p: 3, flex: '1 1 400px', minWidth: 0 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            基本資料
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                學校類型
              </Typography>
              <Chip 
                label={school.school_type} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                行政區
              </Typography>
              <Typography variant="body1">
                {school.district}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                教育階段
              </Typography>
              <Chip
                label={school.education_level}
                size="small"
                sx={{ ...getEducationLevelColors(school.education_level) }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                我們的學生數
              </Typography>
              <Chip 
                label={`${school.our_student_count} 人`} 
                size="small" 
                color="info" 
              />
            </Box>
          </Box>
        </Paper>

        {/* 右側：聯絡資訊 */}
        <Paper sx={{ p: 3, flex: '1 1 400px', minWidth: 0 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            聯絡資訊
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                電話
              </Typography>
              <Typography variant="body1" sx={{ 
                color: school.phone ? 'text.primary' : 'text.secondary',
                fontStyle: school.phone ? 'normal' : 'italic'
              }}>
                {school.phone || '未填寫'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', minWidth: '80px' }}>
                地址
              </Typography>
              <Typography variant="body1" sx={{ 
                color: school.address ? 'text.primary' : 'text.secondary',
                fontStyle: school.address ? 'normal' : 'italic',
                textAlign: 'right',
                flex: 1
              }}>
                {school.address || '未填寫'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Stack>

      {/* 按鈕區域 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          學校 ID: {school.id}
        </Typography>
      </Box>
    </Box>
  );
};

export default SchoolDetailView; 