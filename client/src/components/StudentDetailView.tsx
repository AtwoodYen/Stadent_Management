import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography,
  Divider,
  Chip,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import FormRow from './FormRow';
import FormContainer from './FormContainer';
import StudentCourseAbilitiesReadOnly from './StudentCourseAbilitiesReadOnly';
import { getLevelColors } from '../utils/levelColors';
import { getGenderColors } from '../utils/genderColors';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

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
  created_at?: string;
  updated_at?: string;
  class_schedule_type?: string; // 新增
  referrer?: string; // 新增：介紹人
  university?: string; // 新增：錄取大學
  major?: string; // 新增：就讀科系
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
  onDelete: () => void;
  onClose: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  onEdit,
  onDelete,
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
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', fontSize: '1.3rem' }}>
          基本資料
        </Typography>
        
        {/* 第一行：中文姓名、英文姓名、性別 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 1 }}>
          <FormRow label="中文姓名" labelWidth={80}>
            <DisplayText value={student.chinese_name} />
          </FormRow>
          
          <FormRow label="英文姓名" labelWidth={80}>
            <DisplayText value={student.english_name} />
          </FormRow>
          
          <FormRow label="性別" labelWidth={80}>
            <Chip 
              label={student.gender || '未設定'} 
              size="small"
              sx={{
                backgroundColor: student.gender ? getGenderColors(student.gender).backgroundColor : '#f5f5f5',
                color: student.gender ? getGenderColors(student.gender).color : '#757575',
                border: student.gender ? '1px solid' : 'none',
                borderColor: student.gender ? getGenderColors(student.gender).borderColor : 'transparent'
              }}
            />
          </FormRow>
        </Box>

        {/* 第二行：學校、年級、班級排程類型、介紹人 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 3, mb: 1 }}>
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
          
          <FormRow label="班級排程類型" labelWidth={80}>
            <Chip
              label={student.class_schedule_type || '未設定'}
              size="small"
              sx={{
                backgroundColor: student.class_schedule_type === '常態班' ? '#e3f2fd' : student.class_schedule_type === '短期班' ? '#fff3e0' : '#f5f5f5',
                color: student.class_schedule_type === '常態班' ? '#1976d2' : student.class_schedule_type === '短期班' ? '#f57c00' : '#757575',
                border: student.class_schedule_type ? '1px solid' : 'none',
                borderColor: student.class_schedule_type === '常態班' ? '#1976d2' : student.class_schedule_type === '短期班' ? '#f57c00' : 'transparent'
              }}
            />
          </FormRow>
          
          <FormRow label="介紹人" labelWidth={80}>
            <DisplayText value={student.referrer || ''} />
          </FormRow>
        </Box>

        {/* 第三行：班別、程度、就讀狀態 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 1 }}>
          <FormRow label="班別" labelWidth={80}>
            <Chip 
              label={getClassTypeName(student.class_type) || '未設定'} 
              size="small"
              sx={{
                backgroundColor: student.class_type === 'CPP' ? '#e3f2fd' : // 淺藍色 - C/C++
                       student.class_type === 'PROJECT' ? '#f3e5f5' : // 淺紫色 - 專題製作
                       student.class_type === 'SCRATCH' ? '#e8f5e8' : // 淺綠色 - Scratch
                       student.class_type === 'APCS_A' ? '#fff3e0' : // 淺橙色 - APCS A
                       student.class_type === 'APCS_P' ? '#fce4ec' : // 淺粉色 - APCS P
                       student.class_type === 'ANIMATION' ? '#f1f8e9' : // 淺青綠色 - 動畫美術
                       student.class_type === 'PYTHON' ? '#fff8e1' : // 淺黃色 - Python
                       '#f5f5f5', // 預設灰色
                color: student.class_type === 'CPP' ? '#1976d2' : // 深藍色
                       student.class_type === 'PROJECT' ? '#7b1fa2' : // 深紫色
                       student.class_type === 'SCRATCH' ? '#388e3c' : // 深綠色
                       student.class_type === 'APCS_A' ? '#f57c00' : // 深橙色
                       student.class_type === 'APCS_P' ? '#c2185b' : // 深粉色
                       student.class_type === 'ANIMATION' ? '#689f38' : // 深青綠色
                       student.class_type === 'PYTHON' ? '#f57f17' : // 深黃色 - Python
                       '#757575', // 預設深灰色
                border: student.class_type ? '1px solid' : 'none',
                borderColor: student.class_type === 'CPP' ? '#1976d2' :
                            student.class_type === 'PROJECT' ? '#7b1fa2' :
                            student.class_type === 'SCRATCH' ? '#388e3c' :
                            student.class_type === 'APCS_A' ? '#f57c00' :
                            student.class_type === 'APCS_P' ? '#c2185b' :
                            student.class_type === 'ANIMATION' ? '#689f38' :
                            student.class_type === 'PYTHON' ? '#f57f17' :
                            'transparent'
              }}
            />
          </FormRow>
          
          <FormRow label="程度" labelWidth={80}>
            <Chip 
              label={student.level_type || '未設定'} 
              size="small"
              sx={{
                backgroundColor: student.level_type ? getLevelColors(student.level_type).backgroundColor : '#f5f5f5',
                color: student.level_type ? getLevelColors(student.level_type).color : '#757575',
                border: student.level_type ? '1px solid' : 'none',
                borderColor: student.level_type ? getLevelColors(student.level_type).borderColor : 'transparent'
              }}
            />
          </FormRow>
          
          <FormRow label="就讀狀態" labelWidth={80}>
            <Chip 
              label={student.enrollment_status || '未設定'} 
              size="small"
              sx={{
                backgroundColor: student.enrollment_status === '進行中' ? '#e8f5e8' : // 淺綠色
                       student.enrollment_status === '暫停中' ? '#fff3e0' : // 淺橙色
                       student.enrollment_status === '已畢業' ? '#f3e5f5' : // 淺紫色
                       '#f5f5f5', // 預設灰色
                color: student.enrollment_status === '進行中' ? '#388e3c' : // 深綠色
                       student.enrollment_status === '暫停中' ? '#f57c00' : // 深橙色
                       student.enrollment_status === '已畢業' ? '#7b1fa2' : // 深紫色
                       '#757575', // 預設深灰色
                border: student.enrollment_status ? '1px solid' : 'none',
                borderColor: student.enrollment_status === '進行中' ? '#388e3c' :
                            student.enrollment_status === '暫停中' ? '#f57c00' :
                            student.enrollment_status === '已畢業' ? '#7b1fa2' :
                            'transparent'
              }}
            />
          </FormRow>
        </Box>

        {/* 第四行：錄取大學、就讀科系 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 1 }}>
          <FormRow label="錄取大學" labelWidth={80}>
            <DisplayText value={student.university || ''} />
          </FormRow>
          
          <FormRow label="就讀科系" labelWidth={80}>
            <DisplayText value={student.major || ''} />
          </FormRow>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 學習程度區域 */}
      {student.id && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 0, fontWeight: 'bold', color: 'primary.main', fontSize: '1.3rem' }}>
            學習程度
          </Typography>
          <StudentCourseAbilitiesReadOnly studentId={student.id} />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* 聯絡資訊區域 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', fontSize: '1.3rem' }}>
          聯絡資訊
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
        <FormRow label="備註" labelWidth={50} mb={2}>
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
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', fontSize: '1.3rem' }}>
              系統資訊
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
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          編輯
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >
          刪除
        </Button>
        {student.class_schedule_type === '短期班' && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ScheduleIcon />}
            onClick={() => {
              // 計算本週的開始和結束日期
              const today = new Date();
              const dayOfWeek = today.getDay(); // 0 = 週日, 1 = 週一, ...
              const monday = new Date(today);
              monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              
              const weekStartDate = monday.toISOString().split('T')[0];
              const weekEndDate = sunday.toISOString().split('T')[0];
              
              // 開啟短期班排課編輯器
              window.open(
                `/short-term-schedule/${student.id}?week_start=${weekStartDate}&week_end=${weekEndDate}`,
                '_blank',
                'width=1200,height=800'
              );
            }}
          >
            短期班排課
          </Button>
        )}
        <Button 
          variant="outlined" 
          onClick={onClose}
        >
          關閉
        </Button>
              </Box>
      </FormContainer>
    );
  };

export default StudentDetailView; 