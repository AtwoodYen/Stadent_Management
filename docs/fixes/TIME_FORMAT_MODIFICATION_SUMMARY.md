# 時間格式修改總結 - 移除秒數支援

## 修改目標
將 SQL Server 的 `TIME` 欄位改為 `VARCHAR(5)` 以支援 `HH:mm` 格式，不需要秒數，並同步修改前後端程式碼。

## 問題背景
- **原始問題**：SQL Server 的 `TIME` 型別需要完整的時間格式（包含秒數），但前端傳送 `HH:mm` 格式導致驗證失敗
- **錯誤訊息**：`Validation failed for parameter 'start_time'. Invalid time.`
- **根本原因**：資料庫欄位型別與前端傳送格式不匹配

## 修改內容

### 1. 資料庫結構修改

#### 創建的 SQL 腳本
- **檔案位置**：`SQL/maintenance/modify_time_columns_simple.sql`（簡化版本）
- **主要功能**：
  - 備份現有資料
  - 刪除相關約束和索引
  - 將 `TIME` 欄位改為 `VARCHAR(5)`
  - 使用 `CONVERT` 函數轉換現有資料為 `HH:mm` 格式
  - 重新建立約束條件和索引

#### 檢查腳本
- **檔案位置**：`SQL/maintenance/check_current_table_structure.sql`
- **主要功能**：檢查當前表的欄位型別、約束條件和資料範例

#### 修改的資料表
- **資料表名稱**：`student_schedules`
- **修改欄位**：
  - `start_time`: `TIME` → `VARCHAR(5)`
  - `end_time`: `TIME` → `VARCHAR(5)`

#### 新增的約束條件
```sql
-- 時間格式檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_start_time_format 
CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');

ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_end_time_format 
CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');

-- 時間範圍檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_time_range 
CHECK (
    end_time IS NULL OR 
    (
        CAST(SUBSTRING(start_time, 1, CHARINDEX(':', start_time) - 1) AS INT) * 60 + 
        CAST(SUBSTRING(start_time, CHARINDEX(':', start_time) + 1, 2) AS INT) <
        CAST(SUBSTRING(end_time, 1, CHARINDEX(':', end_time) - 1) AS INT) * 60 + 
        CAST(SUBSTRING(end_time, CHARINDEX(':', end_time) + 1, 2) AS INT)
    )
);
```

### 2. 後端程式碼修改

#### 修改的檔案
- **檔案位置**：`server.js`
- **修改的 API 端點**：
  - `POST /api/schedules` (新增課表)
  - `PUT /api/schedules/:id` (更新課表)

#### 主要修改內容
```javascript
// 修改前
.input('start_time', sql.Time, formattedStartTime)
.input('end_time', sql.Time, formattedEndTime)

// 修改後
.input('start_time', sql.VarChar, start_time)
.input('end_time', sql.VarChar, end_time || null)
```

#### 移除的程式碼
- 移除了時間格式轉換函數 `formatTimeForSQL`
- 移除了將 `HH:mm` 轉換為 `HH:mm:ss` 的邏輯
- 移除了相關的調試日誌

### 3. 前端程式碼修改

#### 修改的檔案
- **檔案位置**：`client/src/pages/SchedulePage.tsx`

#### 主要修改內容
```typescript
// 修改前
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

// 修改後
const extractTime = (timeStr: string): string => {
  if (!timeStr) return '09:00';
  try {
    // 如果已經是 HH:mm 格式，直接返回
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }
    // 如果是 ISO 格式，轉換為 HH:mm
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1];
      if (timePart) {
        return timePart.slice(0, 5); // 取 HH:mm 部分
      }
    }
    return '09:00';
  } catch {
    return '09:00';
  }
};
```

## 執行步驟

### 1. 執行資料庫修改
```bash
# 在 SQL Server Management Studio 中執行
SQL/maintenance/modify_time_columns_no_seconds.sql
```

### 2. 重啟後端服務
```bash
# 停止現有服務
# 重新啟動 Node.js 服務
node server.js
```

### 3. 測試功能
- 在課表管理的週視圖中嘗試為學生排定課程
- 確認時間格式為 `HH:mm`（如 `16:00`）
- 驗證新增課程功能正常運作

## 預期效果

### 修改前
- 前端傳送：`16:00`
- 後端處理：轉換為 `16:00:00`
- 資料庫儲存：`TIME` 型別
- 結果：驗證失敗

### 修改後
- 前端傳送：`16:00`
- 後端處理：直接使用 `16:00`
- 資料庫儲存：`VARCHAR(5)` 型別
- 結果：成功新增課程

## 注意事項

1. **資料備份**：SQL 腳本會自動備份現有資料到臨時表
2. **向下相容**：前端程式碼支援兩種格式（ISO 和 HH:mm）
3. **約束檢查**：新增了時間格式和範圍的約束條件
4. **索引重建**：所有相關索引都會重新建立

## 驗證清單

- [ ] 執行 SQL 腳本成功
- [ ] 後端服務正常啟動
- [ ] 前端能正常載入課表資料
- [ ] 新增課程功能正常運作
- [ ] 時間格式顯示正確（HH:mm）
- [ ] 沒有 500 錯誤或驗證失敗

## 相關檔案

- `SQL/maintenance/modify_time_columns_no_seconds.sql` - 資料庫修改腳本
- `server.js` - 後端 API 修改
- `client/src/pages/SchedulePage.tsx` - 前端時間處理邏輯
- `docs/fixes/TIME_FORMAT_MODIFICATION_SUMMARY.md` - 本總結文件 