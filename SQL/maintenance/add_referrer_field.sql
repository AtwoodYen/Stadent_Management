-- =====================================================
-- 新增學生介紹人欄位 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為 students 表新增 referrer 欄位，用於記錄學生介紹人
-- =====================================================

-- 檢查欄位是否已存在
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    -- 新增 referrer 欄位
    ALTER TABLE students 
    ADD referrer NVARCHAR(100) NULL;
    
    PRINT '✓ 已新增 referrer 欄位';
    
    -- 為新欄位建立索引
    CREATE INDEX IX_students_referrer ON students(referrer);
    PRINT '✓ 已建立 referrer 索引';
    
    -- 顯示更新結果
    SELECT 
        'students' as table_name,
        COUNT(*) as total_students,
        COUNT(referrer) as students_with_referrer,
        COUNT(*) - COUNT(referrer) as students_without_referrer
    FROM students 
    WHERE is_active = 1;
    
END
ELSE
BEGIN
    PRINT '⚠ referrer 欄位已存在';
END

-- 檢查索引是否存在
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_referrer' AND object_id = OBJECT_ID('students'))
BEGIN
    PRINT '✓ IX_students_referrer 索引已存在';
END
ELSE
BEGIN
    PRINT '⚠ IX_students_referrer 索引不存在，正在建立...';
    CREATE INDEX IX_students_referrer ON students(referrer);
    PRINT '✓ 已建立 referrer 索引';
END

-- 顯示完整的欄位結構
PRINT '=== 學生資料表結構 ===';
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型態',
    CHARACTER_MAXIMUM_LENGTH AS '最大長度',
    IS_NULLABLE AS '允許空值',
    COLUMN_DEFAULT AS '預設值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- 顯示索引資訊
PRINT '=== 索引資訊 ===';
SELECT 
    i.name AS '索引名稱',
    c.name AS '欄位名稱',
    i.type_desc AS '索引類型'
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('students')
ORDER BY i.name, ic.key_ordinal;

PRINT '=== 介紹人欄位新增完成 ===';
PRINT '1. 已新增 referrer 欄位 (允許 NULL 值)';
PRINT '2. 已建立索引以提升查詢效能';
PRINT '3. 欄位長度設定為 NVARCHAR(100)';
PRINT '4. 可以開始在前端使用此欄位'; 