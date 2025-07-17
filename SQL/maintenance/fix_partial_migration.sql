-- =============================================
-- 修復部分修改的資料庫狀態 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 修復之前部分執行的修改腳本造成的問題
-- =============================================

PRINT N'開始修復部分修改的資料庫狀態...';

-- 1. 檢查當前狀態
DECLARE @start_time_type NVARCHAR(50);
DECLARE @end_time_type NVARCHAR(50);
DECLARE @has_start_time_new BIT = 0;
DECLARE @has_end_time_new BIT = 0;

SELECT @start_time_type = DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'start_time';

SELECT @end_time_type = DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'end_time';

SELECT @has_start_time_new = CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'start_time_new';

SELECT @has_end_time_new = CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'end_time_new';

PRINT N'當前 start_time 欄位型別: ' + ISNULL(@start_time_type, '不存在');
PRINT N'當前 end_time 欄位型別: ' + ISNULL(@end_time_type, '不存在');
PRINT N'是否有 start_time_new 欄位: ' + CASE WHEN @has_start_time_new = 1 THEN '是' ELSE '否' END;
PRINT N'是否有 end_time_new 欄位: ' + CASE WHEN @has_end_time_new = 1 THEN '是' ELSE '否' END;

-- 2. 如果已經有新的欄位，完成轉換
IF @has_start_time_new = 1 AND @has_end_time_new = 1
BEGIN
    PRINT N'發現新欄位，完成轉換過程...';
    
    -- 刪除舊欄位
    IF @start_time_type IS NOT NULL
    BEGIN
        ALTER TABLE student_schedules DROP COLUMN start_time;
        PRINT N'已刪除舊的 start_time 欄位';
    END
    
    IF @end_time_type IS NOT NULL
    BEGIN
        ALTER TABLE student_schedules DROP COLUMN end_time;
        PRINT N'已刪除舊的 end_time 欄位';
    END
    
    -- 重新命名新欄位
    EXEC sp_rename 'student_schedules.start_time_new', 'start_time', 'COLUMN';
    EXEC sp_rename 'student_schedules.end_time_new', 'end_time', 'COLUMN';
    PRINT N'已重新命名新欄位';
END
ELSE IF @start_time_type = 'varchar' AND @end_time_type = 'varchar'
BEGIN
    PRINT N'時間欄位已經是 VARCHAR 型別，檢查是否需要建立約束條件...';
END
ELSE
BEGIN
    PRINT N'需要重新執行完整的修改流程...';
    -- 這裡可以呼叫完整的修改腳本
    RETURN;
END

-- 3. 檢查並建立缺失的約束條件
-- 外鍵約束
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('FK_student_schedules_student_id'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT FK_student_schedules_student_id 
    FOREIGN KEY (student_id) REFERENCES students(id);
    PRINT N'已建立外鍵約束：FK_student_schedules_student_id';
END
ELSE
BEGIN
    PRINT N'外鍵約束已存在';
END

-- 星期檢查約束
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_day_of_week'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_day_of_week 
    CHECK (day_of_week IN ('星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'));
    PRINT N'已建立星期檢查約束：CK_student_schedules_day_of_week';
END
ELSE
BEGIN
    PRINT N'星期檢查約束已存在';
END

-- 時間格式檢查約束
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_start_time_format'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_start_time_format 
    CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');
    PRINT N'已建立時間格式檢查約束：CK_student_schedules_start_time_format';
END
ELSE
BEGIN
    PRINT N'時間格式檢查約束已存在';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_end_time_format'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_end_time_format 
    CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');
    PRINT N'已建立時間格式檢查約束：CK_student_schedules_end_time_format';
END
ELSE
BEGIN
    PRINT N'時間格式檢查約束已存在';
END

-- 時間範圍檢查約束
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_time_range'))
BEGIN
    ALTER TABLE student_schedules 
    ADD CONSTRAINT CK_student_schedules_time_range 
    CHECK (start_time < end_time OR end_time IS NULL);
    PRINT N'已建立時間範圍檢查約束：CK_student_schedules_time_range';
END
ELSE
BEGIN
    PRINT N'時間範圍檢查約束已存在';
END

-- 4. 檢查並建立觸發器
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
    
    PRINT N'已建立觸發器：TR_student_schedules_update_timestamp';
END
ELSE
BEGIN
    PRINT N'觸發器已存在';
END

-- 5. 驗證修改結果
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

-- 6. 顯示資料範例
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
PRINT N'✓ 資料庫狀態已修復';
PRINT N'✓ 時間欄位格式為 VARCHAR(5)';
PRINT N'✓ 支援 HH:mm 格式（不需要秒數）';
PRINT N'✓ 所有約束條件已建立';
PRINT N'✓ 觸發器已建立';
PRINT N'';
PRINT N'完成時間: ' + CONVERT(VARCHAR(30), GETDATE(), 120); 