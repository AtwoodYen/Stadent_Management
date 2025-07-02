# 程度顏色系統指南

## 概述
本系統為學生程度等級提供統一的顏色區分，從淺到深的底色來區分不同等級，提升視覺識別效果。

## 顏色系統

### 新程度等級（五個等級）
| 等級 | 背景色 | 文字色 | 邊框色 | 說明 |
|------|--------|--------|--------|------|
| 新手 | #e8f5e8 | #2e7d32 | #4caf50 | 最淺綠色，代表初學者 |
| 入門 | #e3f2fd | #1565c0 | #2196f3 | 淺藍色，代表基礎程度 |
| 進階 | #fff3e0 | #ef6c00 | #ff9800 | 淺橙色，代表中等程度 |
| 高階 | #fce4ec | #c2185b | #e91e63 | 淺粉色，代表高級程度 |
| 精英 | #f3e5f5 | #7b1fa2 | #9c27b0 | 淺紫色，代表最高程度 |

### 舊程度等級（向後相容）
| 等級 | 對應新等級 | 背景色 | 文字色 | 邊框色 |
|------|------------|--------|--------|--------|
| 初級 | 新手 | #e8f5e8 | #2e7d32 | #4caf50 |
| 中級 | 入門 | #e3f2fd | #1565c0 | #2196f3 |
| 高級 | 高階 | #fce4ec | #c2185b | #e91e63 |

## 實現方式

### 1. JavaScript 工具函數
- **檔案**：`client/src/utils/levelColors.ts`
- **功能**：提供統一的顏色配置和工具函數

```typescript
import { getLevelColors } from '../utils/levelColors';

// 獲取程度顏色配置
const colors = getLevelColors('新手');
// 返回：{ backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#4caf50' }
```

### 2. CSS 樣式類別
- **檔案**：`client/src/styles/level-colors.css`
- **功能**：提供預定義的CSS類別

```css
.level-新手 {
  background-color: #e8f5e8 !important;
  color: #2e7d32 !important;
  border: 1px solid #4caf50 !important;
}
```

### 3. 使用方式

#### Material-UI Chip 組件
```tsx
<Chip
  label={student.level_type}
  sx={{
    backgroundColor: getLevelColors(student.level_type).backgroundColor,
    color: getLevelColors(student.level_type).color,
    border: '1px solid',
    borderColor: getLevelColors(student.level_type).borderColor
  }}
  size="small"
/>
```

#### HTML 元素
```tsx
<span className={`badge badge-level level-${student.level_type || '未設定'}`}>
  {student.level_type || '未設定'}
</span>
```

## 應用位置

### 已更新的組件
1. **學生詳情視窗** (`StudentDetailView.tsx`)
   - 程度顯示使用 Material-UI Chip 組件

2. **學生管理頁面** (`StudentsPage.tsx`)
   - 學生列表中的程度標籤使用 CSS 類別

3. **課程管理頁面** (`CoursesPage.tsx`)
   - 課程難度顯示使用 Material-UI Chip 組件

4. **教師課程管理頁面** (`TeacherCoursesManagementPage.tsx`)
   - 教學水準顯示使用 Material-UI Chip 組件

5. **教師課程組件** (`TeacherCourses.tsx`)
   - 教學水準顯示使用 Material-UI Chip 組件

## 設計原則

### 1. 漸進式顏色
- 從淺到深的顏色變化
- 新手（最淺）→ 精英（最深）
- 符合程度提升的視覺直覺

### 2. 一致性
- 所有程度顯示位置使用相同顏色
- 統一的視覺語言
- 便於用戶識別和記憶

### 3. 可訪問性
- 足夠的顏色對比度
- 支援色盲用戶的識別
- 響應式設計支援

### 4. 向後相容
- 支援舊程度等級的顯示
- 平滑的升級體驗
- 不影響現有功能

## 維護指南

### 新增程度等級
1. 在 `levelColors.ts` 中新增顏色配置
2. 在 `level-colors.css` 中新增CSS類別
3. 更新相關組件的顯示邏輯

### 修改顏色
1. 更新 `levelColors.ts` 中的顏色值
2. 同步更新 `level-colors.css` 中的CSS類別
3. 測試所有顯示位置的一致性

### 測試檢查清單
- [ ] 學生詳情視窗中的程度顯示
- [ ] 學生列表中的程度標籤
- [ ] 課程管理中的難度顯示
- [ ] 教師課程中的教學水準顯示
- [ ] 響應式設計在不同螢幕尺寸下的表現
- [ ] 顏色對比度符合可訪問性標準 