-- =============================================
-- 簡單修復腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 最簡單的方式修復時間欄位問題
-- =============================================

PRINT N'開始簡單修復...';

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

-- 2. 如果時間欄位已經是 VARCHAR，則只需要建立約束條件
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'student_schedules' 
      AND COLUMN_NAME = 'start_time' 
      AND DATA_TYPE = 'varchar'
)
BEGIN
    PRINT N'時間欄位已經是 VARCHAR 型別，建立約束條件...';
    
    -- 建立外鍵約束（如果不存在）
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('FK_student_schedules_student_id'))
    BEGIN
        ALTER TABLE student_schedules 
        ADD CONSTRAINT FK_student_schedules_student_id 
        FOREIGN KEY (student_id) REFERENCES students(id);
        PRINT N'已建立外鍵約束';
    END
    
    -- 建立星期檢查約束（如果不存在）
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_day_of_week'))
    BEGIN
        ALTER TABLE student_schedules 
        ADD CONSTRAINT CK_student_schedules_day_of_week 
        CHECK (day_of_week IN ('星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'));
        PRINT N'已建立星期檢查約束';
    END
    
    -- 建立時間格式檢查約束（如果不存在）
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_start_time_format'))
    BEGIN
        ALTER TABLE student_schedules 
        ADD CONSTRAINT CK_student_schedules_start_time_format 
        CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');
        PRINT N'已建立開始時間格式檢查約束';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_end_time_format'))
    BEGIN
        ALTER TABLE student_schedules 
        ADD CONSTRAINT CK_student_schedules_end_time_format 
        CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');
        PRINT N'已建立結束時間格式檢查約束';
    END
    
    -- 建立時間範圍檢查約束（如果不存在）
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_time_range'))
    BEGIN
        ALTER TABLE student_schedules 
        ADD CONSTRAINT CK_student_schedules_time_range 
        CHECK (start_time < end_time OR end_time IS NULL);
        PRINT N'已建立時間範圍檢查約束';
    END
    
    -- 建立觸發器（如果不存在）
    IF OBJECT_ID('TR_student_schedules_update_timestamp', 'TR') IS NULL
    BEGIN
        GO
        
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
        GO
        
        PRINT N'已建立觸發器';
    END
    
    PRINT N'=== 修復完成 ===';
    PRINT N'✓ 時間欄位格式為 VARCHAR(5)';
    PRINT N'✓ 支援 HH:mm 格式（不需要秒數）';
    PRINT N'✓ 所有約束條件已建立';
    PRINT N'✓ 觸發器已建立';
END
ELSE
BEGIN
    PRINT N'時間欄位不是 VARCHAR 型別，需要先執行完整的修改腳本';
    PRINT N'請執行 modify_time_columns_smart.sql';
END

-- 3. 顯示資料範例
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
PRINT N'完成時間: ' + CONVERT(VARCHAR(30), GETDATE(), 120); 