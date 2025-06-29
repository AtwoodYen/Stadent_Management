-- 師資管理系統 - 測試資料插入語法
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：將 TeachersPage.tsx 中的測試老師資料插入到資料表

-- 1. 先創建師資資料表 (如果尚未存在)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[teachers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[teachers] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [email] NVARCHAR(100) NOT NULL UNIQUE,
        [phone] NVARCHAR(20) NULL,
        [specialties] NVARCHAR(500) NULL, -- JSON 格式儲存專長陣列
        [available_days] NVARCHAR(200) NULL, -- JSON 格式儲存可授課日
        [hourly_rate] DECIMAL(10,2) NOT NULL DEFAULT 0,
        [experience_years] INT NOT NULL DEFAULT 0,
        [bio] NVARCHAR(1000) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [avatar_url] NVARCHAR(255) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [created_by] INT NULL,
        [updated_by] INT NULL,
        
        -- 約束條件
        CONSTRAINT [CHK_teachers_email] CHECK ([email] LIKE '%@%'),
        CONSTRAINT [CHK_teachers_hourly_rate] CHECK ([hourly_rate] >= 0),
        CONSTRAINT [CHK_teachers_experience] CHECK ([experience_years] >= 0)
    );
    
    -- 創建索引
    CREATE NONCLUSTERED INDEX [IX_teachers_is_active] ON [dbo].[teachers] ([is_active]);
    CREATE NONCLUSTERED INDEX [IX_teachers_hourly_rate] ON [dbo].[teachers] ([hourly_rate]);
    CREATE NONCLUSTERED INDEX [IX_teachers_experience] ON [dbo].[teachers] ([experience_years]);
    
    PRINT N'已創建 teachers 資料表';
END
GO

-- 2. 創建師資課程能力資料表 (如果尚未存在)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[teacher_courses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[teacher_courses] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [teacher_id] INT NOT NULL,
        [course_category] NVARCHAR(100) NOT NULL,
        [max_level] NVARCHAR(50) NOT NULL,
        [is_preferred] BIT NOT NULL DEFAULT 0,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- 外鍵約束
        CONSTRAINT [FK_teacher_courses_teacher_id] FOREIGN KEY ([teacher_id]) 
            REFERENCES [dbo].[teachers] ([id]) ON DELETE CASCADE,
        
        -- 約束條件
        CONSTRAINT [CHK_teacher_courses_max_level] CHECK ([max_level] IN (N'初級', N'中級', N'高級')),
        
        -- 唯一約束 (同一老師不能有重複的課程分類)
        CONSTRAINT [UQ_teacher_courses] UNIQUE ([teacher_id], [course_category])
    );
    
    -- 創建索引
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_teacher_id] ON [dbo].[teacher_courses] ([teacher_id]);
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_category] ON [dbo].[teacher_courses] ([course_category]);
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_preferred] ON [dbo].[teacher_courses] ([is_preferred]);
    
    PRINT N'已創建 teacher_courses 資料表';
END
GO

-- 3. 清空現有測試資料 (如果需要重新插入)
DELETE FROM [dbo].[teacher_courses];
DELETE FROM [dbo].[teachers];
DBCC CHECKIDENT ('teachers', RESEED, 0);
DBCC CHECKIDENT ('teacher_courses', RESEED, 0);
GO

-- 4. 插入師資基本資料
INSERT INTO [dbo].[teachers] (
    [name], [email], [phone], [specialties], [available_days], 
    [hourly_rate], [experience_years], [bio], [is_active]
) VALUES 
-- 小剛老師
(N'小剛老師', 'gang@example.com', '0912-345-678',
 N'["Python", "Web開發", "演算法"]',
 N'["週一", "週二", "週三", "週四", "週五"]',
 1500.00, 5, 
 N'資深軟體工程師，專精於 Python 和 Web 開發，有豐富的教學經驗。', 1),

-- 小美老師  
(N'小美老師', 'mei@example.com', '0923-456-789',
 N'["JavaScript", "React", "Node.js"]',
 N'["週二", "週四", "週六", "週日"]',
 1400.00, 3,
 N'前端開發專家，熟悉現代 JavaScript 框架，善於引導學生理解複雜概念。', 1),

-- 阿明老師
(N'阿明老師', 'ming@example.com', '0934-567-890',
 N'["資料科學", "機器學習", "Python"]',
 N'["週三", "週五", "週六"]',
 1800.00, 7,
 N'資料科學博士，在機器學習領域有深厚造詣，教學風格嚴謹細緻。', 0),

-- 王老師
(N'王老師', 'wang@example.com', '0945-678-901',
 N'["Java", "Spring Boot", "資料庫設計"]',
 N'["週一", "週三", "週五", "週日"]',
 1600.00, 6,
 N'後端開發專家，專精於 Java 企業級應用開發，有豐富的系統架構經驗。', 1),

-- 李老師
(N'李老師', 'li@example.com', '0956-789-012',
 N'["UI/UX設計", "Figma", "Adobe Creative Suite"]',
 N'["週二", "週四", "週六"]',
 1300.00, 4,
 N'視覺設計師，擅長使用者體驗設計，能夠將複雜的設計概念簡化教學。', 1),

-- 陳老師
(N'陳老師', 'chen@example.com', '0967-890-123',
 N'["C++", "遊戲開發", "Unity"]',
 N'["週一", "週二", "週五", "週六"]',
 1700.00, 8,
 N'遊戲開發資深工程師，專精於 C++ 和 Unity 引擎，教學風格生動有趣。', 1),

-- 張老師
(N'張老師', 'zhang@example.com', '0978-901-234',
 N'["DevOps", "Docker", "Kubernetes", "AWS"]',
 N'["週三", "週四", "週日"]',
 2000.00, 9,
 N'DevOps 專家，在雲端部署和容器化技術方面有豐富經驗，注重實戰教學。', 1),

-- 林老師
(N'林老師', 'lin@example.com', '0989-012-345',
 N'["iOS開發", "Swift", "SwiftUI"]',
 N'["週一", "週四", "週六", "週日"]',
 1550.00, 5,
 N'iOS 開發專家，熟悉 Swift 和 SwiftUI，曾參與多個上架 App 的開發。', 1);
GO

-- 5. 插入師資課程能力資料
INSERT INTO [dbo].[teacher_courses] (
    [teacher_id], [course_category], [max_level], [is_preferred]
) VALUES 
-- 小剛老師 (teacher_id = 1)
(1, N'Python', N'高級', 1),
(1, N'Web開發', N'中級', 1),
(1, N'演算法', N'中級', 0),

-- 小美老師 (teacher_id = 2)
(2, N'JavaScript', N'高級', 1),
(2, N'Web開發', N'高級', 1),

-- 阿明老師 (teacher_id = 3)
(3, N'資料科學', N'高級', 1),
(3, N'機器學習', N'高級', 1),

-- 王老師 (teacher_id = 4)
(4, N'Java', N'高級', 1),
(4, N'資料庫設計', N'高級', 1),
(4, N'Web開發', N'中級', 0),

-- 李老師 (teacher_id = 5)
(5, N'UI/UX設計', N'高級', 1),
(5, N'平面設計', N'中級', 0),

-- 陳老師 (teacher_id = 6)
(6, N'C++', N'高級', 1),
(6, N'遊戲開發', N'高級', 1),
(6, N'演算法', N'中級', 0),

-- 張老師 (teacher_id = 7)
(7, N'DevOps', N'高級', 1),
(7, N'雲端技術', N'高級', 1),
(7, N'Linux', N'中級', 0),

-- 林老師 (teacher_id = 8)
(8, N'iOS開發', N'高級', 1),
(8, N'Swift', N'高級', 1),
(8, N'移動應用開發', N'中級', 0);
GO

-- 6. 創建查詢視圖方便檢視師資資料
CREATE OR ALTER VIEW [dbo].[view_teachers_summary] AS
SELECT 
    t.[id],
    t.[name],
    t.[email],
    t.[phone],
    t.[specialties],
    t.[available_days],
    t.[hourly_rate],
    t.[experience_years],
    t.[bio],
    t.[is_active],
    CASE t.[is_active]
        WHEN 1 THEN N'啟用'
        ELSE N'停用'
    END as [status_name],
    t.[created_at],
    t.[updated_at],
    -- 統計課程數量
    (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id]) as [total_courses],
    (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id] AND tc.[is_preferred] = 1) as [preferred_courses]
FROM [dbo].[teachers] t;
GO

-- 7. 創建詳細課程能力查詢視圖
CREATE OR ALTER VIEW [dbo].[view_teacher_courses_detail] AS
SELECT 
    t.[id] as [teacher_id],
    t.[name] as [teacher_name],
    t.[email],
    t.[is_active] as [teacher_active],
    tc.[course_category],
    tc.[max_level],
    tc.[is_preferred],
    CASE tc.[is_preferred]
        WHEN 1 THEN N'主要專長'
        ELSE N'次要專長'
    END as [preference_name],
    tc.[created_at] as [course_added_at]
FROM [dbo].[teachers] t
INNER JOIN [dbo].[teacher_courses] tc ON t.[id] = tc.[teacher_id];
GO

-- 8. 查詢範例

-- 查看所有師資摘要
SELECT * FROM [dbo].[view_teachers_summary] ORDER BY [hourly_rate] DESC;

-- 查看啟用的師資
SELECT * FROM [dbo].[view_teachers_summary] WHERE [is_active] = 1 ORDER BY [experience_years] DESC;

-- 查看師資課程能力詳細資料
SELECT * FROM [dbo].[view_teacher_courses_detail] ORDER BY [teacher_name], [is_preferred] DESC, [course_category];

-- 查詢特定課程的師資
SELECT DISTINCT 
    t.[name], t.[email], t.[hourly_rate], t.[experience_years],
    tc.[max_level], tc.[is_preferred]
FROM [dbo].[teachers] t
INNER JOIN [dbo].[teacher_courses] tc ON t.[id] = tc.[teacher_id]
WHERE tc.[course_category] = N'Web開發' AND t.[is_active] = 1
ORDER BY tc.[is_preferred] DESC, t.[hourly_rate];

-- 統計各課程分類的師資數量
SELECT 
    tc.[course_category],
    COUNT(*) as [total_teachers],
    SUM(CASE WHEN tc.[is_preferred] = 1 THEN 1 ELSE 0 END) as [preferred_teachers],
    AVG(t.[hourly_rate]) as [avg_hourly_rate],
    AVG(CAST(t.[experience_years] AS FLOAT)) as [avg_experience]
FROM [dbo].[teacher_courses] tc
INNER JOIN [dbo].[teachers] t ON tc.[teacher_id] = t.[id]
WHERE t.[is_active] = 1
GROUP BY tc.[course_category]
ORDER BY [total_teachers] DESC;

-- 查詢時薪範圍統計
SELECT 
    CASE 
        WHEN [hourly_rate] < 1400 THEN N'1400以下'
        WHEN [hourly_rate] >= 1400 AND [hourly_rate] < 1600 THEN N'1400-1599'
        WHEN [hourly_rate] >= 1600 AND [hourly_rate] < 1800 THEN N'1600-1799'
        ELSE N'1800以上'
    END as [rate_range],
    COUNT(*) as [teacher_count],
    AVG(CAST([experience_years] AS FLOAT)) as [avg_experience]
FROM [dbo].[teachers]
WHERE [is_active] = 1
GROUP BY 
    CASE 
        WHEN [hourly_rate] < 1400 THEN N'1400以下'
        WHEN [hourly_rate] >= 1400 AND [hourly_rate] < 1600 THEN N'1400-1599'
        WHEN [hourly_rate] >= 1600 AND [hourly_rate] < 1800 THEN N'1600-1799'
        ELSE N'1800以上'
    END
ORDER BY MIN([hourly_rate]);

-- 查詢可授課日統計
SELECT 
    [available_days],
    COUNT(*) as [teacher_count]
FROM [dbo].[teachers]
WHERE [is_active] = 1
GROUP BY [available_days]
ORDER BY [teacher_count] DESC;

PRINT N'師資測試資料插入完成！';
PRINT N'- 已插入 8 位師資的基本資料';
PRINT N'- 已插入 21 筆課程能力資料';
PRINT N'- 已創建查詢視圖和範例查詢';
PRINT N'- 可使用 view_teachers_summary 查看師資摘要';
PRINT N'- 可使用 view_teacher_courses_detail 查看課程能力詳細資料'; 