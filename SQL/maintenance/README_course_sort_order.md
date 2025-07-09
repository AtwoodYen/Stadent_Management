# 課程排序欄位新增說明

## 概述
為課程管理系統新增自定義排序功能，讓使用者可以拖拽調整課程的顯示順序。

## 執行步驟

### 1. 執行 SQL 腳本
在 SQL Server Management Studio 或任何 SQL 客戶端中執行：
```sql
-- 執行課程排序欄位新增腳本
-- 檔案位置：SQL/maintenance/add_course_sort_order.sql
```

### 2. 腳本功能說明
- 新增 `sort_order` 欄位到 `courses` 資料表
- 建立索引以提升排序效能
- 設定初始排序值（按照現有的 id 順序）
- 更新課程查詢視圖
- 驗證新增結果

### 3. 後端 API 更新
已新增以下 API 端點：
- `PUT /api/courses/reorder` - 更新課程排序順序
- 修改 `GET /api/courses` - 按照 sort_order 排序
- 修改 `POST /api/courses` - 新課程自動設定 sort_order

### 4. 前端功能
- 課程列表支援拖拽排序
- 排序結果自動保存到資料庫
- 重新載入頁面時保持自定義排序

## 資料庫結構變更

### 新增欄位
```sql
ALTER TABLE courses ADD sort_order INT NOT NULL DEFAULT 0;
```

### 索引
```sql
CREATE NONCLUSTERED INDEX IX_courses_sort_order ON courses (sort_order);
```

### 排序邏輯
```sql
ORDER BY 
    CASE 
        WHEN sort_order IS NOT NULL THEN 0 
        ELSE 1 
    END,
    sort_order,
    category, 
    level, 
    name
```

## 注意事項
1. 執行腳本前請先備份資料庫
2. 腳本會自動處理現有資料的排序值設定
3. 新課程會自動獲得最大的 sort_order + 1 值
4. 排序功能與現有的欄位排序功能並存

## 測試
執行腳本後，可以透過以下查詢驗證：
```sql
-- 檢查欄位是否新增成功
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';

-- 查看課程排序順序
SELECT id, name, category, sort_order 
FROM courses 
ORDER BY sort_order, id;
``` 