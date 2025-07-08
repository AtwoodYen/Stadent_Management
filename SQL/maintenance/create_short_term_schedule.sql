-- =====================================================
-- 短期班排課系統 - 資料表建立腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為短期班學生建立靈活的排課系統，支援以週為單位、每半小時為單位的排課
-- =====================================================

-- 1. 建立短期班課程時段資料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[short_term_schedules]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[short_term_schedules] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [student_id] INT NOT NULL,                  -- 學生ID (外鍵)
        [week_start_date] DATE NOT NULL,            -- 週開始日期 (週一)
        [week_end_date] DATE NOT NULL,              -- 週結束日期 (週日)
        [day_of_week] INT NOT NULL,                 -- 星期幾 (1=週一, 2=週二, ..., 7=週日)
        [time_slot] TIME NOT NULL,                  -- 時段 (每半小時: 09:00, 09:30, 10:00, ...)
        [duration_minutes] INT NOT NULL DEFAULT 30, -- 時長 (分鐘，預設30分鐘)
        [lesson_type] NVARCHAR(10) NOT NULL,        -- 課程類型：physical, online
        [status] NVARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 狀態：scheduled, completed, cancelled, rescheduled
        [teacher_id] INT NULL,                      -- 授課老師ID (可選)
        [subject] NVARCHAR(100) NULL,               -- 課程科目
        [classroom] NVARCHAR(50) NULL,              -- 教室 (實體課用)
        [notes] NVARCHAR(500) NULL,                 -- 備註
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- 約束條件
        CONSTRAINT [CHK_short_term_schedules_day_of_week] CHECK ([day_of_week] BETWEEN 1 AND 7),
        CONSTRAINT [CHK_short_term_schedules_lesson_type] CHECK ([lesson_type] IN ('physical', 'online')),
        CONSTRAINT [CHK_short_term_schedules_status] CHECK ([status] IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
        CONSTRAINT [CHK_short_term_schedules_duration] CHECK ([duration_minutes] > 0 AND [duration_minutes] <= 480), -- 最多8小時
        CONSTRAINT [CHK_short_term_schedules_time_slot] CHECK ([time_slot] >= '09:00:00' AND [time_slot] <= '21:00:00'), -- 9:00-21:00
        CONSTRAINT [CHK_short_term_schedules_week_dates] CHECK ([week_end_date] >= [week_start_date])
    );
    
    PRINT N'已創建 short_term_schedules 資料表';
END
ELSE
BEGIN
    PRINT N'short_term_schedules 資料表已存在';
END
GO

-- 2. 建立索引以提升查詢效能
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_short_term_schedules_student_id')
    CREATE NONCLUSTERED INDEX [IX_short_term_schedules_student_id] ON [dbo].[short_term_schedules] ([student_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_short_term_schedules_week_dates')
    CREATE NONCLUSTERED INDEX [IX_short_term_schedules_week_dates] ON [dbo].[short_term_schedules] ([week_start_date], [week_end_date]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_short_term_schedules_day_time')
    CREATE NONCLUSTERED INDEX [IX_short_term_schedules_day_time] ON [dbo].[short_term_schedules] ([day_of_week], [time_slot]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_short_term_schedules_status')
    CREATE NONCLUSTERED INDEX [IX_short_term_schedules_status] ON [dbo].[short_term_schedules] ([status]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_short_term_schedules_teacher_id')
    CREATE NONCLUSTERED INDEX [IX_short_term_schedules_teacher_id] ON [dbo].[short_term_schedules] ([teacher_id]);

PRINT N'已建立相關索引';

-- 3. 建立更新時間觸發器
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_short_term_schedules_update_timestamp')
BEGIN
    EXEC('
    CREATE TRIGGER [dbo].[TR_short_term_schedules_update_timestamp]
    ON [dbo].[short_term_schedules]
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE [dbo].[short_term_schedules]
        SET [updated_at] = GETDATE()
        FROM [dbo].[short_term_schedules] sts
        INNER JOIN inserted i ON sts.[id] = i.[id];
    END
    ');
    PRINT N'已創建更新時間觸發器';
END

-- 4. 建立查詢視圖
CREATE OR ALTER VIEW [dbo].[view_short_term_schedules_summary] AS
SELECT 
    sts.[id],
    sts.[student_id],
    s.[chinese_name] as [學生姓名],
    s.[school] as [學校],
    s.[grade] as [年級],
    sts.[week_start_date] as [週開始日期],
    sts.[week_end_date] as [週結束日期],
    sts.[day_of_week] as [星期],
    CASE sts.[day_of_week]
        WHEN 1 THEN N'週一'
        WHEN 2 THEN N'週二'
        WHEN 3 THEN N'週三'
        WHEN 4 THEN N'週四'
        WHEN 5 THEN N'週五'
        WHEN 6 THEN N'週六'
        WHEN 7 THEN N'週日'
    END as [星期名稱],
    FORMAT(sts.[time_slot], 'HH:mm') as [時段],
    sts.[duration_minutes] as [時長分鐘],
    sts.[lesson_type] as [課程類型],
    CASE sts.[lesson_type]
        WHEN 'physical' THEN N'實體課'
        WHEN 'online' THEN N'線上課'
        ELSE sts.[lesson_type]
    END as [課程類型名稱],
    sts.[status] as [狀態],
    CASE sts.[status]
        WHEN 'scheduled' THEN N'已排課'
        WHEN 'completed' THEN N'已完成'
        WHEN 'cancelled' THEN N'已取消'
        WHEN 'rescheduled' THEN N'已調課'
        ELSE sts.[status]
    END as [狀態名稱],
    sts.[teacher_id],
    t.[name] as [老師姓名],
    sts.[subject] as [科目],
    sts.[classroom] as [教室],
    sts.[notes] as [備註],
    sts.[created_at] as [建立時間],
    sts.[updated_at] as [更新時間]
FROM [dbo].[short_term_schedules] sts
LEFT JOIN [dbo].[students] s ON sts.[student_id] = s.[id]
LEFT JOIN [dbo].[teachers] t ON sts.[teacher_id] = t.[id]
WHERE s.[is_active] = 1;

PRINT N'已創建查詢視圖';

-- 5. 建立輔助函數：取得指定週的開始和結束日期
CREATE OR ALTER FUNCTION [dbo].[fn_get_week_dates] (@input_date DATE)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        DATEADD(day, 1 - DATEPART(weekday, @input_date), @input_date) as [week_start_date],
        DATEADD(day, 7 - DATEPART(weekday, @input_date), @input_date) as [week_end_date]
);

PRINT N'已創建週日期計算函數';

-- 6. 建立輔助函數：取得可用的時段列表 (9:00-21:00，每半小時)
CREATE OR ALTER FUNCTION [dbo].[fn_get_available_time_slots]()
RETURNS TABLE
AS
RETURN
(
    SELECT 
        '09:00:00' as [time_slot], N'09:00' as [display_time]
    UNION ALL SELECT '09:30:00', N'09:30'
    UNION ALL SELECT '10:00:00', N'10:00'
    UNION ALL SELECT '10:30:00', N'10:30'
    UNION ALL SELECT '11:00:00', N'11:00'
    UNION ALL SELECT '11:30:00', N'11:30'
    UNION ALL SELECT '12:00:00', N'12:00'
    UNION ALL SELECT '12:30:00', N'12:30'
    UNION ALL SELECT '13:00:00', N'13:00'
    UNION ALL SELECT '13:30:00', N'13:30'
    UNION ALL SELECT '14:00:00', N'14:00'
    UNION ALL SELECT '14:30:00', N'14:30'
    UNION ALL SELECT '15:00:00', N'15:00'
    UNION ALL SELECT '15:30:00', N'15:30'
    UNION ALL SELECT '16:00:00', N'16:00'
    UNION ALL SELECT '16:30:00', N'16:30'
    UNION ALL SELECT '17:00:00', N'17:00'
    UNION ALL SELECT '17:30:00', N'17:30'
    UNION ALL SELECT '18:00:00', N'18:00'
    UNION ALL SELECT '18:30:00', N'18:30'
    UNION ALL SELECT '19:00:00', N'19:00'
    UNION ALL SELECT '19:30:00', N'19:30'
    UNION ALL SELECT '20:00:00', N'20:00'
    UNION ALL SELECT '20:30:00', N'20:30'
    UNION ALL SELECT '21:00:00', N'21:00'
);

PRINT N'已創建時段列表函數';

-- 7. 插入測試資料 (可選)
-- 這裡可以插入一些測試資料來驗證系統

PRINT N'=== 短期班排課系統建立完成 ===';
PRINT N'- 已建立 short_term_schedules 資料表';
PRINT N'- 已建立相關索引和觸發器';
PRINT N'- 已建立查詢視圖和輔助函數';
PRINT N'- 支援 9:00-21:00 每半小時的時段';
PRINT N'- 支援以週為單位的排課管理'; 