-- =====================================================
-- 學生課程進度資料表建立腳本
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：記錄學生在各課程的能力程度，支援5個等級
-- =====================================================

-- 1. 創建學生課程進度資料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[student_course_progress]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[student_course_progress] (
        [id] INT PRIMARY KEY IDENTITY(1,1),
        [student_id] INT NOT NULL,
        [course_id] INT NOT NULL,
        [ability_level] NVARCHAR(10) NOT NULL,  -- 學生在該課程的能力程度：[新手][入門][進階][高階][精英]
        [progress_percentage] DECIMAL(5,2) DEFAULT 0,  -- 課程進度百分比 (0-100)
        [last_updated] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [notes] NVARCHAR(500),  -- 備註
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- 外鍵約束
        CONSTRAINT [FK_student_course_progress_student_id] 
            FOREIGN KEY ([student_id]) REFERENCES [dbo].[students]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_student_course_progress_course_id] 
            FOREIGN KEY ([course_id]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE,
        
        -- 檢查約束
        CONSTRAINT [CHK_student_course_progress_ability_level] 
            CHECK ([ability_level] IN (N'新手', N'入門', N'進階', N'高階', N'精英')),
        CONSTRAINT [CHK_student_course_progress_progress_percentage] 
            CHECK ([progress_percentage] >= 0 AND [progress_percentage] <= 100),
        
        -- 唯一約束：一個學生在一個課程只能有一筆記錄
        CONSTRAINT [UK_student_course_progress_student_course] 
            UNIQUE ([student_id], [course_id])
    );

    -- 建立索引
    CREATE NONCLUSTERED INDEX [IX_student_course_progress_student_id] ON [dbo].[student_course_progress] ([student_id]);
    CREATE NONCLUSTERED INDEX [IX_student_course_progress_course_id] ON [dbo].[student_course_progress] ([course_id]);
    CREATE NONCLUSTERED INDEX [IX_student_course_progress_ability_level] ON [dbo].[student_course_progress] ([ability_level]);
    CREATE NONCLUSTERED INDEX [IX_student_course_progress_active] ON [dbo].[student_course_progress] ([is_active]);

    PRINT N'已創建 student_course_progress 資料表';
END
ELSE
BEGIN
    PRINT N'student_course_progress 資料表已存在';
END

-- 2. 創建更新時間觸發器
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_student_course_progress_update_timestamp')
BEGIN
    EXEC('
    CREATE TRIGGER [dbo].[TR_student_course_progress_update_timestamp]
    ON [dbo].[student_course_progress]
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE [dbo].[student_course_progress]
        SET [updated_at] = GETDATE()
        FROM [dbo].[student_course_progress] scp
        INNER JOIN inserted i ON scp.[id] = i.[id];
    END
    ');
    PRINT N'已創建學生課程進度更新時間觸發器';
END

-- 3. 插入範例資料
-- 先清空現有資料
DELETE FROM [dbo].[student_course_progress];
DBCC CHECKIDENT ('student_course_progress', RESEED, 0);

-- 插入範例學生課程進度資料
INSERT INTO [dbo].[student_course_progress] (
    [student_id], [course_id], [ability_level], [progress_percentage], [notes]
) VALUES
-- 學生1 (王小明) 的課程進度
(1, 1, N'進階', 85.5, N'Python基礎掌握良好，可以進行進階學習'),
(1, 2, N'入門', 45.0, N'剛開始學習Python進階應用'),
(1, 5, N'新手', 20.0, N'HTML/CSS基礎學習中'),

-- 學生2 (李小華) 的課程進度
(2, 1, N'新手', 60.0, N'Python基礎學習中，需要更多練習'),
(2, 5, N'入門', 75.0, N'HTML/CSS基礎掌握不錯'),
(2, 6, N'新手', 30.0, N'JavaScript基礎學習中'),

-- 學生3 (張小美) 的課程進度
(3, 1, N'新手', 40.0, N'Python基礎學習中'),
(3, 5, N'新手', 50.0, N'HTML/CSS基礎學習中'),
(3, 10, N'新手', 25.0, N'SQL基礎學習中'),

-- 學生4 (陳大雄) 的課程進度
(4, 1, N'高階', 95.0, N'Python基礎完全掌握'),
(4, 2, N'進階', 80.0, N'Python進階應用學習中'),
(4, 3, N'入門', 65.0, N'資料科學入門學習中'),
(4, 13, N'新手', 35.0, N'資料結構基礎學習中'),

-- 學生5 (林小花) 的課程進度
(5, 1, N'入門', 70.0, N'Python基礎掌握不錯'),
(5, 5, N'進階', 90.0, N'HTML/CSS完全掌握'),
(5, 6, N'入門', 55.0, N'JavaScript基礎學習中'),

-- 學生6 (黃小龍) 的課程進度
(6, 1, N'新手', 35.0, N'Python基礎學習中'),
(6, 5, N'新手', 40.0, N'HTML/CSS基礎學習中'),

-- 學生7 (吳小鳳) 的課程進度
(7, 1, N'入門', 65.0, N'Python基礎掌握不錯'),
(7, 5, N'進階', 85.0, N'HTML/CSS掌握良好'),
(7, 6, N'新手', 45.0, N'JavaScript基礎學習中'),

-- 學生8 (劉小虎) 的課程進度
(8, 1, N'新手', 25.0, N'Python基礎學習中'),
(8, 5, N'新手', 30.0, N'HTML/CSS基礎學習中');

-- 4. 統計插入結果
DECLARE @progress_count INT;
SELECT @progress_count = COUNT(*) FROM [dbo].[student_course_progress];
PRINT N'已插入 ' + CAST(@progress_count AS NVARCHAR(10)) + N' 筆學生課程進度資料';

-- 5. 創建查詢視圖
CREATE OR ALTER VIEW [dbo].[view_student_course_progress] AS
SELECT 
    scp.[id],
    s.[chinese_name] as [學生姓名],
    s.[english_name] as [學生英文姓名],
    c.[name] as [課程名稱],
    c.[category] as [課程分類],
    c.[level] as [課程難度],
    scp.[ability_level] as [學生能力程度],
    scp.[progress_percentage] as [進度百分比],
    scp.[notes] as [備註],
    scp.[last_updated] as [最後更新時間],
    CASE scp.[is_active] 
        WHEN 1 THEN N'啟用' 
        ELSE N'停用' 
    END as [狀態]
FROM [dbo].[student_course_progress] scp
INNER JOIN [dbo].[students] s ON scp.[student_id] = s.[id]
INNER JOIN [dbo].[courses] c ON scp.[course_id] = c.[id]
WHERE scp.[is_active] = 1;

-- 6. 範例查詢
PRINT N'=== 學生課程進度資料建立完成 ===';

-- 6.1 查看所有學生課程進度
PRINT N'--- 所有學生課程進度 ---';
SELECT TOP 10 * FROM [dbo].[view_student_course_progress] ORDER BY [學生姓名], [課程分類];

-- 6.2 按學生統計課程進度
PRINT N'--- 按學生統計課程進度 ---';
SELECT 
    [學生姓名],
    COUNT(*) as [學習課程數],
    AVG([進度百分比]) as [平均進度],
    MAX([進度百分比]) as [最高進度],
    MIN([進度百分比]) as [最低進度]
FROM [dbo].[view_student_course_progress]
GROUP BY [學生姓名]
ORDER BY [平均進度] DESC;

-- 6.3 按課程分類統計學生能力分布
PRINT N'--- 按課程分類統計學生能力分布 ---';
SELECT 
    [課程分類],
    [學生能力程度],
    COUNT(*) as [學生人數],
    AVG([進度百分比]) as [平均進度]
FROM [dbo].[view_student_course_progress]
GROUP BY [課程分類], [學生能力程度]
ORDER BY [課程分類], 
    CASE [學生能力程度]
        WHEN N'新手' THEN 1
        WHEN N'入門' THEN 2
        WHEN N'進階' THEN 3
        WHEN N'高階' THEN 4
        WHEN N'精英' THEN 5
    END;

-- 6.4 查詢特定學生的課程進度
PRINT N'--- 王小明同學的課程進度 ---';
SELECT 
    [課程名稱],
    [課程難度],
    [學生能力程度],
    [進度百分比],
    [備註]
FROM [dbo].[view_student_course_progress]
WHERE [學生姓名] = N'王小明'
ORDER BY [進度百分比] DESC;

PRINT N'=== 學生課程進度資料表建立完成 ===';
PRINT N'1. 已建立 student_course_progress 資料表';
PRINT N'2. 已建立相關索引和約束';
PRINT N'3. 已插入範例資料';
PRINT N'4. 已建立查詢視圖';
PRINT N'5. 學生能力程度：新手、入門、進階、高階、精英';
PRINT N'6. 支援記錄學生在各課程的學習進度和能力程度'; 