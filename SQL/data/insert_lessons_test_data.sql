-- 課程管理系統 - 測試課程資料插入語法
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：將測試的課程資訊新增到現有的 lessons 資料表中

-- 1. 先確認 lessons 資料表是否存在
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[lessons]') AND type in (N'U'))
BEGIN
    -- 如果不存在則創建 lessons 資料表
    CREATE TABLE [dbo].[lessons] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [student_id] INT NOT NULL,                  -- 學生ID (外鍵)
        [lesson_date] DATE NOT NULL,                -- 課程日期
        [lesson_time] TIME NOT NULL,                -- 課程時間
        [duration_minutes] INT NOT NULL,            -- 課程時長（分鐘）
        [lesson_type] NVARCHAR(10) NOT NULL,        -- 課程類型：physical, online
        [status] NVARCHAR(20) NOT NULL,             -- 課程狀態：normal, rescheduled, cancelled, completed
        [notes] NTEXT NULL,                         -- 備註
        [teacher_id] INT NULL,                      -- 授課老師ID (可選)
        [subject] NVARCHAR(100) NULL,               -- 課程科目 (可選)
        [classroom] NVARCHAR(50) NULL,              -- 教室 (可選)
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- 約束條件
        CONSTRAINT [CHK_lessons_lesson_type] CHECK ([lesson_type] IN ('physical', 'online')),
        CONSTRAINT [CHK_lessons_status] CHECK ([status] IN ('normal', 'rescheduled', 'cancelled', 'completed')),
        CONSTRAINT [CHK_lessons_duration] CHECK ([duration_minutes] > 0)
    );
    
    -- 創建索引
    CREATE NONCLUSTERED INDEX [IX_lessons_student_id] ON [dbo].[lessons] ([student_id]);
    CREATE NONCLUSTERED INDEX [IX_lessons_date] ON [dbo].[lessons] ([lesson_date]);
    CREATE NONCLUSTERED INDEX [IX_lessons_date_time] ON [dbo].[lessons] ([lesson_date], [lesson_time]);
    CREATE NONCLUSTERED INDEX [IX_lessons_status] ON [dbo].[lessons] ([status]);
    CREATE NONCLUSTERED INDEX [IX_lessons_type] ON [dbo].[lessons] ([lesson_type]);
    
    PRINT N'已創建 lessons 資料表';
END
ELSE
BEGIN
    PRINT N'lessons 資料表已存在，準備插入測試資料';
END
GO

-- 2. 清空現有測試資料 (可選，如果需要重新開始)
-- DELETE FROM [dbo].[lessons] WHERE notes LIKE N'%測試資料%';
-- PRINT N'已清空舊的測試資料';

-- 3. 確認學生資料存在 (取得可用的學生ID)
DECLARE @available_students TABLE (student_id INT, student_name NVARCHAR(100));

INSERT INTO @available_students (student_id, student_name)
SELECT id, chinese_name 
FROM [dbo].[students] 
WHERE is_active = 1 OR is_active IS NULL
ORDER BY id;

-- 檢查是否有可用學生
IF NOT EXISTS (SELECT 1 FROM @available_students)
BEGIN
    PRINT N'警告：沒有找到可用的學生資料，請先建立學生資料表！';
    RETURN;
END

-- 4. 插入豐富的測試課程資料
-- 為接下來的兩週創建各種類型的課程

DECLARE @today DATE = CAST(GETDATE() AS DATE);
DECLARE @student_count INT;
SELECT @student_count = COUNT(*) FROM @available_students;

PRINT N'開始插入測試課程資料...';
PRINT N'可用學生數量：' + CAST(@student_count AS NVARCHAR(10));

-- 課程資料插入
INSERT INTO [dbo].[lessons] (
    [student_id], [lesson_date], [lesson_time], [duration_minutes], 
    [lesson_type], [status], [subject], [classroom], [notes]
) VALUES

-- === 本週課程 (週一到週日) ===

-- 週一課程
(1, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '09:00:00', 90, 'physical', 'normal', 
 N'Python基礎', N'A101', N'測試資料 - Python程式設計入門'),

(2, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'JavaScript入門', NULL, N'測試資料 - 線上JavaScript課程'),

(3, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '19:00:00', 120, 'physical', 'normal', 
 N'Java進階', N'B203', N'測試資料 - Java物件導向程式設計'),

-- 週二課程
(1, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '10:30:00', 90, 'physical', 'completed', 
 N'Python進階', N'A101', N'測試資料 - 已完成的Python課程'),

(4, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '15:00:00', 60, 'online', 'normal', 
 N'UI/UX設計', NULL, N'測試資料 - 使用者介面設計'),

(2, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '20:00:00', 90, 'physical', 'normal', 
 N'React開發', N'A102', N'測試資料 - React框架開發'),

-- 週三課程
(5, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '09:30:00', 60, 'physical', 'rescheduled', 
 N'資料庫設計', N'C301', N'測試資料 - 已調課的資料庫課程'),

(3, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '16:00:00', 120, 'online', 'normal', 
 N'機器學習', NULL, N'測試資料 - 人工智慧與機器學習'),

(6, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '19:30:00', 90, 'physical', 'normal', 
 N'C++程式設計', N'B201', N'測試資料 - C++語言基礎'),

-- 週四課程
(4, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '11:00:00', 60, 'online', 'cancelled', 
 N'平面設計', NULL, N'測試資料 - 學生請假取消'),

(7, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '14:30:00', 90, 'physical', 'normal', 
 N'DevOps實務', N'C302', N'測試資料 - 雲端部署與維運'),

(1, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '18:00:00', 60, 'physical', 'normal', 
 N'演算法設計', N'A103', N'測試資料 - 資料結構與演算法'),

-- 週五課程
(8, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '10:00:00', 120, 'physical', 'normal', 
 N'iOS開發', N'B202', N'測試資料 - Swift語言與iOS應用'),

(2, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '15:30:00', 90, 'online', 'normal', 
 N'Node.js後端', NULL, N'測試資料 - 伺服器端JavaScript'),

(5, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '19:00:00', 60, 'physical', 'normal', 
 N'SQL資料庫', N'C303', N'測試資料 - 關聯式資料庫管理'),

-- 週六課程 (較多課程)
(3, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '09:00:00', 120, 'physical', 'normal', 
 N'軟體工程', N'A104', N'測試資料 - 系統分析與設計'),

(6, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '11:30:00', 90, 'physical', 'normal', 
 N'遊戲開發', N'B203', N'測試資料 - Unity遊戲引擎'),

(4, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'Figma設計', NULL, N'測試資料 - 介面原型設計'),

(7, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '16:30:00', 90, 'physical', 'normal', 
 N'Docker容器', N'C301', N'測試資料 - 容器化部署技術'),

(1, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '19:00:00', 60, 'physical', 'normal', 
 N'網頁爬蟲', N'A101', N'測試資料 - Python網頁資料擷取'),

-- 週日課程
(8, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '10:00:00', 90, 'online', 'normal', 
 N'SwiftUI', NULL, N'測試資料 - 現代iOS界面開發'),

(2, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '14:30:00', 120, 'physical', 'normal', 
 N'全端開發', N'A102', N'測試資料 - 前後端整合專案'),

(5, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '17:00:00', 60, 'physical', 'normal', 
 N'NoSQL資料庫', N'C302', N'測試資料 - MongoDB與Redis'),

-- === 下週課程 (週一到週日) ===

-- 下週一
(3, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '09:30:00', 90, 'physical', 'normal', 
 N'微服務架構', N'B201', N'測試資料 - 分散式系統設計'),

(6, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '15:00:00', 60, 'online', 'normal', 
 N'Unreal Engine', NULL, N'測試資料 - 3D遊戲開發引擎'),

(4, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '20:00:00', 90, 'physical', 'normal', 
 N'Adobe Illustrator', N'A103', N'測試資料 - 向量圖形設計'),

-- 下週二
(7, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '11:00:00', 120, 'physical', 'normal', 
 N'Kubernetes', N'C303', N'測試資料 - 容器編排管理'),

(1, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '16:30:00', 60, 'online', 'normal', 
 N'TensorFlow', NULL, N'測試資料 - 深度學習框架'),

(8, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '19:00:00', 90, 'physical', 'normal', 
 N'Xcode開發', N'B202', N'測試資料 - iOS開發環境'),

-- 下週三
(2, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '10:00:00', 90, 'physical', 'normal', 
 N'GraphQL API', N'A104', N'測試資料 - 現代API查詢語言'),

(5, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'PostgreSQL', NULL, N'測試資料 - 進階資料庫功能'),

(3, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '18:30:00', 120, 'physical', 'normal', 
 N'區塊鏈技術', N'C301', N'測試資料 - 分散式帳本技術'),

-- 下週四
(6, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '09:00:00', 60, 'physical', 'normal', 
 N'Blender 3D', N'B203', N'測試資料 - 3D建模與動畫'),

(4, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '15:30:00', 90, 'online', 'normal', 
 N'Photoshop進階', NULL, N'測試資料 - 影像後製技巧'),

(7, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '19:30:00', 60, 'physical', 'normal', 
 N'CI/CD流程', N'C302', N'測試資料 - 持續整合與部署'),

-- 下週五
(1, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '11:30:00', 90, 'physical', 'normal', 
 N'FastAPI', N'A101', N'測試資料 - Python高效能API'),

(8, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '16:00:00', 60, 'online', 'normal', 
 N'App Store上架', NULL, N'測試資料 - iOS應用發布流程'),

(2, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '20:00:00', 120, 'physical', 'normal', 
 N'Vue.js專案', N'A102', N'測試資料 - 前端框架實戰');

-- 5. 插入課程統計報告
DECLARE @inserted_count INT;
SELECT @inserted_count = @@ROWCOUNT;

PRINT N'測試課程資料插入完成！';
PRINT N'總共插入了 ' + CAST(@inserted_count AS NVARCHAR(10)) + N' 筆課程記錄';

-- 6. 創建課程統計查詢視圖
CREATE OR ALTER VIEW [dbo].[view_lessons_summary] AS
SELECT 
    l.[id],
    s.[chinese_name] as [學生姓名],
    l.[lesson_date] as [課程日期],
    FORMAT(l.[lesson_time], 'HH:mm') as [課程時間],
    l.[duration_minutes] as [時長分鐘],
    CASE l.[lesson_type]
        WHEN 'physical' THEN N'實體課'
        WHEN 'online' THEN N'線上課'
        ELSE l.[lesson_type]
    END as [課程類型],
    CASE l.[status]
        WHEN 'normal' THEN N'正常'
        WHEN 'completed' THEN N'已完成'
        WHEN 'cancelled' THEN N'已取消'
        WHEN 'rescheduled' THEN N'已調課'
        ELSE l.[status]
    END as [課程狀態],
    l.[subject] as [課程科目],
    l.[classroom] as [教室],
    l.[notes] as [備註],
    l.[created_at] as [建立時間]
FROM [dbo].[lessons] l
LEFT JOIN [dbo].[students] s ON l.[student_id] = s.[id];
GO

-- 7. 統計查詢範例

-- 7.1 查看所有測試課程
SELECT * FROM [dbo].[view_lessons_summary] 
WHERE [備註] LIKE N'%測試資料%'
ORDER BY [課程日期], [課程時間];

-- 7.2 按課程狀態統計
SELECT 
    [課程狀態],
    COUNT(*) as [課程數量]
FROM [dbo].[view_lessons_summary]
WHERE [備註] LIKE N'%測試資料%'
GROUP BY [課程狀態]
ORDER BY COUNT(*) DESC;

-- 7.3 按課程類型統計
SELECT 
    [課程類型],
    COUNT(*) as [課程數量],
    AVG([時長分鐘]) as [平均時長]
FROM [dbo].[view_lessons_summary]
WHERE [備註] LIKE N'%測試資料%'
GROUP BY [課程類型];

-- 7.4 按學生統計課程數量
SELECT 
    [學生姓名],
    COUNT(*) as [課程總數],
    SUM(CASE WHEN [課程狀態] = N'正常' THEN 1 ELSE 0 END) as [正常課程],
    SUM(CASE WHEN [課程狀態] = N'已完成' THEN 1 ELSE 0 END) as [已完成課程],
    SUM([時長分鐘]) as [總時長分鐘]
FROM [dbo].[view_lessons_summary]
WHERE [備註] LIKE N'%測試資料%'
GROUP BY [學生姓名]
ORDER BY COUNT(*) DESC;

-- 7.5 按日期統計每日課程數
SELECT 
    [課程日期],
    DATENAME(weekday, [課程日期]) as [星期],
    COUNT(*) as [當日課程數],
    SUM([時長分鐘]) as [當日總時長]
FROM [dbo].[view_lessons_summary]
WHERE [備註] LIKE N'%測試資料%'
GROUP BY [課程日期]
ORDER BY [課程日期];

-- 7.6 查看本週課程安排
SELECT 
    [學生姓名],
    [課程日期],
    [課程時間],
    [課程科目],
    [教室],
    [課程狀態]
FROM [dbo].[view_lessons_summary]
WHERE [課程日期] BETWEEN 
    DATEADD(day, 1 - DATEPART(weekday, GETDATE()), CAST(GETDATE() AS DATE)) AND
    DATEADD(day, 7 - DATEPART(weekday, GETDATE()), CAST(GETDATE() AS DATE))
AND [備註] LIKE N'%測試資料%'
ORDER BY [課程日期], [課程時間];

-- 7.7 查看特定學生的課程
DECLARE @student_name NVARCHAR(50) = N'王小明';  -- 可修改學生姓名
SELECT * FROM [dbo].[view_lessons_summary] 
WHERE [學生姓名] = @student_name 
AND [備註] LIKE N'%測試資料%'
ORDER BY [課程日期], [課程時間];

-- 7.8 查看熱門課程科目
SELECT 
    [課程科目],
    COUNT(*) as [開課次數],
    COUNT(DISTINCT [學生姓名]) as [學生人數]
FROM [dbo].[view_lessons_summary]
WHERE [備註] LIKE N'%測試資料%'
AND [課程科目] IS NOT NULL
GROUP BY [課程科目]
ORDER BY COUNT(*) DESC;

PRINT N'課程測試資料建立完成！';
PRINT N'- 已插入豐富的測試課程資料（包含本週和下週）';
PRINT N'- 已創建 view_lessons_summary 查詢視圖';
PRINT N'- 包含各種課程狀態：正常、已完成、已取消、已調課';
PRINT N'- 包含實體課和線上課兩種類型';
PRINT N'- 可使用各種統計查詢來分析課程資料'; 