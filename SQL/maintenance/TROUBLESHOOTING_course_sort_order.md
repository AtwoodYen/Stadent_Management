# 課程排序欄位新增故障排除指南

## 常見問題及解決方案

### 1. **錯誤：courses 資料表不存在**
**症狀**：執行腳本時出現「courses 資料表不存在」錯誤

**解決方案**：
```sql
-- 檢查資料表是否存在
SELECT * FROM sys.objects WHERE name = 'courses' AND type = 'U';

-- 如果不存在，先執行建立資料表腳本
-- 檔案：SQL/tables/create_courses_table.sql
```

### 2. **錯誤：權限不足**
**症狀**：出現「權限被拒絕」或「需要 ALTER 權限」錯誤

**解決方案**：
```sql
-- 檢查當前使用者權限
SELECT 
    dp.name AS DatabaseRoleName,
    mp.name AS DatabaseUserName
FROM sys.database_role_members drm
JOIN sys.database_principals dp ON dp.principal_id = drm.role_principal_id
JOIN sys.database_principals mp ON mp.principal_id = drm.member_principal_id
WHERE mp.name = CURRENT_USER;

-- 需要以下權限之一：
-- - db_owner
-- - db_ddladmin
-- - ALTER TABLE 權限
```

### 3. **錯誤：欄位已存在**
**症狀**：出現「欄位 'sort_order' 已存在」錯誤

**解決方案**：
```sql
-- 檢查欄位是否已存在
SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('courses') AND name = 'sort_order';

-- 如果已存在，可以跳過新增步驟，直接設定值
UPDATE courses SET sort_order = id WHERE sort_order IS NULL;
```

### 4. **錯誤：資料表被鎖定**
**症狀**：出現「資料表被其他程序使用」錯誤

**解決方案**：
```sql
-- 檢查是否有其他連線在使用資料表
SELECT 
    request_session_id,
    resource_type,
    resource_description
FROM sys.dm_tran_locks
WHERE resource_database_id = DB_ID() 
AND resource_associated_entity_id = OBJECT_ID('courses');

-- 等待其他程序完成或重新啟動應用程式
```

### 5. **錯誤：索引建立失敗**
**症狀**：出現「索引名稱重複」或「磁碟空間不足」錯誤

**解決方案**：
```sql
-- 檢查索引是否已存在
SELECT * FROM sys.indexes WHERE name = 'IX_courses_sort_order';

-- 如果已存在，刪除後重建
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_courses_sort_order')
    DROP INDEX IX_courses_sort_order ON courses;

-- 重新建立索引
CREATE NONCLUSTERED INDEX IX_courses_sort_order ON courses (sort_order);
```

### 6. **錯誤：視圖更新失敗**
**症狀**：出現「視圖不存在」或「權限不足」錯誤

**解決方案**：
```sql
-- 檢查視圖是否存在
SELECT * FROM sys.views WHERE name = 'view_courses_summary';

-- 如果不存在，可以跳過視圖更新步驟
-- 視圖不是必需的，不影響排序功能
```

## 執行順序建議

### 步驟 1：診斷問題
```sql
-- 執行診斷腳本
-- 檔案：SQL/maintenance/diagnose_course_table.sql
```

### 步驟 2：執行簡單版本
```sql
-- 如果診斷正常，執行簡單版本
-- 檔案：SQL/maintenance/add_course_sort_order_simple.sql
```

### 步驟 3：執行完整版本
```sql
-- 如果簡單版本成功，執行完整版本
-- 檔案：SQL/maintenance/add_course_sort_order_safe.sql
```

## 手動執行步驟

如果自動腳本失敗，可以手動執行以下步驟：

### 步驟 1：新增欄位
```sql
ALTER TABLE courses ADD sort_order INT NULL;
```

### 步驟 2：設定初始值
```sql
UPDATE courses SET sort_order = id WHERE sort_order IS NULL;
```

### 步驟 3：設為 NOT NULL（可選）
```sql
ALTER TABLE courses ALTER COLUMN sort_order INT NOT NULL;
```

### 步驟 4：建立索引（可選）
```sql
CREATE NONCLUSTERED INDEX IX_courses_sort_order ON courses (sort_order);
```

### 步驟 5：新增預設值（可選）
```sql
ALTER TABLE courses ADD CONSTRAINT DF_courses_sort_order DEFAULT (0) FOR sort_order;
```

## 驗證成功

執行完成後，使用以下查詢驗證：

```sql
-- 檢查欄位是否存在
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';

-- 檢查資料
SELECT TOP 10 id, name, sort_order 
FROM courses 
ORDER BY sort_order;
```

## 聯絡支援

如果以上步驟都無法解決問題，請提供：
1. 錯誤訊息的完整內容
2. 診斷腳本的執行結果
3. 資料庫版本資訊
4. 當前使用者權限資訊 