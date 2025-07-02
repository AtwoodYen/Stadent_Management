import React, { useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  IconButton,
  Typography,
  Autocomplete
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

interface DraggableSpecialtiesProps {
  specialties: string[];
  availableOptions: string[];
  onChange: (newSpecialties: string[]) => void;
  maxCount?: number;
  label?: string;
  placeholder?: string;
}

const DraggableSpecialties: React.FC<DraggableSpecialtiesProps> = ({
  specialties,
  availableOptions,
  onChange,
  maxCount = 10,
  label = "專長",
  placeholder = "輸入新專長..."
}) => {
  const [newSpecialty, setNewSpecialty] = React.useState('');
  const autocompleteRef = useRef<any>(null);
  const [key, setKey] = React.useState(0); // 強制重新渲染的 key

  // 處理拖曳結束
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(specialties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  // 新增專長
  const handleAddSpecialty = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !specialties.includes(trimmedValue) && specialties.length < maxCount) {
      onChange([...specialties, trimmedValue]);
      setNewSpecialty(''); // 清空輸入框
    }
  };

  // 刪除專長
  const handleRemoveSpecialty = (index: number) => {
    const newSpecialties = specialties.filter((_, i) => i !== index);
    onChange(newSpecialties);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        {label} ({specialties.length}/{maxCount})
      </Typography>
      
      {/* 新增專長的輸入框 */}
      <Autocomplete
        key={key}
        ref={autocompleteRef}
        freeSolo
        options={availableOptions.filter(option => !specialties.includes(option))}
        value={null}
        inputValue={newSpecialty}
        onInputChange={(_, newValue) => setNewSpecialty(newValue || '')}
        onChange={(_, value) => {
          if (typeof value === 'string' && value.trim()) {
            const trimmedValue = value.trim();
            if (trimmedValue && !specialties.includes(trimmedValue) && specialties.length < maxCount) {
              onChange([...specialties, trimmedValue]);
              setNewSpecialty(''); // 立即清空輸入框
              setKey(prev => prev + 1); // 強制重新渲染
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={placeholder}
            disabled={specialties.length >= maxCount}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSpecialty.trim()) {
                e.preventDefault();
                const trimmedValue = newSpecialty.trim();
                if (trimmedValue && !specialties.includes(trimmedValue) && specialties.length < maxCount) {
                  onChange([...specialties, trimmedValue]);
                  setNewSpecialty(''); // 清空輸入框
                  setKey(prev => prev + 1); // 強制重新渲染
                }
              }
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => handleAddSpecialty(newSpecialty.trim())}
                  disabled={!newSpecialty.trim() || specialties.length >= maxCount}
                >
                  <AddIcon />
                </IconButton>
              ),
            }}
          />
        )}
        sx={{ mb: 2 }}
      />

      {/* 可拖曳的專長列表 */}
      {specialties.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="specialties">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minHeight: 60,
                  padding: 1,
                  border: '2px dashed',
                  borderColor: snapshot.isDraggingOver ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {specialties.map((specialty, index) => (
                  <Draggable key={specialty} draggableId={specialty} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          p: 1,
                          backgroundColor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                          boxShadow: snapshot.isDragging ? 2 : 0,
                          transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* 拖曳把手 */}
                        <Box
                          {...provided.dragHandleProps}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'grab',
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          <DragIcon fontSize="small" />
                        </Box>

                        {/* 專長標籤 */}
                        <Chip
                          label={specialty}
                          variant="outlined"
                          size="small"
                          sx={{ flex: 1, maxWidth: 'fit-content' }}
                        />

                        {/* 順序號碼 */}
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
                          #{index + 1}
                        </Typography>

                        {/* 刪除按鈕 */}
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSpecialty(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* 提示文字 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 拖曳 <DragIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> 圖示可調整順序，專長將按順序顯示在師資卡片上
      </Typography>
    </Box>
  );
};

export default DraggableSpecialties; 