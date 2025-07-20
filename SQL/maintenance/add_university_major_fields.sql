-- =====================================================
-- 為學生表格增加大學和科系欄位
-- 創建日期: 2025-01-28
-- 說明: 在 students 表格中增加 university 和 major 欄位
-- =====================================================

-- 檢查欄位是否已存在，如果不存在則新增
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'university')
BEGIN
    ALTER TABLE students ADD university NVARCHAR(100) NULL;
    PRINT '已新增 university 欄位到 students 表格';
END
ELSE
BEGIN
    PRINT 'university 欄位已存在於 students 表格中';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'major')
BEGIN
    ALTER TABLE students ADD major NVARCHAR(100) NULL;
    PRINT '已新增 major 欄位到 students 表格';
END
ELSE
BEGIN
    PRINT 'major 欄位已存在於 students 表格中';
END

-- 建立索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_university')
BEGIN
    CREATE INDEX IX_students_university ON students(university);
    PRINT '已建立 university 欄位索引';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_major')
BEGIN
    CREATE INDEX IX_students_major ON students(major);
    PRINT '已建立 major 欄位索引';
END

PRINT '大學和科系欄位新增完成'; 