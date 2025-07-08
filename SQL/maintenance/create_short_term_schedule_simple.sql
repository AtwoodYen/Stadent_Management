-- =====================================================
-- 短期班排課系統 - 簡化版資料表建立腳本 (MS SQL Server)
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

PRINT N'=== 短期班排課系統建立完成 ===';
PRINT N'- 已建立 short_term_schedules 資料表';
PRINT N'- 已建立相關索引和觸發器';
PRINT N'- 支援 9:00-21:00 每半小時的時段';
PRINT N'- 支援以週為單位的排課管理'; 