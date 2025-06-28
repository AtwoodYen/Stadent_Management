-- 學生課表分配系統 - 隨機分配上課時段
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：為每位學生隨機分配上課時段（星期幾、幾點開始）

-- 1. 創建學生課表資料表 (如果不存在)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[student_schedules]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[student_schedules] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [student_id] INT NOT NULL,
        [day_of_week] NVARCHAR(10) NOT NULL,        -- 星期幾
        [start_time] TIME NOT NULL,                 -- 開始時間
        [end_time] TIME NOT NULL,                   -- 結束時間
        [subject] NVARCHAR(50) NULL,                -- 科目
        [teacher_id] INT NULL,                      -- 師資ID (外鍵)
        [classroom] NVARCHAR(20) NULL,              -- 教室
        [is_active] BIT NOT NULL DEFAULT 1,         -- 是否啟用
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [notes] NVARCHAR(200) NULL,                 -- 備註
        
        -- 外鍵約束
        CONSTRAINT [FK_student_schedules_student_id] FOREIGN KEY ([student_id]) 
            REFERENCES [dbo].[students] ([id]) ON DELETE CASCADE,
        
        -- 檢查約束
        CONSTRAINT [CHK_student_schedules_day] CHECK ([day_of_week] IN (
            N'星期一', N'星期二', N'星期三', N'星期四', N'星期五', N'星期六', N'星期日'
        )),
        CONSTRAINT [CHK_student_schedules_time] CHECK ([start_time] < [end_time])
    );
    
    -- 創建索引
    CREATE NONCLUSTERED INDEX [IX_student_schedules_student_id] ON [dbo].[student_schedules] ([student_id]);
    CREATE NONCLUSTERED INDEX [IX_student_schedules_day_time] ON [dbo].[student_schedules] ([day_of_week], [start_time]);
    CREATE NONCLUSTERED INDEX [IX_student_schedules_teacher] ON [dbo].[student_schedules] ([teacher_id]);
    CREATE NONCLUSTERED INDEX [IX_student_schedules_active] ON [dbo].[student_schedules] ([is_active]);
    
    PRINT N'已創建 student_schedules 資料表';
END
ELSE
BEGIN
    PRINT N'student_schedules 資料表已存在';
END
GO

-- 2. 清空現有課表資料 (重新分配)
DELETE FROM [dbo].[student_schedules];
DBCC CHECKIDENT ('student_schedules', RESEED, 0);
PRINT N'已清空現有課表資料';
GO

-- 3. 定義可用的上課時段
DECLARE @available_slots TABLE (
    day_of_week NVARCHAR(10),
    start_time TIME,
    end_time TIME,
    time_slot_name NVARCHAR(20)
);

-- 插入平日時段 (週一到週五)
INSERT INTO @available_slots VALUES
-- 週一
(N'星期一', '09:00:00', '10:30:00', N'週一早上第1節'),
(N'星期一', '10:45:00', '12:15:00', N'週一早上第2節'),
(N'星期一', '13:30:00', '15:00:00', N'週一下午第1節'),
(N'星期一', '15:15:00', '16:45:00', N'週一下午第2節'),
(N'星期一', '19:00:00', '20:30:00', N'週一晚上第1節'),
(N'星期一', '20:45:00', '22:15:00', N'週一晚上第2節'),

-- 週二
(N'星期二', '09:00:00', '10:30:00', N'週二早上第1節'),
(N'星期二', '10:45:00', '12:15:00', N'週二早上第2節'),
(N'星期二', '13:30:00', '15:00:00', N'週二下午第1節'),
(N'星期二', '15:15:00', '16:45:00', N'週二下午第2節'),
(N'星期二', '19:00:00', '20:30:00', N'週二晚上第1節'),
(N'星期二', '20:45:00', '22:15:00', N'週二晚上第2節'),

-- 週三
(N'星期三', '09:00:00', '10:30:00', N'週三早上第1節'),
(N'星期三', '10:45:00', '12:15:00', N'週三早上第2節'),
(N'星期三', '13:30:00', '15:00:00', N'週三下午第1節'),
(N'星期三', '15:15:00', '16:45:00', N'週三下午第2節'),
(N'星期三', '19:00:00', '20:30:00', N'週三晚上第1節'),
(N'星期三', '20:45:00', '22:15:00', N'週三晚上第2節'),

-- 週四
(N'星期四', '09:00:00', '10:30:00', N'週四早上第1節'),
(N'星期四', '10:45:00', '12:15:00', N'週四早上第2節'),
(N'星期四', '13:30:00', '15:00:00', N'週四下午第1節'),
(N'星期四', '15:15:00', '16:45:00', N'週四下午第2節'),
(N'星期四', '19:00:00', '20:30:00', N'週四晚上第1節'),
(N'星期四', '20:45:00', '22:15:00', N'週四晚上第2節'),

-- 週五
(N'星期五', '09:00:00', '10:30:00', N'週五早上第1節'),
(N'星期五', '10:45:00', '12:15:00', N'週五早上第2節'),
(N'星期五', '13:30:00', '15:00:00', N'週五下午第1節'),
(N'星期五', '15:15:00', '16:45:00', N'週五下午第2節'),
(N'星期五', '19:00:00', '20:30:00', N'週五晚上第1節'),
(N'星期五', '20:45:00', '22:15:00', N'週五晚上第2節'),

-- 週六 (較多時段)
(N'星期六', '09:00:00', '10:30:00', N'週六早上第1節'),
(N'星期六', '10:45:00', '12:15:00', N'週六早上第2節'),
(N'星期六', '13:30:00', '15:00:00', N'週六下午第1節'),
(N'星期六', '15:15:00', '16:45:00', N'週六下午第2節'),
(N'星期六', '17:00:00', '18:30:00', N'週六下午第3節'),
(N'星期六', '19:00:00', '20:30:00', N'週六晚上第1節'),
(N'星期六', '20:45:00', '22:15:00', N'週六晚上第2節'),

-- 週日 (較多時段)
(N'星期日', '09:00:00', '10:30:00', N'週日早上第1節'),
(N'星期日', '10:45:00', '12:15:00', N'週日早上第2節'),
(N'星期日', '13:30:00', '15:00:00', N'週日下午第1節'),
(N'星期日', '15:15:00', '16:45:00', N'週日下午第2節'),
(N'星期日', '17:00:00', '18:30:00', N'週日下午第3節'),
(N'星期日', '19:00:00', '20:30:00', N'週日晚上第1節'),
(N'星期日', '20:45:00', '22:15:00', N'週日晚上第2節');

-- 4. 定義科目選項 (根據學生程度)
DECLARE @subjects TABLE (
    level_type NVARCHAR(10),
    subject_name NVARCHAR(50),
    weight INT  -- 權重：數字越大越容易被選中
);

INSERT INTO @subjects VALUES
-- 初級科目
(N'初級', N'程式設計基礎', 40),
(N'初級', N'電腦概論', 30),
(N'初級', N'網頁設計入門', 25),
(N'初級', N'辦公軟體應用', 20),
(N'初級', N'邏輯思維訓練', 15),

-- 中級科目
(N'中級', N'Python程式設計', 35),
(N'中級', N'JavaScript程式設計', 30),
(N'中級', N'網頁前端開發', 25),
(N'中級', N'資料庫設計', 20),
(N'中級', N'系統分析', 15),
(N'中級', N'UI/UX設計', 10),

-- 進階科目
(N'進階', N'高級程式設計', 35),
(N'進階', N'資料結構與演算法', 30),
(N'進階', N'軟體工程', 25),
(N'進階', N'人工智慧導論', 20),
(N'進階', N'機器學習', 15),
(N'進階', N'雲端技術', 10),
(N'進階', N'區塊鏈技術', 5);

-- 5. 為每位學生隨機分配時段和科目
DECLARE @student_id INT;
DECLARE @student_level NVARCHAR(10);
DECLARE @random_slot_row INT;
DECLARE @random_subject_row INT;
DECLARE @total_slots INT;
DECLARE @total_subjects INT;
DECLARE @selected_day NVARCHAR(10);
DECLARE @selected_start_time TIME;
DECLARE @selected_end_time TIME;
DECLARE @selected_subject NVARCHAR(50);
DECLARE @classroom NVARCHAR(20);

-- 取得時段和科目總數
SELECT @total_slots = COUNT(*) FROM @available_slots;

-- 游標：遍歷所有學生
DECLARE student_cursor CURSOR FOR
SELECT id, level_type FROM [dbo].[students] WHERE is_active = 1;

OPEN student_cursor;
FETCH NEXT FROM student_cursor INTO @student_id, @student_level;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- 取得該程度的科目總數
    SELECT @total_subjects = SUM(weight) FROM @subjects WHERE level_type = @student_level;
    
    -- 隨機選擇時段 (1到總時段數)
    SET @random_slot_row = ABS(CHECKSUM(NEWID())) % @total_slots + 1;
    
    -- 根據權重隨機選擇科目
    SET @random_subject_row = ABS(CHECKSUM(NEWID())) % @total_subjects + 1;
    
    -- 取得選中的時段
    WITH numbered_slots AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY day_of_week, start_time) as rn
        FROM @available_slots
    )
    SELECT 
        @selected_day = day_of_week,
        @selected_start_time = start_time,
        @selected_end_time = end_time
    FROM numbered_slots 
    WHERE rn = @random_slot_row;
    
    -- 取得選中的科目 (根據權重)
    WITH weighted_subjects AS (
        SELECT *,
               SUM(weight) OVER (ORDER BY subject_name) as cumulative_weight
        FROM @subjects 
        WHERE level_type = @student_level
    )
    SELECT TOP 1 @selected_subject = subject_name
    FROM weighted_subjects
    WHERE cumulative_weight >= @random_subject_row
    ORDER BY cumulative_weight;
    
    -- 隨機分配教室 (A01-A10, B01-B10, C01-C05)
    DECLARE @classroom_prefix CHAR(1);
    DECLARE @classroom_number INT;
    
    SET @classroom_prefix = CASE ABS(CHECKSUM(NEWID())) % 3
        WHEN 0 THEN 'A'
        WHEN 1 THEN 'B'
        ELSE 'C'
    END;
    
    SET @classroom_number = CASE @classroom_prefix
        WHEN 'A' THEN ABS(CHECKSUM(NEWID())) % 10 + 1
        WHEN 'B' THEN ABS(CHECKSUM(NEWID())) % 10 + 1
        ELSE ABS(CHECKSUM(NEWID())) % 5 + 1
    END;
    
    SET @classroom = @classroom_prefix + RIGHT('0' + CAST(@classroom_number AS VARCHAR(2)), 2);
    
    -- 插入學生課表
    INSERT INTO [dbo].[student_schedules] (
        [student_id], [day_of_week], [start_time], [end_time], 
        [subject], [classroom], [is_active], [notes]
    ) VALUES (
        @student_id, @selected_day, @selected_start_time, @selected_end_time,
        @selected_subject, @classroom, 1, 
        N'系統自動分配 - ' + CONVERT(NVARCHAR(19), GETDATE(), 120)
    );
    
    FETCH NEXT FROM student_cursor INTO @student_id, @student_level;
END;

CLOSE student_cursor;
DEALLOCATE student_cursor;

PRINT N'學生課表隨機分配完成！';
GO

-- 6. 創建課表查詢視圖
CREATE OR ALTER VIEW [dbo].[view_student_schedule_summary] AS
SELECT 
    s.id as student_id,
    s.chinese_name as [學生姓名],
    s.english_name as [英文姓名],
    s.school as [學校],
    s.grade as [年級],
    s.level_type as [程度],
    s.class_type as [班別],
    ss.day_of_week as [上課星期],
    FORMAT(ss.start_time, 'HH:mm') + '-' + FORMAT(ss.end_time, 'HH:mm') as [上課時間],
    ss.subject as [科目],
    ss.classroom as [教室],
    ss.is_active as [狀態],
    ss.created_at as [分配時間],
    ss.notes as [備註]
FROM [dbo].[students] s
INNER JOIN [dbo].[student_schedules] ss ON s.id = ss.student_id
WHERE s.is_active = 1;
GO

-- 7. 課表衝突檢查視圖
CREATE OR ALTER VIEW [dbo].[view_schedule_conflicts] AS
SELECT 
    ss1.day_of_week as [衝突星期],
    ss1.start_time as [衝突開始時間],
    ss1.end_time as [衝突結束時間],
    ss1.classroom as [衝突教室],
    COUNT(*) as [衝突學生數],
    STRING_AGG(s.chinese_name, ', ') as [衝突學生名單]
FROM [dbo].[student_schedules] ss1
INNER JOIN [dbo].[students] s ON ss1.student_id = s.id
WHERE ss1.is_active = 1
GROUP BY ss1.day_of_week, ss1.start_time, ss1.end_time, ss1.classroom
HAVING COUNT(*) > 1;
GO

-- 8. 查詢範例和統計

-- 8.1 查看所有學生課表
SELECT * FROM [dbo].[view_student_schedule_summary] 
ORDER BY [上課星期], [上課時間], [學生姓名];

-- 8.2 檢查課表衝突
SELECT * FROM [dbo].[view_schedule_conflicts];

-- 8.3 按星期統計上課人數
SELECT 
    [上課星期],
    COUNT(*) as [學生人數]
FROM [dbo].[view_student_schedule_summary]
GROUP BY [上課星期]
ORDER BY 
    CASE [上課星期]
        WHEN N'星期一' THEN 1
        WHEN N'星期二' THEN 2
        WHEN N'星期三' THEN 3
        WHEN N'星期四' THEN 4
        WHEN N'星期五' THEN 5
        WHEN N'星期六' THEN 6
        WHEN N'星期日' THEN 7
    END;

-- 8.4 按時段統計上課人數
SELECT 
    [上課時間],
    COUNT(*) as [學生人數]
FROM [dbo].[view_student_schedule_summary]
GROUP BY [上課時間]
ORDER BY [上課時間];

-- 8.5 按科目統計
SELECT 
    [科目],
    COUNT(*) as [學生人數],
    STRING_AGG([學生姓名], ', ') as [學生名單]
FROM [dbo].[view_student_schedule_summary]
GROUP BY [科目]
ORDER BY COUNT(*) DESC;

-- 8.6 按教室統計使用率
SELECT 
    [教室],
    COUNT(*) as [使用次數],
    STRING_AGG([學生姓名] + '(' + [上課星期] + ' ' + [上課時間] + ')', ', ') as [使用詳情]
FROM [dbo].[view_student_schedule_summary]
GROUP BY [教室]
ORDER BY [教室];

-- 8.7 查詢特定學生的課表
DECLARE @student_name NVARCHAR(50) = N'王小明';  -- 可修改學生姓名
SELECT * FROM [dbo].[view_student_schedule_summary] 
WHERE [學生姓名] = @student_name;

-- 8.8 查詢週末課程
SELECT * FROM [dbo].[view_student_schedule_summary] 
WHERE [上課星期] IN (N'星期六', N'星期日')
ORDER BY [上課星期], [上課時間];

PRINT N'課表分配系統建立完成！';
PRINT N'- 已為所有學生隨機分配上課時段';
PRINT N'- 已創建課表查詢視圖和衝突檢查';
PRINT N'- 可使用 view_student_schedule_summary 查看完整課表';
PRINT N'- 可使用 view_schedule_conflicts 檢查時間衝突'; 