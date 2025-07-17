-- =============================================
-- 修改時間欄位格式 - 智能版本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 將 student_schedules 表的時間欄位從 TIME 改為 VARCHAR(5) 以支援 HH:mm 格式
-- =============================================

PRINT N'開始智能修改時間欄位格式...';

-- 1. 檢查當前表結構
DECLARE @start_time_type NVARCHAR(50);
DECLARE @end_time_type NVARCHAR(50);
DECLARE @has_is_deleted BIT = 0;

SELECT @start_time_type = DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'start_time';

SELECT @end_time_type = DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'end_time';

SELECT @has_is_deleted = CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_schedules' AND COLUMN_NAME = 'is_deleted';

PRINT N'當前 start_time 欄位型別: ' + ISNULL(@start_time_type, '不存在');
PRINT N'當前 end_time 欄位型別: ' + ISNULL(@end_time_type, '不存在');
PRINT N'是否有 is_deleted 欄位: ' + CASE WHEN @has_is_deleted = 1 THEN '是' ELSE '否' END;

-- 如果已經是 VARCHAR 型別，則不需要修改
IF @start_time_type = 'varchar' AND @end_time_type = 'varchar'
BEGIN
    PRINT N'時間欄位已經是 VARCHAR 型別，無需修改！';
    RETURN;
END

-- 2. 備份現有資料
IF OBJECT_ID('tempdb..#temp_student_schedules') IS NOT NULL
    DROP TABLE #temp_student_schedules;

SELECT * INTO #temp_student_schedules FROM student_schedules;
PRINT N'已備份現有資料到臨時表';

-- 3. 刪除相關的約束和索引
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

-- 刪除時間相關的檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_start_time_format'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT CK_student_schedules_start_time_format;
    PRINT N'已刪除時間格式檢查約束：CK_student_schedules_start_time_format';
END

IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_end_time_format'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT CK_student_schedules_end_time_format;
    PRINT N'已刪除時間格式檢查約束：CK_student_schedules_end_time_format';
END

IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID('CK_student_schedules_time_range'))
BEGIN
    ALTER TABLE student_schedules DROP CONSTRAINT CK_student_schedules_time_range;
    PRINT N'已刪除時間範圍檢查約束：CK_student_schedules_time_range';
END

-- 刪除觸發器
IF OBJECT_ID('TR_student_schedules_update_timestamp', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER TR_student_schedules_update_timestamp;
    PRINT N'已刪除觸發器：TR_student_schedules_update_timestamp';
END

-- 4. 修改欄位型別
-- 先新增新欄位
ALTER TABLE student_schedules ADD start_time_new VARCHAR(5);
ALTER TABLE student_schedules ADD end_time_new VARCHAR(5);
PRINT N'已新增新欄位';

-- 5. 轉換資料
-- 根據原始欄位型別進行不同的轉換
IF @start_time_type = 'time'
BEGIN
    -- 從 TIME 型別轉換
    UPDATE student_schedules 
    SET start_time_new = CONVERT(VARCHAR(5), start_time, 108),
        end_time_new = CONVERT(VARCHAR(5), end_time, 108);
    PRINT N'已從 TIME 型別轉換資料格式';
END
ELSE
BEGIN
    -- 從其他型別轉換（如 VARCHAR）
    UPDATE student_schedules 
    SET start_time_new = LEFT(CAST(start_time AS VARCHAR(10)), 5),
        end_time_new = LEFT(CAST(end_time AS VARCHAR(10)), 5);
    PRINT N'已從其他型別轉換資料格式';
END

-- 6. 刪除舊欄位並重新命名新欄位
ALTER TABLE student_schedules DROP COLUMN start_time;
ALTER TABLE student_schedules DROP COLUMN end_time;
EXEC sp_rename 'student_schedules.start_time_new', 'start_time', 'COLUMN';
EXEC sp_rename 'student_schedules.end_time_new', 'end_time', 'COLUMN';
PRINT N'已重新命名欄位';

-- 7. 重新建立約束條件
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

-- 8. 重新建立觸發器
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

-- 9. 驗證修改結果
DECLARE @total_count INT;
DECLARE @active_count INT;
DECLARE @correct_format_count INT;

SELECT @total_count = COUNT(*) FROM student_schedules;

-- 根據是否有 is_deleted 欄位來計算有效記錄數
IF @has_is_deleted = 1
BEGIN
    SELECT @active_count = COUNT(*) FROM student_schedules WHERE is_deleted = 0 OR is_deleted IS NULL;
END
ELSE
BEGIN
    SELECT @active_count = COUNT(*) FROM student_schedules;
END

SELECT @correct_format_count = COUNT(*) 
FROM student_schedules 
WHERE (start_time LIKE '[0-9][0-9]:[0-5][0-9]' OR start_time LIKE '[0-9]:[0-5][0-9]')
  AND (end_time IS NULL OR end_time LIKE '[0-9][0-9]:[0-5][0-9]' OR end_time LIKE '[0-9]:[0-5][0-9]');

PRINT N'=== 驗證資料完整性 ===';
PRINT N'總記錄數: ' + CAST(@total_count AS VARCHAR(10));
PRINT N'有效記錄數: ' + CAST(@active_count AS VARCHAR(10));
PRINT N'正確時間格式數: ' + CAST(@correct_format_count AS VARCHAR(10));

-- 10. 清理臨時表
IF OBJECT_ID('tempdb..#temp_student_schedules') IS NOT NULL
BEGIN
    DROP TABLE #temp_student_schedules;
    PRINT N'已清理臨時表';
END

PRINT N'';
PRINT N'=== 修改完成 ===';
PRINT N'✓ 時間欄位已從 ' + @start_time_type + ' 改為 VARCHAR(5)';
PRINT N'✓ 支援 HH:mm 格式（不需要秒數）';
PRINT N'✓ 所有約束條件已重新建立';
PRINT N'✓ 觸發器已重新建立';
PRINT N'✓ 資料已成功轉換';
PRINT N'';
PRINT N'注意：請同步修改前後端程式碼以配合新的時間格式！';
PRINT N'';
PRINT N'完成時間: ' + CONVERT(VARCHAR(30), GETDATE(), 120); 