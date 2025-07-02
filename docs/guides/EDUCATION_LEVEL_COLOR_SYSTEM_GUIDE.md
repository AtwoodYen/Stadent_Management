# 學制顏色系統指南

## 概述

學制顏色系統使用同一色系（藍色系）但不同深淺來區分不同的教育階段，提供視覺一致性和層次感。

## 顏色配置

### 國小
- **背景色**: `#e3f2fd` (最淺的藍色)
- **文字色**: `#1565c0` (深藍色)
- **邊框色**: `#1565c0` (深藍色)
- **說明**: 代表最基礎的教育階段

### 國中
- **背景色**: `#bbdefb` (淺藍色)
- **文字色**: `#1976d2` (中深藍色)
- **邊框色**: `#1976d2` (中深藍色)
- **說明**: 代表中等教育階段

### 高中
- **背景色**: `#90caf9` (中藍色)
- **文字色**: `#0d47a1` (深藍色)
- **邊框色**: `#0d47a1` (深藍色)
- **說明**: 代表高級中等教育階段

### 大學
- **背景色**: `#64b5f6` (較深藍色)
- **文字色**: `#0d47a1` (深藍色)
- **邊框色**: `#0d47a1` (深藍色)
- **說明**: 代表高等教育階段

### 在職
- **背景色**: `#42a5f5` (最深的藍色)
- **文字色**: `#ffffff` (白色)
- **邊框色**: `#1976d2` (藍色)
- **說明**: 代表在職進修

## 技術實現

### 工具函數
- **檔案**: `client/src/utils/educationLevelColors.ts`
- **函數**: `getEducationLevelColors(educationLevel: string)`
- **回傳**: `EducationLevelColors` 介面物件

### CSS 樣式
- **檔案**: `client/src/styles/education-level-colors.css`
- **類別**: `.badge-education-level.education-level-{學制}`
- **特性**: 響應式設計，支援 hover 效果

### 使用方式

```typescript
import { getEducationLevelColors } from '../utils/educationLevelColors';

// 在組件中使用
const colors = getEducationLevelColors('國小');

// 應用樣式
<span 
  className={`badge badge-education-level education-level-${educationLevel}`}
  style={{
    backgroundColor: colors.backgroundColor,
    color: colors.color,
    border: '1px solid',
    borderColor: colors.borderColor
  }}
>
  {educationLevel}
</span>
```

## 應用範圍

### 學校管理頁面
- 學校列表中的學制欄位
- 學校詳情視窗中的學制顯示
- 篩選選項中的學制選擇

### 視覺效果
- **一致性**: 所有學制使用同一藍色系
- **層次感**: 從淺到深的漸進式設計
- **可讀性**: 確保文字與背景的對比度
- **互動性**: 支援 hover 效果

## 維護指南

### 新增學制
1. 在 `educationLevelColors.ts` 中添加新的 case
2. 在 `education-level-colors.css` 中添加對應的 CSS 類別
3. 更新此說明文件

### 修改顏色
1. 修改 `educationLevelColors.ts` 中的顏色值
2. 同步更新 CSS 檔案中的顏色
3. 測試不同背景下的可讀性

### 測試檢查
- [ ] 所有學制顏色正確顯示
- [ ] 文字可讀性良好
- [ ] Hover 效果正常
- [ ] 在不同主題下的一致性
- [ ] 無障礙設計符合標準

## 設計原則

1. **一致性**: 使用統一的藍色系
2. **層次性**: 從淺到深的漸進設計
3. **可讀性**: 確保足夠的對比度
4. **可維護性**: 模組化的設計結構
5. **擴展性**: 易於添加新的學制類型 