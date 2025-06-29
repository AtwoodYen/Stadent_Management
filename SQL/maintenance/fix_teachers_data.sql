-- 師資管理系統 - 修正版資料插入語法
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：修正欄位名稱問題並插入師資測試資料

-- 1. 先檢查現有的 teachers 資料表結構
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'teachers' 
ORDER BY ORDINAL_POSITION;

PRINT N'=== 現有 teachers 資料表結構 ===';
GO

-- 2. 檢查是否需要修改資料表結構
-- 如果欄位名稱是 'experience' 而不是 'experience_years'，我們需要調整

-- 檢查 experience 欄位是否存在
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'experience')
BEGIN
    PRINT N'發現 experience 欄位，將使用此欄位名稱';
END
ELSE IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'experience_years')
BEGIN
    PRINT N'發現 experience_years 欄位，將使用此欄位名稱';
END
ELSE
BEGIN
    PRINT N'未發現經驗年資欄位，將新增 experience_years 欄位';
    ALTER TABLE [dbo].[teachers] ADD [experience_years] INT NOT NULL DEFAULT 0;
END
GO

-- 3. 創建師資課程能力資料表 (如果尚未存在)
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
ELSE
BEGIN
    PRINT N'teacher_courses 資料表已存在';
END
GO

-- 4. 清空現有測試資料 (如果需要重新插入)
DELETE FROM [dbo].[teacher_courses] WHERE EXISTS (
    SELECT 1 FROM [dbo].[teachers] WHERE id = teacher_id
);
DELETE FROM [dbo].[teachers] WHERE email LIKE '%@example.com';
GO

-- 5. 根據現有資料表結構插入師資基本資料
-- 先檢查 experience 欄位名稱
DECLARE @sql NVARCHAR(MAX);
DECLARE @experience_column NVARCHAR(50);

-- 確定經驗年資欄位名稱
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'experience')
    SET @experience_column = 'experience';
ELSE
    SET @experience_column = 'experience_years';

-- 動態生成插入語句
SET @sql = N'
INSERT INTO [dbo].[teachers] (
    [name], [email], [phone], [specialties], [available_days], 
    [hourly_rate], [' + @experience_column + N'], [bio], [is_active]
) VALUES 
-- 小剛老師
(N''小剛老師'', ''gang@example.com'', ''0912-345-678'',
 N''["Python", "Web開發", "演算法"]'',
 N''["週一", "週二", "週三", "週四", "週五"]'',
 1500.00, 5, 
 N''資深軟體工程師，專精於 Python 和 Web 開發，有豐富的教學經驗。'', 1),

-- 小美老師  
(N''小美老師'', ''mei@example.com'', ''0923-456-789'',
 N''["JavaScript", "React", "Node.js"]'',
 N''["週二", "週四", "週六", "週日"]'',
 1400.00, 3,
 N''前端開發專家，熟悉現代 JavaScript 框架，善於引導學生理解複雜概念。'', 1),

-- 阿明老師
(N''阿明老師'', ''ming@example.com'', ''0934-567-890'',
 N''["資料科學", "機器學習", "Python"]'',
 N''["週三", "週五", "週六"]'',
 1800.00, 7,
 N''資料科學博士，在機器學習領域有深厚造詣，教學風格嚴謹細緻。'', 0),

-- 王老師
(N''王老師'', ''wang@example.com'', ''0945-678-901'',
 N''["Java", "Spring Boot", "資料庫設計"]'',
 N''["週一", "週三", "週五", "週日"]'',
 1600.00, 6,
 N''後端開發專家，專精於 Java 企業級應用開發，有豐富的系統架構經驗。'', 1),

-- 李老師
(N''李老師'', ''li@example.com'', ''0956-789-012'',
 N''["UI/UX設計", "Figma", "Adobe Creative Suite"]'',
 N''["週二", "週四", "週六"]'',
 1300.00, 4,
 N''視覺設計師，擅長使用者體驗設計，能夠將複雜的設計概念簡化教學。'', 1),

-- 陳老師
(N''陳老師'', ''chen@example.com'', ''0967-890-123'',
 N''["C++", "遊戲開發", "Unity"]'',
 N''["週一", "週二", "週五", "週六"]'',
 1700.00, 8,
 N''遊戲開發資深工程師，專精於 C++ 和 Unity 引擎，教學風格生動有趣。'', 1),

-- 張老師
(N''張老師'', ''zhang@example.com'', ''0978-901-234'',
 N''["DevOps", "Docker", "Kubernetes", "AWS"]'',
 N''["週三", "週四", "週日"]'',
 2000.00, 9,
 N''DevOps 專家，在雲端部署和容器化技術方面有豐富經驗，注重實戰教學。'', 1),

-- 林老師
(N''林老師'', ''lin@example.com'', ''0989-012-345'',
 N''["iOS開發", "Swift", "SwiftUI"]'',
 N''["週一", "週四", "週六", "週日"]'',
 1550.00, 5,
 N''iOS 開發專家，熟悉 Swift 和 SwiftUI，曾參與多個上架 App 的開發。'', 1);';

EXEC sp_executesql @sql;
PRINT N'師資基本資料插入完成';
GO

-- 6. 插入師資課程能力資料
-- 先獲取剛插入的師資ID
DECLARE @teacher_ids TABLE (name NVARCHAR(100), id INT);

INSERT INTO @teacher_ids (name, id)
SELECT name, id FROM [dbo].[teachers] 
WHERE email IN (
    'gang@example.com', 'mei@example.com', 'ming@example.com', 'wang@example.com',
    'li@example.com', 'chen@example.com', 'zhang@example.com', 'lin@example.com'
);

-- 插入課程能力資料
INSERT INTO [dbo].[teacher_courses] (
    [teacher_id], [course_category], [max_level], [is_preferred]
)
SELECT teacher_id, course_category, max_level, is_preferred FROM (
    VALUES 
    -- 小剛老師
    ((SELECT id FROM @teacher_ids WHERE name = N'小剛老師'), N'Python', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'小剛老師'), N'Web開發', N'中級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'小剛老師'), N'演算法', N'中級', 0),
    
    -- 小美老師
    ((SELECT id FROM @teacher_ids WHERE name = N'小美老師'), N'JavaScript', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'小美老師'), N'Web開發', N'高級', 1),
    
    -- 阿明老師
    ((SELECT id FROM @teacher_ids WHERE name = N'阿明老師'), N'資料科學', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'阿明老師'), N'機器學習', N'高級', 1),
    
    -- 王老師
    ((SELECT id FROM @teacher_ids WHERE name = N'王老師'), N'Java', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'王老師'), N'資料庫設計', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'王老師'), N'Web開發', N'中級', 0),
    
    -- 李老師
    ((SELECT id FROM @teacher_ids WHERE name = N'李老師'), N'UI/UX設計', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'李老師'), N'平面設計', N'中級', 0),
    
    -- 陳老師
    ((SELECT id FROM @teacher_ids WHERE name = N'陳老師'), N'C++', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'陳老師'), N'遊戲開發', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'陳老師'), N'演算法', N'中級', 0),
    
    -- 張老師
    ((SELECT id FROM @teacher_ids WHERE name = N'張老師'), N'DevOps', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'張老師'), N'雲端技術', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'張老師'), N'Linux', N'中級', 0),
    
    -- 林老師
    ((SELECT id FROM @teacher_ids WHERE name = N'林老師'), N'iOS開發', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'林老師'), N'Swift', N'高級', 1),
    ((SELECT id FROM @teacher_ids WHERE name = N'林老師'), N'移動應用開發', N'中級', 0)
) AS courses(teacher_id, course_category, max_level, is_preferred);

PRINT N'師資課程能力資料插入完成';
GO

-- 7. 創建修正版查詢視圖
-- 動態創建視圖以適應不同的欄位名稱
DECLARE @view_sql NVARCHAR(MAX);
DECLARE @exp_col NVARCHAR(50);

-- 確定經驗年資欄位名稱
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'teachers' AND COLUMN_NAME = 'experience')
    SET @exp_col = 'experience';
ELSE
    SET @exp_col = 'experience_years';

-- 刪除舊視圖
IF EXISTS (SELECT * FROM sys.views WHERE name = 'view_teachers_summary')
    DROP VIEW [dbo].[view_teachers_summary];

-- 創建新視圖
SET @view_sql = N'
CREATE VIEW [dbo].[view_teachers_summary] AS
SELECT 
    t.[id],
    t.[name],
    t.[email],
    t.[phone],
    t.[specialties],
    t.[available_days],
    t.[hourly_rate],
    t.[' + @exp_col + N'] as [experience_years],
    t.[bio],
    t.[is_active],
    CASE t.[is_active]
        WHEN 1 THEN N''啟用''
        ELSE N''停用''
    END as [status_name],
    t.[created_at],
    t.[updated_at],
    -- 統計課程數量
    (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id]) as [total_courses],
    (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id] AND tc.[is_preferred] = 1) as [preferred_courses]
FROM [dbo].[teachers] t;';

EXEC sp_executesql @view_sql;
PRINT N'已創建修正版 view_teachers_summary 視圖';
GO

-- 8. 驗證資料插入結果
SELECT N'=== 插入結果驗證 ===' as [檢查項目];

SELECT N'師資總數' as [項目], COUNT(*) as [數量] 
FROM [dbo].[teachers] 
WHERE email LIKE '%@example.com';

SELECT N'課程能力記錄數' as [項目], COUNT(*) as [數量] 
FROM [dbo].[teacher_courses];

SELECT N'啟用師資數' as [項目], COUNT(*) as [數量] 
FROM [dbo].[teachers] 
WHERE email LIKE '%@example.com' AND is_active = 1;

-- 顯示插入的師資列表
SELECT 
    name as [師資姓名],
    email as [信箱],
    hourly_rate as [時薪],
    is_active as [狀態]
FROM [dbo].[teachers] 
WHERE email LIKE '%@example.com'
ORDER BY hourly_rate DESC;

PRINT N'師資測試資料插入完成！';
PRINT N'- 已根據現有資料表結構調整插入語法';
PRINT N'- 已插入 8 位師資的基本資料';
PRINT N'- 已插入 21 筆課程能力資料';
PRINT N'- 已創建相容的查詢視圖'; 