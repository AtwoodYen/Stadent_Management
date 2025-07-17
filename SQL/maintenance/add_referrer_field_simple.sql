-- =====================================================
-- 新增學生介紹人欄位 - 簡化版 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為 students 表新增 referrer 欄位，用於記錄學生介紹人
-- =====================================================

PRINT '=== 開始新增介紹人欄位 ===';

-- 步驟1: 新增 referrer 欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    ALTER TABLE students ADD referrer NVARCHAR(50) NULL;
    PRINT '✓ 已新增 referrer 欄位';
END
ELSE
BEGIN
    PRINT '⚠ referrer 欄位已存在';
END

-- 步驟2: 建立索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_referrer' AND object_id = OBJECT_ID('students'))
BEGIN
    CREATE INDEX IX_students_referrer ON students(referrer);
    PRINT '✓ 已建立 referrer 索引';
END
ELSE
BEGIN
    PRINT '⚠ IX_students_referrer 索引已存在';
END

-- 步驟3: 驗證欄位是否成功新增
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    PRINT '✓ 驗證成功：referrer 欄位已存在於 students 表中';
    
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
    PRINT '❌ 錯誤：referrer 欄位新增失敗';
END

PRINT '=== 介紹人欄位新增完成 ==='; 