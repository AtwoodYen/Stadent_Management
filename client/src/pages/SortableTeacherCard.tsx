import React from 'react';
import { Card, Box, CardContent, CardActions, Button, Chip, Avatar, Divider, Typography } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator as DragIcon, Edit as EditIcon, Delete as DeleteIcon, School as SchoolIcon, Email as EmailIcon, Phone as PhoneIcon, AttachMoney as MoneyIcon } from '@mui/icons-material';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  availableDays: string[];
  courseCategories: string[];
  preferredCourses: string[];
  hourly_rate: number;
  experience: number;
  bio?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface SortableTeacherCardProps {
  id: string;
  teacher: Teacher;
  index: number;
  viewMode: 'grid' | 'list';
  user: any;
  handleOpenDialog: (teacher: Teacher) => void;
  handleOpenCourses: (teacher: Teacher) => void;
  handleToggleStatus: (id: number) => void;
  handleDeleteTeacher: (teacher: Teacher) => void;
}

const SortableTeacherCard: React.FC<SortableTeacherCardProps> = ({
  id,
  teacher,
  index,
  viewMode,
  user,
  handleOpenDialog,
  handleOpenCourses,
  handleToggleStatus,
  handleDeleteTeacher
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? 8 : 2,
    width: viewMode === 'grid' ? '350px' : '100%',
    minWidth: viewMode === 'grid' ? '350px' : '0',
    maxWidth: viewMode === 'grid' ? '350px' : '100%',
    margin: viewMode === 'grid' ? '0' : '0',
    display: 'flex',
    flexDirection: viewMode === 'list' ? 'row' : 'column',
    height: viewMode === 'list' ? 'auto' : 'fit-content',
    cursor: isDragging ? 'grabbing' : 'grab',
    transitionProperty: isDragging ? 'none' : 'all',
    transitionDuration: isDragging ? '0s' : '0.2s',
  } as React.CSSProperties;

  return (
    <Card ref={setNodeRef} style={style} {...attributes}>
      {/* 拖拽手柄區域 */}
      <Box {...listeners} sx={{
        p: 1,
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderBottom: viewMode === 'grid' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
        borderRight: viewMode === 'list' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
        minWidth: viewMode === 'list' ? '50px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <DragIcon fontSize="small" color={isDragging ? 'primary' : 'action'} />
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column', alignItems: viewMode === 'list' ? 'center' : 'stretch', gap: viewMode === 'list' ? 3 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: viewMode === 'grid' ? 2 : 0, minWidth: viewMode === 'list' ? '200px' : 'auto' }}>
          <Avatar sx={{ mr: 2, bgcolor: teacher.is_active ? 'primary.main' : 'grey.500' }}>
            {/* 頭像可擴充 */}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {teacher.name}
            </Typography>
            <Chip
              label={teacher.is_active ? '啟用' : '停用'}
              color={teacher.is_active ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>
        {viewMode === 'grid' ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {teacher.email}
              </Typography>
            </Box>
            {teacher.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {teacher.phone}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MoneyIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                時薪 ${teacher.hourly_rate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                經驗 {teacher.experience} 年
              </Typography>
            </Box>
                          {/* 顯示課程能力（優先顯示主力課程） */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                課程能力：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {(() => {
                  console.log(`師資 ${teacher.name} 的課程能力資料:`, {
                    preferredCourses: teacher.preferredCourses,
                    courseCategories: teacher.courseCategories,
                    preferredLength: teacher.preferredCourses?.length,
                    categoriesLength: teacher.courseCategories?.length
                  });
                  
                  if (teacher.preferredCourses && teacher.preferredCourses.length > 0) {
                    return teacher.preferredCourses.map((course, idx) => (
                      <Chip key={idx} label={course} size="small" variant="outlined" color="primary" />
                    ));
                  } else if (teacher.courseCategories && teacher.courseCategories.length > 0) {
                    return teacher.courseCategories.map((course, idx) => (
                      <Chip key={idx} label={course} size="small" variant="outlined" />
                    ));
                  } else {
                    return <Chip label="無課程能力" size="small" variant="outlined" />;
                  }
                })()}
              </Box>
            {teacher.bio && (
              <Typography variant="body2" color="text.secondary" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {teacher.bio}
              </Typography>
            )}
          </>
        ) : null}
      </CardContent>
      {viewMode === 'grid' && <Divider />}
      <CardActions sx={{
        justifyContent: viewMode === 'list' ? 'flex-end' : 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        flexDirection: viewMode === 'list' ? 'row' : 'row',
        minWidth: viewMode === 'list' ? 'auto' : 'auto'
      }}>
        <Button size="small" startIcon={<EditIcon />} onClick={e => { e.stopPropagation(); handleOpenDialog(teacher); }} sx={{ pointerEvents: 'auto' }}>編輯</Button>
        <Button size="small" color="info" onClick={e => { e.stopPropagation(); handleOpenCourses(teacher); }} sx={{ pointerEvents: 'auto' }}>課程能力</Button>
        <Button size="small" color={teacher.is_active ? 'warning' : 'success'} onClick={e => { e.stopPropagation(); handleToggleStatus(teacher.id); }} sx={{ pointerEvents: 'auto' }}>{teacher.is_active ? '停用' : '啟用'}</Button>
        {user?.role === 'admin' && (
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={e => { e.stopPropagation(); handleDeleteTeacher(teacher); }} sx={{ pointerEvents: 'auto' }}>刪除</Button>
        )}
      </CardActions>
    </Card>
  );
};

export default SortableTeacherCard;
