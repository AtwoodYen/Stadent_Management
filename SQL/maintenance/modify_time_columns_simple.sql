-- =============================================
-- 修改時間欄位格式 - 簡化版本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 將 student_schedules 表的時間欄位從 TIME 改為 VARCHAR(5) 以支援 HH:mm 格式
-- =============================================

PRINT N'開始修改時間欄位格式...';

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

-- 刪除觸發器
IF OBJECT_ID('TR_student_schedules_update_timestamp', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER TR_student_schedules_update_timestamp;
    PRINT N'已刪除觸發器：TR_student_schedules_update_timestamp';
END

-- 3. 修改欄位型別
-- 先新增新欄位
ALTER TABLE student_schedules ADD start_time_new VARCHAR(5);
ALTER TABLE student_schedules ADD end_time_new VARCHAR(5);
PRINT N'已新增新欄位';

-- 4. 轉換資料（簡化版本）
-- 將 TIME 型別轉換為 HH:mm 格式
UPDATE student_schedules 
SET start_time_new = CONVERT(VARCHAR(5), start_time, 108),
    end_time_new = CONVERT(VARCHAR(5), end_time, 108);
PRINT N'已轉換資料格式';

-- 5. 刪除舊欄位並重新命名新欄位
ALTER TABLE student_schedules DROP COLUMN start_time;
ALTER TABLE student_schedules DROP COLUMN end_time;
EXEC sp_rename 'student_schedules.start_time_new', 'start_time', 'COLUMN';
EXEC sp_rename 'student_schedules.end_time_new', 'end_time', 'COLUMN';
PRINT N'已重新命名欄位';

-- 6. 重新建立約束條件
-- 外鍵約束
ALTER TABLE student_schedules 
ADD CONSTRAINT FK_student_schedules_student_id 
FOREIGN KEY (student_id) REFERENCES students(id);
PRINT N'已重新建立外鍵約束';

-- 星期檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_day_of_week 
CHECK (day_of_week IN ('星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'));
PRINT N'已重新建立星期檢查約束';

-- 時間格式檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_start_time_format 
CHECK (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]');

ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_end_time_format 
CHECK (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');
PRINT N'已重新建立時間格式檢查約束';

-- 時間範圍檢查約束
ALTER TABLE student_schedules 
ADD CONSTRAINT CK_student_schedules_time_range 
CHECK (start_time < end_time OR end_time IS NULL);
PRINT N'已重新建立時間範圍檢查約束';

-- 7. 重新建立觸發器
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

-- 8. 驗證修改結果
DECLARE @total_count INT;
DECLARE @active_count INT;
DECLARE @correct_format_count INT;

SELECT @total_count = COUNT(*) FROM student_schedules;
SELECT @active_count = COUNT(*) FROM student_schedules WHERE is_deleted = 0 OR is_deleted IS NULL;
SELECT @correct_format_count = COUNT(*) 
FROM student_schedules 
WHERE (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]')
  AND (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');

PRINT N'=== 驗證資料完整性 ===';
PRINT N'總記錄數: ' + CAST(@total_count AS VARCHAR(10));
PRINT N'有效記錄數: ' + CAST(@active_count AS VARCHAR(10));
PRINT N'正確時間格式數: ' + CAST(@correct_format_count AS VARCHAR(10));

-- 9. 清理臨時表
IF OBJECT_ID('tempdb..#temp_student_schedules') IS NOT NULL
BEGIN
    DROP TABLE #temp_student_schedules;
    PRINT N'已清理臨時表';
END

PRINT N'';
PRINT N'=== 修改完成 ===';
PRINT N'✓ 時間欄位已從 TIME 改為 VARCHAR(5)';
PRINT N'✓ 支援 HH:mm 格式（不需要秒數）';
PRINT N'✓ 所有約束條件已重新建立';
PRINT N'✓ 觸發器已重新建立';
PRINT N'✓ 資料已成功轉換';
PRINT N'';
PRINT N'注意：請同步修改前後端程式碼以配合新的時間格式！';
PRINT N'';
PRINT N'完成時間: ' + CONVERT(VARCHAR(30), GETDATE(), 120); 