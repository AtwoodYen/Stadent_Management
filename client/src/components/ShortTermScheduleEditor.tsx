import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimeSlot {
  time_slot: string;
  display_time: string;
}

interface ScheduleItem {
  id: number;
  student_id: number;
  student_name: string;
  week_start_date: string;
  week_end_date: string;
  day_of_week: number;
  time_slot: string;
  duration_minutes: number;
  lesson_type: 'physical' | 'online';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  teacher_id?: number;
  teacher_name?: string;
  subject?: string;
  classroom?: string;
  notes?: string;
}

interface ShortTermScheduleEditorProps {
  studentId: number;
  studentName: string;
  weekStartDate: string;
  weekEndDate: string;
  onClose: () => void;
}

// 可拖曳的排課卡片組件
const DraggableScheduleCard: React.FC<{
  schedule: ScheduleItem;
  onEdit: (schedule: ScheduleItem) => void;
  onDelete: (id: number) => void;
}> = ({ schedule, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: schedule.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1,
        cursor: 'grab',
        '&:hover': { boxShadow: 2 },
        '&:active': { cursor: 'grabbing' }
      }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <DragIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {schedule.subject || '未設定科目'}
          </Typography>
        </Box>
        <Typography variant="caption" display="block">
          {schedule.teacher_name || '未指派老師'}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          {schedule.duration_minutes}分鐘
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          <Chip
            label={schedule.lesson_type === 'physical' ? '實體' : '線上'}
            size="small"
            color={schedule.lesson_type === 'physical' ? 'primary' : 'secondary'}
            sx={{ fontSize: '0.6rem', height: 16 }}
          />
          <Chip
            label={schedule.status === 'scheduled' ? '已排' : 
                  schedule.status === 'completed' ? '完成' :
                  schedule.status === 'cancelled' ? '取消' : '調課'}
            size="small"
            color={schedule.status === 'scheduled' ? 'success' : 
                   schedule.status === 'completed' ? 'info' :
                   schedule.status === 'cancelled' ? 'error' : 'warning'}
            sx={{ fontSize: '0.6rem', height: 16 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          <Tooltip title="編輯">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(schedule);
              }}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(schedule.id);
              }}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

const ShortTermScheduleEditor: React.FC<ShortTermScheduleEditorProps> = ({
  studentId,
  studentName,
  weekStartDate,
  weekEndDate,
  onClose
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 編輯相關狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isNewSchedule, setIsNewSchedule] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    day_of_week: 1,
    time_slot: '09:00:00',
    duration_minutes: 30,
    lesson_type: 'physical' as 'physical' | 'online',
    teacher_id: '',
    subject: '',
    classroom: '',
    notes: ''
  });

  const dayNames = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];

  // 設定拖曳感應器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 載入資料
  useEffect(() => {
    loadData();
  }, [studentId, weekStartDate, weekEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 並行載入所有資料
      const [schedulesRes, timeSlotsRes, teachersRes] = await Promise.all([
        fetch(`/api/short-term-schedules/student/${studentId}?week_start_date=${weekStartDate}&week_end_date=${weekEndDate}`),
        fetch('/api/short-term-schedules/time-slots'),
        fetch('/api/teachers')
      ]);

      if (!schedulesRes.ok || !timeSlotsRes.ok || !teachersRes.ok) {
        throw new Error('載入資料失敗');
      }

      const [schedulesData, timeSlotsData, teachersData] = await Promise.all([
        schedulesRes.json(),
        timeSlotsRes.json(),
        teachersRes.json()
      ]);

      setSchedules(schedulesData);
      setTimeSlots(timeSlotsData);
      setTeachers(teachersData.filter((t: any) => t.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 取得指定日期和時段的排課
  const getScheduleAtTime = (dayOfWeek: number, timeSlot: string) => {
    return schedules.find(s => s.day_of_week === dayOfWeek && s.time_slot === timeSlot);
  };

  // 處理拖曳結束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const scheduleId = parseInt(active.id as string);
    const [targetDay, targetTime] = (over.id as string).split('-');
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    // 檢查目標時段是否已有排課
    const targetSchedule = getScheduleAtTime(parseInt(targetDay), targetTime);
    if (targetSchedule && targetSchedule.id !== scheduleId) {
      setError('目標時段已有排課');
      return;
    }

    try {
      // 更新排課
      const response = await fetch(`/api/short-term-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: parseInt(targetDay),
          time_slot: targetTime
        })
      });

      if (!response.ok) {
        throw new Error('更新排課失敗');
      }

      // 重新載入資料
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗');
    }
  };

  // 新增排課
  const handleAddSchedule = () => {
    setIsNewSchedule(true);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 1,
      time_slot: '09:00:00',
      duration_minutes: 30,
      lesson_type: 'physical',
      teacher_id: '',
      subject: '',
      classroom: '',
      notes: ''
    });
    setEditDialogOpen(true);
  };

  // 編輯排課
  const handleEditSchedule = (schedule: ScheduleItem) => {
    setIsNewSchedule(false);
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week,
      time_slot: schedule.time_slot,
      duration_minutes: schedule.duration_minutes,
      lesson_type: schedule.lesson_type,
      teacher_id: schedule.teacher_id?.toString() || '',
      subject: schedule.subject || '',
      classroom: schedule.classroom || '',
      notes: schedule.notes || ''
    });
    setEditDialogOpen(true);
  };

  // 刪除排課
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('確定要刪除這個排課嗎？')) return;

    try {
      const response = await fetch(`/api/short-term-schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('刪除排課失敗');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  // 儲存排課
  const handleSaveSchedule = async () => {
    try {
      const scheduleData = {
        ...formData,
        student_id: studentId,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : undefined
      };

      const url = isNewSchedule 
        ? '/api/short-term-schedules'
        : `/api/short-term-schedules/${editingSchedule!.id}`;
      
      const method = isNewSchedule ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '儲存失敗');
      }

      setEditDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題和操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            短期班排課 - {studentName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {weekStartDate} ~ {weekEndDate}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSchedule}
        >
          新增排課
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 排課表格 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Paper sx={{ overflow: 'auto' }}>
          <Box sx={{ minWidth: 800 }}>
            {/* 表頭 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ p: 2, borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" align="center">時段</Typography>
              </Box>
              {dayNames.slice(1).map((dayName, index) => (
                <Box key={index} sx={{ p: 2, borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" align="center">{dayName}</Typography>
                </Box>
              ))}
            </Box>

            {/* 時段行 */}
            {timeSlots.map((timeSlot) => (
              <Box key={timeSlot.time_slot} sx={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
                {/* 時段標籤 */}
                <Box sx={{ p: 1, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2">{timeSlot.display_time}</Typography>
                </Box>

                {/* 每天的時段 */}
                {dayNames.slice(1).map((_, dayIndex) => {
                  const dayOfWeek = dayIndex + 1;
                  const schedule = getScheduleAtTime(dayOfWeek, timeSlot.time_slot);
                  const droppableId = `${dayOfWeek}-${timeSlot.time_slot}`;

                  return (
                    <Box
                      key={droppableId}
                      id={droppableId}
                      sx={{
                        p: 1,
                        borderRight: 1,
                        borderColor: 'divider',
                        minHeight: 60,
                        bgcolor: 'background.paper'
                      }}
                    >
                      {schedule ? (
                        <DraggableScheduleCard
                          schedule={schedule}
                          onEdit={handleEditSchedule}
                          onDelete={handleDeleteSchedule}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 60,
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.50'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            拖曳至此
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>
      </DndContext>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isNewSchedule ? '新增排課' : '編輯排課'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>星期</InputLabel>
                <Select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as number })}
                  label="星期"
                >
                  {dayNames.slice(1).map((dayName, index) => (
                    <MenuItem key={index + 1} value={index + 1}>{dayName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>時段</InputLabel>
                <Select
                  value={formData.time_slot}
                  onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                  label="時段"
                >
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot.time_slot} value={slot.time_slot}>
                      {slot.display_time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="時長 (分鐘)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                inputProps={{ min: 30, max: 480, step: 30 }}
              />
              <FormControl fullWidth>
                <InputLabel>課程類型</InputLabel>
                <Select
                  value={formData.lesson_type}
                  onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value as 'physical' | 'online' })}
                  label="課程類型"
                >
                  <MenuItem value="physical">實體課</MenuItem>
                  <MenuItem value="online">線上課</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>授課老師</InputLabel>
              <Select
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                label="授課老師"
              >
                <MenuItem value="">未指派</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="科目"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="教室"
              value={formData.classroom}
              onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
              disabled={formData.lesson_type === 'online'}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="備註"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveSchedule} variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShortTermScheduleEditor; 