-- =============================================
-- 檢查資料庫狀態 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 檢查 student_schedules 表的詳細狀態
-- =============================================

PRINT N'=== 檢查 student_schedules 表狀態 ===';

-- 1. 檢查表是否存在
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
BEGIN
    PRINT N'✓ student_schedules 表存在';
END
ELSE
BEGIN
    PRINT N'✗ student_schedules 表不存在';
    RETURN;
END

-- 2. 檢查所有欄位
PRINT N'';
PRINT N'=== 欄位列表 ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules'
ORDER BY ORDINAL_POSITION;

-- 3. 檢查約束條件
PRINT N'';
PRINT N'=== 約束條件列表 ===';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'student_schedules';

-- 4. 檢查外鍵約束
PRINT N'';
PRINT N'=== 外鍵約束列表 ===';
SELECT 
    fk.name AS constraint_name,
    OBJECT_NAME(fk.parent_object_id) AS table_name,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS column_name,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table_name,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column_name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'student_schedules';

-- 5. 檢查檢查約束
PRINT N'';
PRINT N'=== 檢查約束列表 ===';
SELECT 
    cc.name AS constraint_name,
    cc.definition
FROM sys.check_constraints cc
INNER JOIN sys.objects o ON cc.parent_object_id = o.object_id
WHERE o.name = 'student_schedules';

-- 6. 檢查觸發器
PRINT N'';
PRINT N'=== 觸發器列表 ===';
SELECT 
    name AS trigger_name,
    type_desc,
    is_disabled
FROM sys.triggers 
WHERE parent_id = OBJECT_ID('student_schedules');

-- 7. 檢查資料
PRINT N'';
PRINT N'=== 資料統計 ===';
SELECT 
    COUNT(*) AS total_records,
    COUNT(CASE WHEN start_time IS NOT NULL THEN 1 END) AS records_with_start_time,
    COUNT(CASE WHEN end_time IS NOT NULL THEN 1 END) AS records_with_end_time
FROM student_schedules;

-- 8. 顯示資料範例
PRINT N'';
PRINT N'=== 資料範例 ===';
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

-- 9. 檢查時間格式
PRINT N'';
PRINT N'=== 時間格式檢查 ===';
SELECT 
    'start_time 格式' AS time_field,
    start_time,
    CASE 
        WHEN start_time LIKE '[0-9][0-9]:[0-5][0-9]' THEN '正確格式 (HH:mm)'
        WHEN start_time LIKE '[0-9]:[0-5][0-9]' THEN '正確格式 (H:mm)'
        ELSE '不正確格式'
    END AS format_status
FROM student_schedules
WHERE start_time IS NOT NULL
UNION ALL
SELECT 
    'end_time 格式' AS time_field,
    end_time,
    CASE 
        WHEN end_time LIKE '[0-9][0-9]:[0-5][0-9]' THEN '正確格式 (HH:mm)'
        WHEN end_time LIKE '[0-9]:[0-5][0-9]' THEN '正確格式 (H:mm)'
        ELSE '不正確格式'
    END AS format_status
FROM student_schedules
WHERE end_time IS NOT NULL;

PRINT N'';
PRINT N'=== 檢查完成 ==='; 