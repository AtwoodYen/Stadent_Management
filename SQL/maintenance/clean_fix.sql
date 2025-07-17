-- =============================================
-- 乾淨修復腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 修復時間欄位問題，避免語法錯誤
-- =============================================

PRINT N'開始乾淨修復...';

-- 1. 檢查當前狀態
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' 
  AND COLUMN_NAME IN ('start_time', 'end_time')
ORDER BY COLUMN_NAME;

PRINT N'=== 當前欄位狀態 ===';

-- 2. 建立外鍵約束（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('FK_student_schedules_student_id'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT FK_student_schedules_student_id 
    FOREIGN KEY (student_id) REFERENCES students(id);
    PRINT N'已建立外鍵約束：FK_student_schedules_student_id';
END
ELSE
BEGIN
    PRINT N'外鍵約束已存在：FK_student_schedules_student_id';
END

-- 3. 建立星期檢查約束（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_day_of_week'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_day_of_week 
    CHECK (day_of_week IN ('星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'));
    PRINT N'已建立星期檢查約束：CK_student_schedules_day_of_week';
END
ELSE
BEGIN
    PRINT N'星期檢查約束已存在：CK_student_schedules_day_of_week';
END

-- 4. 建立時間格式檢查約束（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_start_time_format'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_start_time_format 
    CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');
    PRINT N'已建立開始時間格式檢查約束：CK_student_schedules_start_time_format';
END
ELSE
BEGIN
    PRINT N'開始時間格式檢查約束已存在：CK_student_schedules_start_time_format';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_end_time_format'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_end_time_format 
    CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');
    PRINT N'已建立結束時間格式檢查約束：CK_student_schedules_end_time_format';
END
ELSE
BEGIN
    PRINT N'結束時間格式檢查約束已存在：CK_student_schedules_end_time_format';
END

-- 5. 建立時間範圍檢查約束（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_time_range'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_time_range 
    CHECK (start_time < end_time OR end_time IS NULL);
    PRINT N'已建立時間範圍檢查約束：CK_student_schedules_time_range';
END
ELSE
BEGIN
    PRINT N'時間範圍檢查約束已存在：CK_student_schedules_time_range';
END

-- 6. 檢查觸發器是否存在
IF OBJECT_ID('TR_student_schedules_update_timestamp', 'TR') IS NULL
BEGIN
    PRINT N'觸發器不存在，正在建立...';
    
    -- 建立觸發器
    CREATE TRIGGER TR_student_schedules_update_timestamp
    ON student_schedules
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE student_schedules 
        SET updated_at = GETDATE()
        WHERE id IN (SELECT id FROM inserted);
    END;
    
    PRINT N'已建立觸發器：TR_student_schedules_update_timestamp';
END
ELSE
BEGIN
    PRINT N'觸發器已存在：TR_student_schedules_update_timestamp';
END

-- 7. 驗證修改結果
DECLARE @total_count INT;
DECLARE @correct_format_count INT;

SELECT @total_count = COUNT(*) FROM student_schedules;

SELECT @correct_format_count = COUNT(*) 
FROM student_schedules 
WHERE (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]')
  AND (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');

PRINT N'=== 驗證資料完整性 ===';
PRINT N'總記錄數: ' + CAST(@total_count AS VARCHAR(10));
PRINT N'正確時間格式數: ' + CAST(@correct_format_count AS VARCHAR(10));

-- 8. 顯示資料範例
PRINT N'';
PRINT N'=== 資料範例 ===';
SELECT TOP 3 
    id,
    student_id,
    day_of_week,
    start_time,
    end_time,
    course_name
FROM student_schedules
ORDER BY id;

PRINT N'';
PRINT N'=== 修復完成 ===';
PRINT N'✓ 所有約束條件已檢查並建立';
PRINT N'✓ 觸發器已檢查並建立';
PRINT N'✓ 資料格式已驗證';
PRINT N'';
PRINT N'完成時間: ' + CONVERT(VARCHAR(30), GETDATE(), 120); 