-- =====================================================
-- 新增學生介紹人欄位 - 安全版 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為 students 表新增 referrer 欄位，用於記錄學生介紹人
-- =====================================================

PRINT '=== 開始新增介紹人欄位 ===';

-- 步驟1: 檢查欄位是否已存在
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    PRINT '⚠ referrer 欄位已存在，跳過新增步驟';
END
ELSE
BEGIN
    PRINT '正在新增 referrer 欄位...';
    
    -- 新增 referrer 欄位
    ALTER TABLE students ADD referrer NVARCHAR(100) NULL;
    
    PRINT '✓ 已新增 referrer 欄位';
END

GO

-- 步驟2: 檢查索引是否已存在
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_referrer' AND object_id = OBJECT_ID('students'))
BEGIN
    PRINT '⚠ IX_students_referrer 索引已存在';
END
ELSE
BEGIN
    PRINT '正在建立 referrer 索引...';
    
    -- 建立索引
    CREATE INDEX IX_students_referrer ON students(referrer);
    
    PRINT '✓ 已建立 referrer 索引';
END

GO

-- 步驟3: 驗證結果
PRINT '=== 驗證結果 ===';

-- 檢查欄位是否存在
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    PRINT '✓ referrer 欄位存在';
    
    -- 顯示欄位資訊
    SELECT 
        COLUMN_NAME AS '欄位名稱',
        DATA_TYPE AS '資料型態',
        CHARACTER_MAXIMUM_LENGTH AS '最大長度',
        IS_NULLABLE AS '允許空值'
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'referrer';
END
ELSE
BEGIN
    PRINT '❌ referrer 欄位不存在';
END

-- 檢查索引是否存在
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_referrer' AND object_id = OBJECT_ID('students'))
BEGIN
    PRINT '✓ IX_students_referrer 索引存在';
END
ELSE
BEGIN
    PRINT '❌ IX_students_referrer 索引不存在';
END

PRINT '=== 介紹人欄位新增完成 ==='; 