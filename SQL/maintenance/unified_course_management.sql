-- =====================================================
-- 統一課程分類管理方案
-- 創建日期: 2025-01-28
-- 說明: 清楚區分學生班別、課程內容分類和師資教學能力
-- =====================================================

-- USE StudentManagement; -- 已在連接時指定資料庫

-- =====================================================
-- 1. 課程內容分類管理表 (courses_categories)
-- =====================================================

-- 建立課程內容分類表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[courses_categories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[courses_categories] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [category_code] NVARCHAR(20) NOT NULL UNIQUE,   -- 分類代碼
        [category_name] NVARCHAR(50) NOT NULL UNIQUE,   -- 分類名稱
        [description] NVARCHAR(200),                    -- 分類描述
        [is_active] BIT DEFAULT 1,                      -- 是否啟用
        [sort_order] INT DEFAULT 0,                     -- 排序順序
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
    );
    
    -- 建立索引
    CREATE INDEX IX_courses_categories_code ON courses_categories(category_code);
    CREATE INDEX IX_courses_categories_active ON courses_categories(is_active);
    CREATE INDEX IX_courses_categories_sort ON courses_categories(sort_order);
    
    PRINT N'已建立 courses_categories 資料表';
END

GO
-- 插入課程內容分類資料
IF NOT EXISTS (SELECT 1 FROM courses_categories WHERE category_code = 'PYTHON')
BEGIN
    INSERT INTO courses_categories (category_code, category_name, description, sort_order) VALUES
    (N'PYTHON', N'Python', N'Python 程式設計相關課程', 1),
    (N'JAVASCRIPT', N'JavaScript', N'JavaScript 前端開發相關課程', 2),
    (N'JAVA', N'Java', N'Java 程式設計相關課程', 3),
    (N'CPP', N'C++', N'C++ 程式設計相關課程', 4),
    (N'WEB_DEV', N'Web開發', N'網頁開發相關課程', 5),
    (N'DATA_SCIENCE', N'資料科學', N'資料科學與分析相關課程', 6),
    (N'MACHINE_LEARNING', N'機器學習', N'機器學習與AI相關課程', 7),
    (N'UI_UX', N'UI/UX設計', N'使用者介面與體驗設計課程', 8),
    (N'GAME_DEV', N'遊戲開發', N'遊戲開發相關課程', 9),
    (N'ALGORITHM', N'演算法', N'演算法與資料結構課程', 10),
    (N'DATABASE', N'資料庫設計', N'資料庫設計與管理課程', 11),
    (N'DEVOPS', N'DevOps', N'DevOps 與雲端技術課程', 12),
    (N'CLOUD', N'雲端技術', N'雲端服務與部署課程', 13),
    (N'IOS_DEV', N'iOS開發', N'iOS 應用程式開發課程', 14),
    (N'ANDROID_DEV', N'Android開發', N'Android 應用程式開發課程', 15);
    
    PRINT N'已插入課程內容分類資料';
END

GO
-- =====================================================
-- 2. 更新 courses 表，使用外鍵關聯
-- =====================================================

-- 新增 category_id 欄位到 courses 表
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('courses') AND name = 'category_id')
BEGIN
    ALTER TABLE courses ADD category_id INT;
    PRINT N'已新增 category_id 欄位到 courses 表';
END

GO
-- 建立外鍵約束
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_courses_category_id')
BEGIN
    ALTER TABLE courses 
    ADD CONSTRAINT FK_courses_category_id 
    FOREIGN KEY (category_id) REFERENCES courses_categories(id);
    PRINT N'已建立 courses 表的外鍵約束';
END

GO
-- =====================================================
-- 3. 更新 teacher_courses 表，使用外鍵關聯
-- =====================================================

-- 新增 category_id 欄位到 teacher_courses 表
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('teacher_courses') AND name = 'category_id')
BEGIN
    ALTER TABLE teacher_courses ADD category_id INT;
    PRINT N'已新增 category_id 欄位到 teacher_courses 表';
END

GO
-- 建立外鍵約束
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_teacher_courses_category_id')
BEGIN
    ALTER TABLE teacher_courses 
    ADD CONSTRAINT FK_teacher_courses_category_id 
    FOREIGN KEY (category_id) REFERENCES courses_categories(id);
    PRINT N'已建立 teacher_courses 表的外鍵約束';
END

GO
-- =====================================================
-- 4. 建立管理視圖
-- =====================================================

-- 課程分類管理視圖
CREATE OR ALTER VIEW [dbo].[view_course_categories_management] AS
SELECT 
    cc.id,
    cc.category_code,
    cc.category_name,
    cc.description,
    cc.is_active,
    cc.sort_order,
    -- 統計課程數量
    (SELECT COUNT(*) FROM courses c WHERE c.category_id = cc.id AND c.is_active = 1) as course_count,
    -- 統計師資數量
    (SELECT COUNT(DISTINCT tc.teacher_id) FROM teacher_courses tc WHERE tc.category_id = cc.id) as teacher_count,
    -- 統計學生班別數量（如果該分類有對應的班別）
    (SELECT COUNT(*) FROM students s 
     INNER JOIN class_types ct ON s.class_type = ct.class_code 
     WHERE ct.class_name LIKE '%' + cc.category_name + '%' AND s.is_active = 1) as student_count
FROM courses_categories cc;

GO
-- 師資教學能力詳細視圖
CREATE OR ALTER VIEW [dbo].[view_teacher_capabilities] AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    cc.category_name,
    tc.max_level,
    tc.is_preferred,
    -- 該師資在此分類的教學水準
    CASE tc.max_level
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'高級' THEN 3
        ELSE 0
    END as level_numeric
FROM teachers t
INNER JOIN teacher_courses tc ON t.id = tc.teacher_id
INNER JOIN courses_categories cc ON tc.category_id = cc.id
WHERE t.is_active = 1 AND cc.is_active = 1
ORDER BY t.name, cc.sort_order, level_numeric DESC;

GO
-- =====================================================
-- 5. 建立管理 API 查詢
-- =====================================================

PRINT N'=== 課程分類管理查詢範例 ===';

-- 查詢所有課程分類及其統計
PRINT N'1. 課程分類統計：';
SELECT 
    category_name as [分類名稱],
    course_count as [課程數量],
    teacher_count as [師資數量],
    student_count as [學生數量],
    is_active as [啟用狀態]
FROM view_course_categories_management
ORDER BY sort_order;

-- 查詢師資教學能力分佈
PRINT N'2. 師資教學能力分佈：';
SELECT 
    category_name as [課程分類],
    max_level as [教學水準],
    COUNT(*) as [師資人數]
FROM view_teacher_capabilities
GROUP BY category_name, max_level
ORDER BY category_name, 
    CASE max_level
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'高級' THEN 3
    END;

-- 查詢每個分類的最高教學水準師資
PRINT N'3. 各分類最高教學水準師資：';
SELECT 
    category_name as [課程分類],
    teacher_name as [師資姓名],
    max_level as [教學水準]
FROM (
    SELECT 
        cc.category_name,
        t.name as teacher_name,
        tc.max_level,
        ROW_NUMBER() OVER (
            PARTITION BY cc.id 
            ORDER BY 
                CASE tc.max_level
                    WHEN N'初級' THEN 1
                    WHEN N'中級' THEN 2
                    WHEN N'高級' THEN 3
                END DESC
        ) as rn
    FROM courses_categories cc
    INNER JOIN teacher_courses tc ON cc.id = tc.category_id
    INNER JOIN teachers t ON tc.teacher_id = t.id
    WHERE cc.is_active = 1 AND t.is_active = 1
) ranked
WHERE rn = 1
ORDER BY category_name;

PRINT N'=== 統一課程分類管理方案說明 ===';
PRINT N'1. courses_categories: 課程內容分類（如 Python、Web開發等）';
PRINT N'2. class_types: 學生班別分類（如 C/C++、Scratch 等）';
PRINT N'3. teacher_courses: 師資教學能力（課程分類 + 教學水準）';
PRINT N'4. 三者關係：';
PRINT N'   - 課程分類決定師資能教什麼內容';
PRINT N'   - 教學水準決定師資能教到什麼程度';
PRINT N'   - 學生班別是實際開設的課程類型';
PRINT N'5. 管理建議：';
PRINT N'   - 課程分類：統一管理，避免重複';
PRINT N'   - 師資能力：每個師資可有多個分類，每個分類有不同水準';
PRINT N'   - 學生班別：根據實際開課需求設定'; 