-- =====================================================
-- 檢查介紹人欄位狀態 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 檢查 students 表中 referrer 欄位的狀態
-- =====================================================

PRINT '=== 檢查介紹人欄位狀態 ===';

-- 檢查欄位是否存在
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'referrer')
BEGIN
    PRINT '✓ referrer 欄位存在';
    
    -- 顯示欄位詳細資訊
    SELECT 
        COLUMN_NAME AS '欄位名稱',
        DATA_TYPE AS '資料型態',
        CHARACTER_MAXIMUM_LENGTH AS '最大長度',
        IS_NULLABLE AS '允許空值',
        COLUMN_DEFAULT AS '預設值'
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'referrer';
    
    -- 檢查索引是否存在
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_referrer' AND object_id = OBJECT_ID('students'))
    BEGIN
        PRINT '✓ IX_students_referrer 索引存在';
    END
    ELSE
    BEGIN
        PRINT '⚠ IX_students_referrer 索引不存在';
    END
    
    -- 顯示資料統計
    SELECT 
        COUNT(*) as total_students,
        COUNT(referrer) as students_with_referrer,
        COUNT(*) - COUNT(referrer) as students_without_referrer
    FROM students 
    WHERE is_active = 1;
    
END
ELSE
BEGIN
    PRINT '❌ referrer 欄位不存在';
    PRINT '請先執行 add_referrer_field_simple.sql 腳本來新增欄位';
END

PRINT '=== 檢查完成 ==='; 