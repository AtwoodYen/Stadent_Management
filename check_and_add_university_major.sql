-- =====================================================
-- 檢查並新增學生大學和科系欄位
-- 創建日期: 2025-01-28
-- 說明: 檢查 students 表格結構並新增 university 和 major 欄位
-- =====================================================

PRINT '=== 檢查 students 表格結構 ===';

-- 顯示目前的欄位結構
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型態',
    CHARACTER_MAXIMUM_LENGTH AS '最大長度',
    IS_NULLABLE AS '允許空值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

PRINT '=== 檢查 university 欄位 ===';

-- 檢查 university 欄位是否存在
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'university')
BEGIN
    PRINT '✓ university 欄位已存在';
END
ELSE
BEGIN
    PRINT '❌ university 欄位不存在，正在新增...';
    ALTER TABLE students ADD university NVARCHAR(100) NULL;
    PRINT '✓ 已新增 university 欄位';
END

PRINT '=== 檢查 major 欄位 ===';

-- 檢查 major 欄位是否存在
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'major')
BEGIN
    PRINT '✓ major 欄位已存在';
END
ELSE
BEGIN
    PRINT '❌ major 欄位不存在，正在新增...';
    ALTER TABLE students ADD major NVARCHAR(100) NULL;
    PRINT '✓ 已新增 major 欄位';
END

PRINT '=== 建立索引 ===';

-- 建立 university 索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_university' AND object_id = OBJECT_ID('students'))
BEGIN
    CREATE INDEX IX_students_university ON students(university);
    PRINT '✓ 已建立 university 索引';
END
ELSE
BEGIN
    PRINT '✓ university 索引已存在';
END

-- 建立 major 索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_major' AND object_id = OBJECT_ID('students'))
BEGIN
    CREATE INDEX IX_students_major ON students(major);
    PRINT '✓ 已建立 major 索引';
END
ELSE
BEGIN
    PRINT '✓ major 索引已存在';
END

PRINT '=== 最終驗證 ===';

-- 再次顯示表格結構，確認欄位已新增
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型態',
    CHARACTER_MAXIMUM_LENGTH AS '最大長度',
    IS_NULLABLE AS '允許空值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

PRINT '=== 完成 ===';
PRINT '大學和科系欄位檢查及新增完成！'; 