-- 課程管理系統 - 測試課程資料插入語法 (最終修正版)
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：將測試的課程資訊新增到現有的 lessons 資料表中

-- 1. 查看現有 lessons 資料表結構
SELECT 
    COLUMN_NAME as '欄位名稱',
    DATA_TYPE as '資料型別',
    IS_NULLABLE as '允許NULL',
    COLUMN_DEFAULT as '預設值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'lessons'
ORDER BY ORDINAL_POSITION;

PRINT N'=== 現有 lessons 資料表結構 ===';
GO

-- 2. 清空現有測試資料 (可選，如果需要重新開始)
-- DELETE FROM [dbo].[lessons] WHERE notes LIKE N'%測試資料%';
-- PRINT N'已清空舊的測試資料';

-- 3. 確認學生資料存在 (取得可用的學生ID)
DECLARE @available_students TABLE (student_id INT, student_name NVARCHAR(100));

INSERT INTO @available_students (student_id, student_name)
SELECT TOP 8 id, chinese_name 
FROM [dbo].[students] 
WHERE is_active = 1 OR is_active IS NULL
ORDER BY id;

-- 檢查是否有可用學生
IF NOT EXISTS (SELECT 1 FROM @available_students)
BEGIN
    PRINT N'警告：沒有找到可用的學生資料，請先建立學生資料表！';
    RETURN;
END

-- 4. 插入豐富的測試課程資料 (僅使用現有欄位)
-- 為接下來的兩週創建各種類型的課程

DECLARE @today DATE = CAST(GETDATE() AS DATE);
DECLARE @student_count INT;
SELECT @student_count = COUNT(*) FROM @available_students;

PRINT N'開始插入測試課程資料...';
PRINT N'可用學生數量：' + CAST(@student_count AS NVARCHAR(10));

-- 課程資料插入 (只使用 lessons 資料表現有的欄位)
INSERT INTO [dbo].[lessons] (
    [student_id], [lesson_date], [lesson_time], [duration_minutes], 
    [lesson_type], [status], [notes]
) VALUES

-- === 本週課程 (週一到週日) ===

-- 週一課程
(1, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '09:00:00', 90, 'physical', 'normal', 
 N'測試資料 - Python程式設計入門課程 - A101教室'),

(2, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'測試資料 - JavaScript入門線上課程'),

(3, DATEADD(day, 1 - DATEPART(weekday, @today), @today), '19:00:00', 120, 'physical', 'normal', 
 N'測試資料 - Java物件導向程式設計 - B203教室'),

-- 週二課程
(1, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '10:30:00', 90, 'physical', 'completed', 
 N'測試資料 - Python進階課程 - A101教室 - 已完成'),

(2, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '15:00:00', 60, 'online', 'normal', 
 N'測試資料 - UI/UX設計線上課程'),

(3, DATEADD(day, 2 - DATEPART(weekday, @today), @today), '20:00:00', 90, 'physical', 'normal', 
 N'測試資料 - React框架開發 - A102教室'),

-- 週三課程
(1, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '09:30:00', 60, 'physical', 'rescheduled', 
 N'測試資料 - 資料庫設計課程 - C301教室 - 已調課'),

(2, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '16:00:00', 120, 'online', 'normal', 
 N'測試資料 - 人工智慧與機器學習線上課程'),

(3, DATEADD(day, 3 - DATEPART(weekday, @today), @today), '19:30:00', 90, 'physical', 'normal', 
 N'測試資料 - C++語言基礎 - B201教室'),

-- 週四課程
(1, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '11:00:00', 60, 'online', 'cancelled', 
 N'測試資料 - 平面設計線上課程 - 學生請假取消'),

(2, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '14:30:00', 90, 'physical', 'normal', 
 N'測試資料 - DevOps雲端部署與維運 - C302教室'),

(3, DATEADD(day, 4 - DATEPART(weekday, @today), @today), '18:00:00', 60, 'physical', 'normal', 
 N'測試資料 - 資料結構與演算法 - A103教室'),

-- 週五課程
(1, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '10:00:00', 120, 'physical', 'normal', 
 N'測試資料 - Swift語言與iOS應用開發 - B202教室'),

(2, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '15:30:00', 90, 'online', 'normal', 
 N'測試資料 - Node.js伺服器端JavaScript線上課程'),

(3, DATEADD(day, 5 - DATEPART(weekday, @today), @today), '19:00:00', 60, 'physical', 'normal', 
 N'測試資料 - SQL關聯式資料庫管理 - C303教室'),

-- 週六課程 (較多課程)
(1, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '09:00:00', 120, 'physical', 'normal', 
 N'測試資料 - 軟體工程系統分析與設計 - A104教室'),

(2, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '11:30:00', 90, 'physical', 'normal', 
 N'測試資料 - Unity遊戲引擎開發 - B203教室'),

(3, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'測試資料 - Figma介面原型設計線上課程'),

(1, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '16:30:00', 90, 'physical', 'normal', 
 N'測試資料 - Docker容器化部署技術 - C301教室'),

(2, DATEADD(day, 6 - DATEPART(weekday, @today), @today), '19:00:00', 60, 'physical', 'normal', 
 N'測試資料 - Python網頁資料擷取爬蟲 - A101教室'),

-- 週日課程
(3, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '10:00:00', 90, 'online', 'normal', 
 N'測試資料 - SwiftUI現代iOS界面開發線上課程'),

(1, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '14:30:00', 120, 'physical', 'normal', 
 N'測試資料 - 全端開發前後端整合專案 - A102教室'),

(2, DATEADD(day, 7 - DATEPART(weekday, @today), @today), '17:00:00', 60, 'physical', 'normal', 
 N'測試資料 - NoSQL資料庫MongoDB與Redis - C302教室'),

-- === 下週課程 (週一到週日) ===

-- 下週一
(3, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '09:30:00', 90, 'physical', 'normal', 
 N'測試資料 - 微服務架構分散式系統設計 - B201教室'),

(1, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '15:00:00', 60, 'online', 'normal', 
 N'測試資料 - Unreal Engine 3D遊戲開發引擎線上課程'),

(2, DATEADD(day, 8 - DATEPART(weekday, @today), @today), '20:00:00', 90, 'physical', 'normal', 
 N'測試資料 - Adobe Illustrator向量圖形設計 - A103教室'),

-- 下週二
(3, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '11:00:00', 120, 'physical', 'normal', 
 N'測試資料 - Kubernetes容器編排管理 - C303教室'),

(1, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '16:30:00', 60, 'online', 'normal', 
 N'測試資料 - TensorFlow深度學習框架線上課程'),

(2, DATEADD(day, 9 - DATEPART(weekday, @today), @today), '19:00:00', 90, 'physical', 'normal', 
 N'測試資料 - Xcode iOS開發環境 - B202教室'),

-- 下週三
(3, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '10:00:00', 90, 'physical', 'normal', 
 N'測試資料 - GraphQL現代API查詢語言 - A104教室'),

(1, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '14:00:00', 60, 'online', 'normal', 
 N'測試資料 - PostgreSQL進階資料庫功能線上課程'),

(2, DATEADD(day, 10 - DATEPART(weekday, @today), @today), '18:30:00', 120, 'physical', 'normal', 
 N'測試資料 - 區塊鏈技術分散式帳本 - C301教室'),

-- 下週四
(3, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '09:00:00', 60, 'physical', 'normal', 
 N'測試資料 - Blender 3D建模與動畫 - B203教室'),

(1, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '15:30:00', 90, 'online', 'normal', 
 N'測試資料 - Photoshop影像後製技巧線上課程'),

(2, DATEADD(day, 11 - DATEPART(weekday, @today), @today), '19:30:00', 60, 'physical', 'normal', 
 N'測試資料 - CI/CD持續整合與部署 - C302教室'),

-- 下週五
(3, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '11:30:00', 90, 'physical', 'normal', 
 N'測試資料 - FastAPI Python高效能API - A101教室'),

(1, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '16:00:00', 60, 'online', 'normal', 
 N'測試資料 - App Store iOS應用發布流程線上課程'),

(2, DATEADD(day, 12 - DATEPART(weekday, @today), @today), '20:00:00', 120, 'physical', 'normal', 
 N'測試資料 - Vue.js前端框架實戰專案 - A102教室'),

-- 下週六
(3, DATEADD(day, 13 - DATEPART(weekday, @today), @today), '10:30:00', 90, 'physical', 'normal', 
 N'測試資料 - Spring Boot後端框架 - B201教室'),

(1, DATEADD(day, 13 - DATEPART(weekday, @today), @today), '15:00:00', 60, 'online', 'normal', 
 N'測試資料 - MySQL資料庫優化線上課程'),

(2, DATEADD(day, 13 - DATEPART(weekday, @today), @today), '18:00:00', 90, 'physical', 'normal', 
 N'測試資料 - 2D遊戲開發Cocos2d - B203教室'),

-- 下週日
(3, DATEADD(day, 14 - DATEPART(weekday, @today), @today), '11:00:00', 90, 'online', 'normal', 
 N'測試資料 - After Effects動態圖形設計線上課程'),

(1, DATEADD(day, 14 - DATEPART(weekday, @today), @today), '16:00:00', 60, 'physical', 'normal', 
 N'測試資料 - Linux系統管理 - C303教室');

-- 5. 插入課程統計報告
DECLARE @inserted_count INT;
SELECT @inserted_count = @@ROWCOUNT;

PRINT N'測試課程資料插入完成！';
PRINT N'總共插入了 ' + CAST(@inserted_count AS NVARCHAR(10)) + N' 筆課程記錄';
GO

-- 6. 創建課程統計查詢視圖 (使用現有欄位)
CREATE VIEW [dbo].[view_lessons_summary] AS
SELECT 
    l.[id],
    ISNULL(s.[chinese_name], N'未知學生') as [學生姓名],
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
    l.[notes] as [備註說明]
FROM [dbo].[lessons] l
LEFT JOIN [dbo].[students] s ON l.[student_id] = s.[id];
GO

-- 7. 統計查詢範例

-- 7.1 查看所有測試課程
PRINT N'=== 7.1 查看所有測試課程 ===';
SELECT TOP 10 * FROM [dbo].[view_lessons_summary] 
WHERE [備註說明] LIKE N'%測試資料%'
ORDER BY [課程日期], [課程時間];
GO

-- 7.2 按課程狀態統計
PRINT N'=== 7.2 按課程狀態統計 ===';
SELECT 
    [課程狀態],
    COUNT(*) as [課程數量]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY [課程狀態]
ORDER BY COUNT(*) DESC;
GO

-- 7.3 按課程類型統計
PRINT N'=== 7.3 按課程類型統計 ===';
SELECT 
    [課程類型],
    COUNT(*) as [課程數量],
    AVG([時長分鐘]) as [平均時長]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY [課程類型];
GO

-- 7.4 按學生統計課程數量
PRINT N'=== 7.4 按學生統計課程數量 ===';
SELECT 
    [學生姓名],
    COUNT(*) as [課程總數],
    SUM(CASE WHEN [課程狀態] = N'正常' THEN 1 ELSE 0 END) as [正常課程],
    SUM(CASE WHEN [課程狀態] = N'已完成' THEN 1 ELSE 0 END) as [已完成課程],
    SUM([時長分鐘]) as [總時長分鐘]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY [學生姓名]
ORDER BY COUNT(*) DESC;
GO

-- 7.5 按日期統計每日課程數
PRINT N'=== 7.5 按日期統計每日課程數 ===';
SELECT 
    [課程日期],
    DATENAME(weekday, [課程日期]) as [星期],
    COUNT(*) as [當日課程數],
    SUM([時長分鐘]) as [當日總時長]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY [課程日期]
ORDER BY [課程日期];
GO

-- 7.6 查看本週課程安排
PRINT N'=== 7.6 查看本週課程安排 ===';
SELECT 
    [學生姓名],
    [課程日期],
    [課程時間],
    [課程類型],
    [課程狀態],
    LEFT([備註說明], 50) + '...' as [課程簡述]
FROM [dbo].[view_lessons_summary]
WHERE [課程日期] BETWEEN 
    DATEADD(day, 1 - DATEPART(weekday, GETDATE()), CAST(GETDATE() AS DATE)) AND
    DATEADD(day, 7 - DATEPART(weekday, GETDATE()), CAST(GETDATE() AS DATE))
AND [備註說明] LIKE N'%測試資料%'
ORDER BY [課程日期], [課程時間];
GO

-- 7.7 從備註中提取課程科目統計
PRINT N'=== 7.7 從備註中提取課程科目統計 ===';
WITH course_subjects AS (
    SELECT 
        [學生姓名],
        [課程日期],
        [課程時間],
        CASE 
            WHEN [備註說明] LIKE N'%Python%' THEN N'Python'
            WHEN [備註說明] LIKE N'%JavaScript%' THEN N'JavaScript'
            WHEN [備註說明] LIKE N'%Java%' AND [備註說明] NOT LIKE N'%JavaScript%' THEN N'Java'
            WHEN [備註說明] LIKE N'%C++%' THEN N'C++'
            WHEN [備註說明] LIKE N'%Swift%' OR [備註說明] LIKE N'%iOS%' THEN N'iOS開發'
            WHEN [備註說明] LIKE N'%React%' THEN N'React'
            WHEN [備註說明] LIKE N'%Vue%' THEN N'Vue.js'
            WHEN [備註說明] LIKE N'%UI/UX%' OR [備註說明] LIKE N'%設計%' THEN N'設計'
            WHEN [備註說明] LIKE N'%資料庫%' OR [備註說明] LIKE N'%SQL%' THEN N'資料庫'
            WHEN [備註說明] LIKE N'%機器學習%' OR [備註說明] LIKE N'%AI%' OR [備註說明] LIKE N'%TensorFlow%' THEN N'AI/ML'
            WHEN [備註說明] LIKE N'%遊戲%' OR [備註說明] LIKE N'%Unity%' OR [備註說明] LIKE N'%Unreal%' THEN N'遊戲開發'
            WHEN [備註說明] LIKE N'%DevOps%' OR [備註說明] LIKE N'%Docker%' OR [備註說明] LIKE N'%Kubernetes%' THEN N'DevOps'
            ELSE N'其他'
        END as [課程科目]
    FROM [dbo].[view_lessons_summary]
    WHERE [備註說明] LIKE N'%測試資料%'
)
SELECT 
    [課程科目],
    COUNT(*) as [開課次數],
    COUNT(DISTINCT [學生姓名]) as [學生人數]
FROM course_subjects
GROUP BY [課程科目]
ORDER BY COUNT(*) DESC;
GO

-- 7.8 查詢課程密度最高的時段
PRINT N'=== 7.8 查詢課程密度最高的時段 ===';
SELECT 
    [課程時間],
    COUNT(*) as [課程數量],
    STRING_AGG([學生姓名], ', ') as [學生列表]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY [課程時間]
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
GO

-- 7.9 查詢週末課程統計
PRINT N'=== 7.9 查詢週末課程統計 ===';
SELECT 
    CASE 
        WHEN DATENAME(weekday, [課程日期]) = 'Saturday' THEN N'週六'
        WHEN DATENAME(weekday, [課程日期]) = 'Sunday' THEN N'週日'
        ELSE N'平日'
    END as [時段類型],
    COUNT(*) as [課程數量],
    AVG([時長分鐘]) as [平均時長],
    SUM([時長分鐘]) as [總時長]
FROM [dbo].[view_lessons_summary]
WHERE [備註說明] LIKE N'%測試資料%'
GROUP BY 
    CASE 
        WHEN DATENAME(weekday, [課程日期]) = 'Saturday' THEN N'週六'
        WHEN DATENAME(weekday, [課程日期]) = 'Sunday' THEN N'週日'
        ELSE N'平日'
    END
ORDER BY COUNT(*) DESC;
GO

PRINT N'課程測試資料建立完成！';
PRINT N'- 已插入豐富的測試課程資料（包含本週和下週）';
PRINT N'- 已創建 view_lessons_summary 查詢視圖（使用現有欄位）';
PRINT N'- 包含各種課程狀態：正常、已完成、已取消、已調課';
PRINT N'- 包含實體課和線上課兩種類型';
PRINT N'- 課程資訊儲存在備註欄位中，可透過查詢提取';
PRINT N'- 可使用各種統計查詢來分析課程資料';
PRINT N'';
PRINT N'常用查詢語法：';
PRINT N'SELECT * FROM view_lessons_summary WHERE [備註說明] LIKE N''%測試資料%'';'; 