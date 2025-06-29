-- =============================================
-- 完整刪除 student_schedules 資料表語法 (MS SQL Server)
-- =============================================

-- 1. 刪除相關的函數
IF OBJECT_ID('dbo.fn_CheckScheduleConflict', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_CheckScheduleConflict;
    PRINT N'已刪除函數：fn_CheckScheduleConflict';
END

-- 2. 刪除觸發器
IF OBJECT_ID('dbo.TR_student_schedules_update_timestamp', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER TR_student_schedules_update_timestamp;
    PRINT N'已刪除觸發器：TR_student_schedules_update_timestamp';
END

-- 3. 刪除索引（如果表格存在的話）
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
BEGIN
    -- 刪除非聚集索引
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
    
    PRINT N'已刪除所有相關索引';
END

-- 4. 刪除外鍵約束（如果存在）
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
BEGIN
    -- 檢查並刪除外鍵約束
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('FK_student_schedules_student_id'))
    BEGIN
        ALTER TABLE student_schedules DROP CONSTRAINT FK_student_schedules_student_id;
        PRINT N'已刪除外鍵約束：FK_student_schedules_student_id';
    END
    
    -- 檢查並刪除其他約束
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
END

-- 5. 最後刪除資料表
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
BEGIN
    DROP TABLE student_schedules;
    PRINT N'已刪除資料表：student_schedules';
END
ELSE
BEGIN
    PRINT N'資料表 student_schedules 不存在，無需刪除';
END

-- =============================================
-- 清理完成確認
-- =============================================

PRINT N'';
PRINT N'=== 清理完成 ===';
PRINT N'已完整移除 student_schedules 相關的所有物件：';
PRINT N'✓ 資料表：student_schedules';
PRINT N'✓ 觸發器：TR_student_schedules_update_timestamp';
PRINT N'✓ 函數：fn_CheckScheduleConflict';
PRINT N'✓ 所有索引';
PRINT N'✓ 所有約束條件';
PRINT N'';

-- =============================================
-- 驗證清理結果
-- =============================================

-- 檢查資料表是否已刪除
IF OBJECT_ID('student_schedules', 'U') IS NULL
    PRINT N'✓ 確認：student_schedules 資料表已完全刪除';
ELSE
    PRINT N'✗ 警告：student_schedules 資料表仍然存在';

-- 檢查函數是否已刪除
IF OBJECT_ID('dbo.fn_CheckScheduleConflict', 'FN') IS NULL
    PRINT N'✓ 確認：fn_CheckScheduleConflict 函數已完全刪除';
ELSE
    PRINT N'✗ 警告：fn_CheckScheduleConflict 函數仍然存在';

-- 檢查觸發器是否已刪除
IF OBJECT_ID('dbo.TR_student_schedules_update_timestamp', 'TR') IS NULL
    PRINT N'✓ 確認：TR_student_schedules_update_timestamp 觸發器已完全刪除';
ELSE
    PRINT N'✗ 警告：TR_student_schedules_update_timestamp 觸發器仍然存在';

PRINT N'';
PRINT N'清理作業完成！'; 