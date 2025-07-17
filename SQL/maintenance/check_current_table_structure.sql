-- =============================================
-- 檢查 student_schedules 表結構
-- 創建日期: 2025-01-28
-- 說明: 檢查當前表的欄位型別和約束條件
-- =============================================

PRINT N'=== 檢查 student_schedules 表結構 ===';

-- 檢查欄位型別
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules'
ORDER BY ORDINAL_POSITION;

PRINT N'';
PRINT N'=== 檢查約束條件 ===';

-- 檢查約束條件
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'student_schedules';

PRINT N'';
PRINT N'=== 檢查觸發器 ===';

-- 檢查觸發器
SELECT 
    name AS trigger_name,
    type_desc
FROM sys.triggers 
WHERE parent_id = OBJECT_ID('student_schedules');

PRINT N'';
PRINT N'=== 檢查資料範例 ===';

-- 檢查資料範例
SELECT TOP 5 
    id,
    student_id,
    day_of_week,
    start_time,
    end_time,
    course_name,
    teacher_name,
    created_at,
    updated_at
FROM student_schedules
ORDER BY id;

PRINT N'';
PRINT N'=== 檢查完成 ==='; 