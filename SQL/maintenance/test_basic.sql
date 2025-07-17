-- =============================================
-- 基本測試腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 測試資料庫基本功能
-- =============================================

PRINT N'開始基本測試...';

-- 1. 測試表是否存在
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
BEGIN
    PRINT N'✓ student_schedules 表存在';
END
ELSE
BEGIN
    PRINT N'✗ student_schedules 表不存在';
    RETURN;
END

-- 2. 測試基本查詢
PRINT N'';
PRINT N'=== 基本查詢測試 ===';
SELECT COUNT(*) AS total_records FROM student_schedules;

-- 3. 測試欄位查詢
PRINT N'';
PRINT N'=== 欄位查詢測試 ===';
SELECT TOP 1 
    id,
    student_id,
    day_of_week,
    start_time,
    end_time
FROM student_schedules;

-- 4. 測試時間欄位型別
PRINT N'';
PRINT N'=== 時間欄位型別測試 ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' 
  AND COLUMN_NAME IN ('start_time', 'end_time');

-- 5. 測試約束條件查詢
PRINT N'';
PRINT N'=== 約束條件測試 ===';
SELECT COUNT(*) AS constraint_count
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'student_schedules';

-- 6. 測試觸發器查詢
PRINT N'';
PRINT N'=== 觸發器測試 ===';
SELECT COUNT(*) AS trigger_count
FROM sys.triggers 
WHERE parent_id = OBJECT_ID('student_schedules');

PRINT N'';
PRINT N'=== 基本測試完成 ==='; 