-- =============================================
-- 修改時間欄位格式 - 移除秒數支援 (MS SQL Server) - 修復版
-- 創建日期: 2025-01-28
-- 說明: 將 student_schedules 表的時間欄位從 TIME 改為 VARCHAR(5) 以支援 HH:mm 格式
-- =============================================

-- 1. 備份現有資料
IF OBJECT_ID('tempdb..#temp_student_schedules') IS NOT NULL
    DROP TABLE #temp_student_schedules;

SELECT * INTO #temp_student_schedules FROM student_schedules;
PRINT N'已備份現有資料到臨時表';

-- 2. 刪除相關的約束和索引
-- 刪除外鍵約束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('FK_student_schedules_student_id'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT FK_student_schedules_student_id;
    PRINT N'已刪除外鍵約束：FK_student_schedules_student_id';
END

-- 刪除檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_day_of_week'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT CK_student_schedules_day_of_week;
    PRINT N'已刪除檢查約束：CK_student_schedules_day_of_week';
END

IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_time_range'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT CK_student_schedules_time_range;
    PRINT N'已刪除檢查約束：CK_student_schedules_time_range';
END

-- 刪除索引
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('student_schedules') AND name = 'IX_student_schedules_student_id')
    DROP INDEX IX_student_schedules_student_id ON student_schedules;

IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('student_schedules') AND name = 'IX_student_schedules_day_of_week')
    DROP INDEX IX_student_schedules_day_of_week ON student_schedules;

IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('student_schedules') AND name = 'IX_student_schedules_start_time')
    DROP INDEX IX_student_schedules_start_time ON student_schedules;

IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('student_schedules') AND name = 'IX_student_schedules_is_active')
    DROP INDEX IX_student_schedules_is_active ON student_schedules;

IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('student_schedules') AND name = 'IX_student_schedules_day_time')
    DROP INDEX IX_student_schedules_day_time ON student_schedules;

PRINT N'已刪除所有相關約束和索引';

-- 3. 修改時間欄位型別
-- 先新增臨時欄位
ALTER TABLE student_schedules ADD start_time_new VARCHAR(5);
ALTER TABLE student_schedules ADD end_time_new VARCHAR(5);
PRINT N'已新增臨時時間欄位';

-- 轉換現有資料：將 TIME 格式轉換為 HH:mm 格式
UPDATE student_schedules 
SET 
    start_time_new = FORMAT(start_time, 'HH:mm'),
    end_time_new = FORMAT(end_time, 'HH:mm');
PRINT N'已轉換現有時間資料';

-- 刪除舊欄位
ALTER TABLE student_schedules DROP COLUMN start_time;
ALTER TABLE student_schedules DROP COLUMN end_time;
PRINT N'已刪除舊時間欄位';

-- 重新命名新欄位
EXEC sp_rename 'student_schedules.start_time_new', 'start_time', 'COLUMN';
EXEC sp_rename 'student_schedules.end_time_new', 'end_time', 'COLUMN';
PRINT N'已重新命名時間欄位';

-- 4. 重新建立約束條件
-- 外鍵約束
ALTER TABLE student_schedules 
ADD CONSTRAINT FK_student_schedules_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_day_of_week 
CHECK (day_of_week IN (N'星期一', N'星期二', N'星期三', N'星期四', N'星期五', N'星期六', N'星期日'));

-- 時間格式檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_start_time_format 
CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');

ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_end_time_format 
CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');

-- 時間範圍檢查約束（需要轉換為分鐘進行比較）
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_time_range 
CHECK (
    end_time IS NULL OR 
    (
        CAST(SUBSTRING(start_time, 1, CHARINDEX(':', start_time) - 1) AS INT) * 60 + 
        CAST(SUBSTRING(start_time, CHARINDEX(':', start_time) + 1, 2) AS INT) <
        CAST(SUBSTRING(end_time, 1, CHARINDEX(':', end_time) - 1) AS INT) * 60 + 
        CAST(SUBSTRING(end_time, CHARINDEX(':', end_time) + 1, 2) AS INT)
    )
);

PRINT N'已重新建立約束條件';

-- 5. 重新建立索引
CREATE NONCLUSTERED INDEX IX_student_schedules_student_id ON student_schedules(student_id);
CREATE NONCLUSTERED INDEX IX_student_schedules_day_of_week ON student_schedules(day_of_week);
CREATE NONCLUSTERED INDEX IX_student_schedules_start_time ON student_schedules(start_time);
CREATE NONCLUSTERED INDEX IX_student_schedules_is_active ON student_schedules(is_active);
CREATE NONCLUSTERED INDEX IX_student_schedules_day_time ON student_schedules(day_of_week, start_time);
PRINT N'已重新建立索引';

-- 6. 重新建立觸發器（修復版）
IF OBJECT_ID('TR_student_schedules_update_timestamp', 'TR') IS NOT NULL
    DROP TRIGGER TR_student_schedules_update_timestamp;
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

PRINT N'已重新建立觸發器';

-- 7. 驗證資料完整性
PRINT N'';
PRINT N'=== 驗證資料完整性 ===';

DECLARE @total_count INT;
DECLARE @active_count INT;
DECLARE @correct_format_count INT;

SELECT @total_count = COUNT(*) FROM student_schedules;
SELECT @active_count = COUNT(*) FROM student_schedules WHERE is_active = 1;
SELECT @correct_format_count = COUNT(*) FROM student_schedules 
WHERE start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]';

PRINT N'總記錄數: ' + CAST(@total_count AS NVARCHAR(10));
PRINT N'有效記錄數: ' + CAST(@active_count AS NVARCHAR(10));
PRINT N'正確時間格式數: ' + CAST(@correct_format_count AS NVARCHAR(10));

-- 8. 清理臨時表
DROP TABLE #temp_student_schedules;
PRINT N'已清理臨時表';

PRINT N'';
PRINT N'=== 修改完成 ===';
PRINT N'✓ 時間欄位已從 TIME 改為 VARCHAR(5)';
PRINT N'✓ 支援 HH:mm 格式（不需要秒數）';
PRINT N'✓ 所有約束條件已重新建立';
PRINT N'✓ 所有索引已重新建立';
PRINT N'✓ 觸發器已重新建立';
PRINT N'✓ 資料已成功轉換';
PRINT N'';
PRINT N'注意：請同步修改前後端程式碼以配合新的時間格式！'; 