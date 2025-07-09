-- 為課程資料表新增自定義排序欄位
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：新增 sort_order 欄位來保存課程的自定義排序順序

-- 1. 檢查欄位是否已存在
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order')
BEGIN
    -- 新增 sort_order 欄位
    ALTER TABLE [dbo].[courses] ADD [sort_order] INT NULL;
    
    -- 建立索引以提升排序效能
    CREATE NONCLUSTERED INDEX [IX_courses_sort_order] ON [dbo].[courses] ([sort_order]);
    
    PRINT N'已新增 sort_order 欄位到 courses 資料表';
END
ELSE
BEGIN
    PRINT N'sort_order 欄位已存在於 courses 資料表';
END

-- 2. 設定初始排序值（按照現有的 id 順序）
UPDATE [dbo].[courses] 
SET [sort_order] = [id]
WHERE [sort_order] IS NULL;

PRINT N'已設定初始排序值';

-- 3. 將 sort_order 設為 NOT NULL（在設定初始值後）
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[courses] ALTER COLUMN [sort_order] INT NOT NULL;
    PRINT N'已將 sort_order 欄位設為 NOT NULL';
END

-- 4. 新增預設值約束
IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_courses_sort_order')
BEGIN
    ALTER TABLE [dbo].[courses] ADD CONSTRAINT [DF_courses_sort_order] DEFAULT (0) FOR [sort_order];
    PRINT N'已新增 sort_order 預設值約束';
END

-- 5. 更新課程查詢視圖以包含排序欄位
CREATE OR ALTER VIEW [dbo].[view_courses_summary] AS
SELECT 
    c.[id],
    c.[name] as [課程名稱],
    c.[category] as [課程分類],
    c.[level] as [難度等級],
    c.[duration_minutes] as [時長分鐘],
    c.[price] as [課程價格],
    c.[description] as [課程描述],
    c.[prerequisites] as [先修課程],
    c.[sort_order] as [排序順序],
    CASE c.[is_active] 
        WHEN 1 THEN N'啟用' 
        ELSE N'停用' 
    END as [狀態],
    c.[created_at] as [建立時間],
    c.[updated_at] as [更新時間]
FROM [dbo].[courses] c
WHERE c.[is_active] = 1;

PRINT N'已更新課程查詢視圖';

-- 6. 驗證結果
PRINT N'=== 驗證結果 ===';
PRINT N'--- 檢查欄位是否新增成功 ---';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';

PRINT N'--- 查看課程排序順序 ---';
SELECT TOP 10 
    [id],
    [name] as [課程名稱],
    [category] as [課程分類],
    [sort_order] as [排序順序]
FROM [dbo].[courses] 
ORDER BY [sort_order], [id];

PRINT N'=== 課程排序欄位新增完成 ==='; 