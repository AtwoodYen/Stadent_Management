-- 課程管理系統 - 課程資料表建立語法
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：建立完整的課程管理資料表，支援課程分類、難度、價格等功能

-- 1. 創建課程資料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[courses] (
        [id] INT PRIMARY KEY IDENTITY(1,1),
        [name] NVARCHAR(200) NOT NULL,
        [category] NVARCHAR(100) NOT NULL,
        [level] NVARCHAR(20) NOT NULL,
        [duration_minutes] INT NOT NULL DEFAULT 90,
        [price] DECIMAL(10,2) NOT NULL DEFAULT 0,
        [description] NVARCHAR(1000),
        [prerequisites] NVARCHAR(500),
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [created_by] INT,
        [updated_by] INT
    );

    -- 建立檢查約束
    ALTER TABLE [dbo].[courses] ADD 
        CONSTRAINT [CHK_courses_level] CHECK ([level] IN (N'初級', N'中級', N'高級')),
        CONSTRAINT [CHK_courses_duration] CHECK ([duration_minutes] > 0),
        CONSTRAINT [CHK_courses_price] CHECK ([price] >= 0);

    -- 建立索引
    CREATE NONCLUSTERED INDEX [IX_courses_category] ON [dbo].[courses] ([category]);
    CREATE NONCLUSTERED INDEX [IX_courses_level] ON [dbo].[courses] ([level]);
    CREATE NONCLUSTERED INDEX [IX_courses_active] ON [dbo].[courses] ([is_active]);
    CREATE NONCLUSTERED INDEX [IX_courses_category_level] ON [dbo].[courses] ([category], [level]);
    CREATE NONCLUSTERED INDEX [IX_courses_price] ON [dbo].[courses] ([price]);

    PRINT N'已創建 courses 資料表';
END
ELSE
BEGIN
    PRINT N'courses 資料表已存在';
END

-- 2. 創建課程更新時間觸發器
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_courses_update_timestamp')
BEGIN
    EXEC('
    CREATE TRIGGER [dbo].[TR_courses_update_timestamp]
    ON [dbo].[courses]
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE [dbo].[courses]
        SET [updated_at] = GETDATE()
        FROM [dbo].[courses] c
        INNER JOIN inserted i ON c.[id] = i.[id];
    END
    ');
    PRINT N'已創建課程更新時間觸發器';
END

-- 3. 插入測試課程資料
DELETE FROM [dbo].[courses];
DBCC CHECKIDENT ('courses', RESEED, 0);

INSERT INTO [dbo].[courses] (
    [name], [category], [level], [duration_minutes], [price], [description], [prerequisites]
) VALUES

-- Python 相關課程
(N'Python 基礎程式設計', N'Python', N'初級', 90, 1200, 
 N'學習 Python 基本語法、變數、迴圈、函數等基礎概念，適合程式設計新手', N''),

(N'Python 進階應用', N'Python', N'中級', 120, 1500, 
 N'深入學習 Python 物件導向程式設計、模組化開發、例外處理等進階技巧', N'Python 基礎程式設計'),

(N'Python 資料科學入門', N'資料科學', N'中級', 120, 1800, 
 N'使用 NumPy、Pandas、Matplotlib 進行資料分析與視覺化', N'Python 基礎程式設計'),

(N'Python 網頁爬蟲技術', N'Python', N'中級', 90, 1600, 
 N'學習使用 Requests、BeautifulSoup、Selenium 進行網頁資料擷取', N'Python 基礎程式設計'),

-- Web 開發相關課程
(N'HTML/CSS 基礎', N'Web開發', N'初級', 90, 1000, 
 N'學習網頁結構標記語言 HTML 和樣式表 CSS 的基本用法', N''),

(N'JavaScript 基礎程式設計', N'JavaScript', N'初級', 90, 1200, 
 N'學習 JavaScript 基本語法、DOM 操作、事件處理等前端開發基礎', N'HTML/CSS 基礎'),

(N'React 前端框架開發', N'Web開發', N'中級', 120, 1800, 
 N'學習 React 元件開發、狀態管理、路由、Hooks 等現代前端開發技術', N'JavaScript 基礎程式設計'),

(N'Vue.js 前端框架實戰', N'Web開發', N'中級', 120, 1700, 
 N'學習 Vue.js 漸進式框架開發單頁面應用程式', N'JavaScript 基礎程式設計'),

(N'Node.js 後端開發', N'Web開發', N'中級', 120, 1600, 
 N'學習使用 Node.js 和 Express 框架建立後端 API 服務', N'JavaScript 基礎程式設計'),

-- 資料庫相關課程
(N'SQL 關聯式資料庫基礎', N'資料庫', N'初級', 90, 1300, 
 N'學習 SQL 查詢語法、資料庫設計原理、正規化等基礎概念', N''),

(N'SQL Server 進階管理', N'資料庫', N'中級', 120, 1700, 
 N'深入學習 SQL Server 效能調校、備份還原、安全性管理', N'SQL 關聯式資料庫基礎'),

(N'NoSQL 資料庫應用', N'資料庫', N'中級', 90, 1500, 
 N'學習 MongoDB、Redis 等 NoSQL 資料庫的應用場景與操作', N'SQL 關聯式資料庫基礎'),

-- 演算法與資料結構
(N'資料結構基礎', N'演算法', N'中級', 90, 1400, 
 N'學習陣列、鏈結串列、堆疊、佇列等基本資料結構', N'Python 基礎程式設計'),

(N'演算法設計與分析', N'演算法', N'高級', 120, 2000, 
 N'深入學習排序、搜尋、動態規劃、圖形演算法等進階演算法', N'資料結構基礎'),

-- 行動應用開發
(N'Swift iOS 應用開發基礎', N'iOS開發', N'初級', 120, 1800, 
 N'學習 Swift 語言和 iOS 應用程式開發基礎', N''),

(N'SwiftUI 現代界面開發', N'iOS開發', N'中級', 120, 2000, 
 N'使用 SwiftUI 建立現代化 iOS 使用者介面', N'Swift iOS 應用開發基礎'),

(N'Android Kotlin 開發', N'Android開發', N'初級', 120, 1800, 
 N'學習 Kotlin 語言和 Android 應用程式開發', N''),

-- 設計相關課程
(N'UI/UX 設計基礎', N'設計', N'初級', 90, 1400, 
 N'學習使用者介面和使用者體驗設計原理與實踐', N''),

(N'Figma 介面原型設計', N'設計', N'初級', 90, 1200, 
 N'使用 Figma 工具進行網頁和行動應用介面設計', N'UI/UX 設計基礎'),

(N'Adobe Photoshop 影像處理', N'設計', N'初級', 90, 1300, 
 N'學習專業影像編輯和後製技巧', N''),

-- 雲端與 DevOps
(N'Docker 容器化技術', N'DevOps', N'中級', 90, 1600, 
 N'學習容器化部署和 Docker 技術應用', N''),

(N'Kubernetes 容器編排', N'DevOps', N'高級', 120, 2200, 
 N'學習大規模容器化應用的編排和管理', N'Docker 容器化技術'),

(N'AWS 雲端服務入門', N'雲端技術', N'中級', 120, 1900, 
 N'學習 Amazon Web Services 雲端平台基礎服務', N''),

-- 人工智慧與機器學習
(N'機器學習基礎', N'機器學習', N'中級', 120, 2000, 
 N'學習機器學習基本概念、監督式學習、非監督式學習', N'Python 資料科學入門'),

(N'深度學習與神經網路', N'機器學習', N'高級', 150, 2500, 
 N'學習深度學習框架 TensorFlow、Keras，建立神經網路模型', N'機器學習基礎'),

-- 遊戲開發
(N'Unity 2D 遊戲開發', N'遊戲開發', N'初級', 120, 1700, 
 N'使用 Unity 引擎開發 2D 遊戲，學習基礎遊戲設計概念', N''),

(N'Unity 3D 遊戲開發', N'遊戲開發', N'中級', 150, 2100, 
 N'進階 Unity 3D 遊戲開發技術和遊戲物理引擎', N'Unity 2D 遊戲開發'),

(N'Unreal Engine 遊戲開發', N'遊戲開發', N'高級', 150, 2300, 
 N'學習 Unreal Engine 引擎進行高品質 3D 遊戲開發', N'Unity 3D 遊戲開發');

-- 4. 統計插入結果
DECLARE @course_count INT;
SELECT @course_count = COUNT(*) FROM [dbo].[courses];
PRINT N'已插入 ' + CAST(@course_count AS NVARCHAR(10)) + N' 筆課程資料';

-- 5. 創建課程查詢視圖
CREATE OR ALTER VIEW [dbo].[view_courses_summary] AS
SELECT 
    c.[id],
    c.[name] as [課程名稱],
    c.[category] as [課程分類],
    c.[level] as [難度等級],
    c.[duration_minutes] as [時長分鐘],
    c.[price] as [課程價格],
    c.[description] as [課程描述],
    c.[prerequisites] as [先修課程],
    CASE c.[is_active] 
        WHEN 1 THEN N'啟用' 
        ELSE N'停用' 
    END as [狀態],
    c.[created_at] as [建立時間],
    c.[updated_at] as [更新時間]
FROM [dbo].[courses] c
WHERE c.[is_active] = 1;

-- 6. 範例查詢
PRINT N'=== 課程資料建立完成 ===';

-- 6.1 查看所有課程
PRINT N'--- 所有課程列表 ---';
SELECT TOP 10 * FROM [dbo].[view_courses_summary] ORDER BY [課程分類], [難度等級];

-- 6.2 按分類統計課程數量
PRINT N'--- 按分類統計課程數量 ---';
SELECT 
    [課程分類],
    COUNT(*) as [課程數量],
    AVG([課程價格]) as [平均價格],
    MIN([課程價格]) as [最低價格],
    MAX([課程價格]) as [最高價格]
FROM [dbo].[view_courses_summary]
GROUP BY [課程分類]
ORDER BY COUNT(*) DESC;

-- 6.3 按難度統計課程數量
PRINT N'--- 按難度統計課程數量 ---';
SELECT 
    [難度等級],
    COUNT(*) as [課程數量],
    AVG([課程價格]) as [平均價格],
    AVG([時長分鐘]) as [平均時長]
FROM [dbo].[view_courses_summary]
GROUP BY [難度等級]
ORDER BY 
    CASE [難度等級] 
        WHEN N'初級' THEN 1 
        WHEN N'中級' THEN 2 
        WHEN N'高級' THEN 3 
    END;

-- 6.4 查看需要先修課程的課程
PRINT N'--- 需要先修課程的課程 ---';
SELECT [課程名稱], [課程分類], [難度等級], [先修課程]
FROM [dbo].[view_courses_summary]
WHERE [先修課程] IS NOT NULL AND LEN([先修課程]) > 0
ORDER BY [課程分類], [難度等級];

PRINT N'';
PRINT N'課程管理系統建立完成！';
PRINT N'- 已建立 courses 資料表，包含完整的課程資訊';
PRINT N'- 已插入豐富的測試課程資料';
PRINT N'- 已創建 view_courses_summary 查詢視圖';
PRINT N'- 支援課程分類、難度等級、價格管理';
PRINT N'- 支援先修課程依賴關係';
PRINT N'';
PRINT N'常用查詢語法：';
PRINT N'SELECT * FROM view_courses_summary WHERE [課程分類] = N''Python'';';
PRINT N'SELECT * FROM view_courses_summary WHERE [難度等級] = N''初級'';'; 