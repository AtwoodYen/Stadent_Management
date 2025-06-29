# 課表管理週視圖修復總結

## 問題描述
課表管理中選擇「週」視圖後，沒有顯示出本週有排課的學生。

## 問題分析

### 1. 資料模型不匹配
- **後端資料結構**：`student_schedules` 表儲存的是週期性課表（每週固定時間的課程安排）
- **前端期待格式**：具體日期的課程資料
- **API 端點**：`/api/schedules` 回傳週期性資料，而非具體日期課程

### 2. 時間格式問題
- **API 回傳格式**：ISO 8601 時間戳 `"1970-01-01T15:15:00.000Z"`
- **前端期待格式**：簡單時間格式 `"15:15"`
- **時區問題**：使用 `new Date()` 會造成時區轉換錯誤

### 3. 伺服器端口配置
- **伺服器實際端口**：3000
- **前端代理配置**：正確設定為轉發到 3000 端口

## 修復方案

### 1. 資料轉換邏輯重構
```typescript
// 將週期性課表轉換為具體日期的課程
const formattedLessons: Lesson[] = [];

// 為接下來的4週生成具體課程
for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
  const weekStart = addWeeks(startDate, weekOffset);
  
  schedulesData.forEach((schedule: any) => {
    const dayMap = {
      '星期日': 0, '星期一': 1, '星期二': 2, '星期三': 3,
      '星期四': 4, '星期五': 5, '星期六': 6
    };
    
    const dayOfWeek = dayMap[schedule.day_of_week];
    if (dayOfWeek !== undefined) {
      const lessonDate = addDays(weekStart, dayOfWeek);
      // ... 創建具體日期的課程
    }
  });
}
```

### 2. 時間格式處理修復
```typescript
// 直接從 ISO 字符串提取時間部分，避免時區轉換
const extractTime = (timeStr: string): string => {
  if (!timeStr) return '09:00';
  try {
    // 格式: "1970-01-01T15:15:00.000Z" -> "15:15"
    const timePart = timeStr.split('T')[1];
    if (timePart) {
      return timePart.slice(0, 5); // 取 HH:mm 部分
    }
    return '09:00';
  } catch {
    return '09:00';
  }
};
```

### 3. 時間匹配邏輯改善
```typescript
const getLessonsForTimeSlot = (date: Date, time: string) => {
  const filteredLessons = lessons.filter(l => {
    const isSameDate = isSameDay(l.date, date);
    const isSameTime = l.startTime === time || l.startTime === time + ':00';
    return isSameDate && isSameTime;
  });
  return filteredLessons;
};
```

### 4. 視覺化改善
- **週視圖**：添加每日課程數量顯示
- **課程卡片**：藍色背景，白色文字，圓角設計
- **載入狀態**：完整的載入和錯誤處理

## 修復結果

### ✅ 成功解決的問題
1. **週視圖正常顯示**：現在可以正確顯示本週排課的學生
2. **時間正確匹配**：15:15 的課程會正確顯示在對應時段
3. **資料轉換準確**：週期性課表正確轉換為具體日期課程
4. **視覺效果改善**：課程卡片清晰可見，包含學生姓名和課程主題

### 📊 資料示例
```
API 原始資料:
{
  "day_of_week": "星期三",
  "start_time": "1970-01-01T15:15:00.000Z",
  "subject": "高級程式設計",
  "student_name": "王小明"
}

轉換後前端資料:
{
  "date": "2025-01-01", // 具體日期
  "startTime": "15:15", // 正確時間
  "topic": "高級程式設計",
  "studentId": 1
}
```

## 技術細節

### 使用的庫和方法
- **date-fns**：日期操作和格式化
- **Material-UI**：載入狀態和錯誤處理
- **TypeScript**：類型安全和介面定義

### 調試功能
- 開發環境下的詳細日誌輸出
- 使用 `import.meta.env.DEV` 控制調試訊息
- 完整的資料轉換過程追蹤

## 後續建議

1. **考慮建立課程實例表**：為了更好地管理具體日期的課程，可以考慮在資料庫中建立 `lesson_instances` 表
2. **添加課程狀態管理**：支援課程的完成、取消、重新安排等狀態
3. **優化載入性能**：考慮分頁載入或虛擬滾動以處理大量課程資料

---

**修復完成時間**：2025年1月
**影響範圍**：課表管理頁面週視圖和日視圖
**測試狀態**：已驗證修復成功 