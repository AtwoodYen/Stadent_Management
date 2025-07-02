import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography,
  Divider,
  Chip
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
  created_at?: string;
  updated_at?: string;
}

interface ClassType {
  class_code: string;
  class_name: string;
  description: string;
  sort_order: number;
}

interface StudentDetailViewProps {
  student: Student;
  onEdit: () => void;
  onClose: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  onEdit,
  onClose
}) => {
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);

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

  // 根據班別代碼獲取班別名稱
  const getClassTypeName = (classCode: string) => {
    const classType = classTypes.find(ct => ct.class_code === classCode);
    return classType ? classType.class_name : classCode;
  };

  // 格式化日期顯示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  // 顯示文字的組件，處理空值
  const DisplayText: React.FC<{ value: string }> = ({ value }) => (
    <Typography 
      variant="body2" 
      sx={{ 
        color: value ? 'text.primary' : 'text.secondary',
        fontStyle: value ? 'normal' : 'italic'
      }}
    >
      {value || '未填寫'}
    </Typography>
  );

  return (
    <FormContainer 
      title="學生詳細資料"
      maxWidth={800}

    >
      {/* 基本資料區域 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
          📝 基本資料
        </Typography>
        
        {/* 第一行：中文姓名、英文姓名、班別 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 1 }}>
          <FormRow label="中文姓名" labelWidth={80}>
            <DisplayText value={student.chinese_name} />
          </FormRow>
          
          <FormRow label="英文姓名" labelWidth={80}>
            <DisplayText value={student.english_name} />
          </FormRow>
          
          <FormRow label="班別" labelWidth={60}>
            <Chip 
              label={getClassTypeName(student.class_type) || '未設定'} 
              size="small"
              color={student.class_type ? 'primary' : 'default'}
              variant="filled"
            />
          </FormRow>
        </Box>

        {/* 第二行：學校、年級、性別 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 1 }}>
          <FormRow label="學校" labelWidth={80}>
            <Chip 
              label={student.school || '未設定'} 
              size="small"
              color={student.school ? 'primary' : 'default'}
              variant="outlined"
            />
          </FormRow>
          
          <FormRow label="年級" labelWidth={80}>
            <Chip 
              label={student.grade || '未設定'} 
              size="small"
              color={student.grade ? 'secondary' : 'default'}
              variant="outlined"
            />
          </FormRow>
          
          <FormRow label="性別" labelWidth={60}>
            <Chip 
              label={student.gender || '未設定'} 
              size="small"
              color={student.gender === '男' ? 'info' : student.gender === '女' ? 'success' : 'default'}
              variant="outlined"
            />
          </FormRow>
        </Box>

        {/* 第三行：程度 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
          <FormRow label="程度" labelWidth={80}>
            <Chip 
              label={student.level_type || '未設定'} 
              size="small"
              color={student.level_type ? 'warning' : 'default'}
              variant="outlined"
            />
          </FormRow>
          
          <div></div> {/* 空白佔位 */}
          <div></div> {/* 空白佔位 */}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 聯絡資訊區域 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
          📞 聯絡資訊
        </Typography>
        
        {/* 學生聯絡方式 */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
          學生聯絡方式
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
          <FormRow label="學生電話" labelWidth={80}>
            <DisplayText value={student.student_phone} />
          </FormRow>
          
          <FormRow label="學生Line" labelWidth={80}>
            <DisplayText value={student.student_line} />
          </FormRow>
        </Box>

        <FormRow label="學生Email" labelWidth={80} mb={3}>
          <DisplayText value={student.student_email} />
        </FormRow>

        {/* 父親聯絡方式 */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
          父親聯絡方式
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
          <FormRow label="父親姓名" labelWidth={80}>
            <DisplayText value={student.father_name} />
          </FormRow>
          
          <FormRow label="父親電話" labelWidth={80}>
            <DisplayText value={student.father_phone} />
          </FormRow>
        </Box>

        <FormRow label="父親Line" labelWidth={80} mb={3}>
          <DisplayText value={student.father_line} />
        </FormRow>

        {/* 母親聯絡方式 */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
          母親聯絡方式
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
          <FormRow label="母親姓名" labelWidth={80}>
            <DisplayText value={student.mother_name} />
          </FormRow>
          
          <FormRow label="母親電話" labelWidth={80}>
            <DisplayText value={student.mother_phone} />
          </FormRow>
        </Box>

        <FormRow label="母親Line" labelWidth={80}>
          <DisplayText value={student.mother_line} />
        </FormRow>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 備註區域 */}
      <Box sx={{ mt: 4, mb: 3 }}>
        <FormRow label="備註" labelWidth={80} mb={2}>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              minHeight: 80,
              backgroundColor: 'grey.50',
              width: '400%'  /* 讓備註欄位寬度是原本的4倍 */
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: student.notes ? 'text.primary' : 'text.secondary',
                fontStyle: student.notes ? 'normal' : 'italic',
                whiteSpace: 'pre-wrap'
              }}
            >
              {student.notes || '無備註'}
            </Typography>
          </Box>
        </FormRow>
      </Box>

      {/* 系統資訊 */}
      {(student.created_at || student.updated_at) && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              ℹ️ 系統資訊
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <FormRow label="建立時間" labelWidth={80}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {formatDate(student.created_at)}
                </Typography>
              </FormRow>
              
              <FormRow label="更新時間" labelWidth={80}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {formatDate(student.updated_at)}
                </Typography>
              </FormRow>
            </Box>
          </Box>
        </>
      )}

      {/* 按鈕區域 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ minWidth: 100 }}
        >
          關閉
        </Button>
        <Button 
          variant="contained"
          onClick={onEdit}
          sx={{ minWidth: 100 }}
        >
          編輯
        </Button>
              </Box>
      </FormContainer>
    );
  };

export default StudentDetailView; 