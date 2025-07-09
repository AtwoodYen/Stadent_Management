-- 診斷課程資料表狀態
-- 檢查可能的問題

PRINT N'=== 課程資料表診斷報告 ===';

-- 1. 檢查資料表是否存在
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND type in (N'U'))
BEGIN
    PRINT N'✓ courses 資料表存在';
END
ELSE
BEGIN
    PRINT N'✗ courses 資料表不存在！';
    RETURN;
END

-- 2. 檢查資料表結構
PRINT N'';
PRINT N'--- 資料表欄位結構 ---';
SELECT 
    COLUMN_NAME as [欄位名稱],
    DATA_TYPE as [資料類型],
    IS_NULLABLE as [可為空],
    COLUMN_DEFAULT as [預設值],
    CHARACTER_MAXIMUM_LENGTH as [最大長度]
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses'
ORDER BY ORDINAL_POSITION;

-- 3. 檢查資料量
PRINT N'';
PRINT N'--- 資料統計 ---';
SELECT 
    COUNT(*) as [總課程數],
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as [啟用課程數],
    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as [停用課程數]
FROM courses;

-- 4. 檢查索引
PRINT N'';
PRINT N'--- 索引資訊 ---';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    STRING_AGG(c.name, ', ') as [欄位名稱]
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('courses')
GROUP BY i.name, i.type_desc;

-- 5. 檢查約束
PRINT N'';
PRINT N'--- 約束資訊 ---';
SELECT 
    CONSTRAINT_NAME as [約束名稱],
    CONSTRAINT_TYPE as [約束類型]
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'courses';

-- 6. 檢查是否有 sort_order 欄位
PRINT N'';
PRINT N'--- sort_order 欄位檢查 ---';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order')
BEGIN
    PRINT N'✓ sort_order 欄位已存在';
    
    -- 檢查欄位詳細資訊
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';
    
    -- 檢查資料
    SELECT 
        COUNT(*) as [總數],
        COUNT(sort_order) as [有排序值],
        COUNT(*) - COUNT(sort_order) as [無排序值],
        MIN(sort_order) as [最小排序值],
        MAX(sort_order) as [最大排序值]
    FROM courses;
END
ELSE
BEGIN
    PRINT N'✗ sort_order 欄位不存在';
END

PRINT N'';
PRINT N'=== 診斷完成 ==='; 