# 性別顏色系統指南

## 概述
本系統為學生性別提供統一的顏色區分，女生用淺紅底，男生用淺藍底，提升視覺識別效果。

## 顏色系統

### 性別顏色對應
| 性別 | 背景色 | 文字色 | 邊框色 | 說明 |
|------|--------|--------|--------|------|
| 女 | #fce4ec | #c2185b | #e91e63 | 淺紅色，代表女性 |
| 男 | #e3f2fd | #1565c0 | #2196f3 | 淺藍色，代表男性 |
| 未設定 | #f5f5f5 | #757575 | #bdbdbd | 預設灰色 |

## 實現方式

### 1. JavaScript 工具函數
- **檔案**：`client/src/utils/genderColors.ts`
- **功能**：提供統一的性別顏色配置和工具函數

```typescript
import { getGenderColors } from '../utils/genderColors';

// 獲取性別顏色配置
const colors = getGenderColors('女');
// 返回：{ backgroundColor: '#fce4ec', color: '#c2185b', borderColor: '#e91e63' }
```

### 2. CSS 樣式類別
- **檔案**：`client/src/styles/gender-colors.css`
- **功能**：提供預定義的CSS類別

```css
.gender-女 {
  background-color: #fce4ec !important;
  color: #c2185b !important;
  border: 1px solid #e91e63 !important;
}

.gender-男 {
  background-color: #e3f2fd !important;
  color: #1565c0 !important;
  border: 1px solid #2196f3 !important;
}
```

### 3. 使用方式

#### Material-UI Chip 組件
```tsx
<Chip
  label={student.gender}
  sx={{
    backgroundColor: getGenderColors(student.gender).backgroundColor,
    color: getGenderColors(student.gender).color,
    border: '1px solid',
    borderColor: getGenderColors(student.gender).borderColor
  }}
  size="small"
/>
```

#### HTML 元素
```tsx
<span className={`badge badge-gender gender-${student.gender || '未設定'}`}>
  {student.gender || '未設定'}
</span>
```

## 應用位置

### 已更新的組件
1. **學生詳情視窗** (`StudentDetailView.tsx`)
   - 性別顯示使用 Material-UI Chip 組件

2. **學生管理頁面** (`StudentsPage.tsx`)
   - 學生列表中的性別標籤使用 CSS 類別

## 設計原則

### 1. 性別對應
- 女性：淺紅色系，符合傳統性別色彩認知
- 男性：淺藍色系，符合傳統性別色彩認知
- 未設定：中性灰色，避免性別偏見

### 2. 一致性
- 所有性別顯示位置使用相同顏色
- 統一的視覺語言
- 便於用戶識別和記憶

### 3. 可訪問性
- 足夠的顏色對比度
- 支援色盲用戶的識別
- 響應式設計支援

### 4. 文化敏感性
- 使用傳統但不過時的性別色彩
- 避免刻板印象
- 保持專業性

## 維護指南

### 新增性別選項
1. 在 `genderColors.ts` 中新增顏色配置
2. 在 `gender-colors.css` 中新增CSS類別
3. 更新相關組件的顯示邏輯

### 修改顏色
1. 更新 `genderColors.ts` 中的顏色值
2. 同步更新 `gender-colors.css` 中的CSS類別
3. 測試所有顯示位置的一致性

### 測試檢查清單
- [ ] 學生詳情視窗中的性別顯示
- [ ] 學生列表中的性別標籤
- [ ] 響應式設計在不同螢幕尺寸下的表現
- [ ] 顏色對比度符合可訪問性標準
- [ ] 性別色彩的文化適當性

## 與程度顏色系統的整合

### 顏色區分
- **程度系統**：從淺到深的漸進式顏色（新手→精英）
- **性別系統**：對比式的性別色彩（女/男）

### 視覺層次
- 程度顏色：反映技能等級的進階關係
- 性別顏色：提供快速的身份識別

### 統一設計語言
- 相同的標籤樣式（圓角、邊框、懸停效果）
- 一致的顏色飽和度和明度
- 統一的響應式設計原則 