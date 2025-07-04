-- =====================================================
-- 修正課程分類遷移問題
-- 處理未遷移的資料和 category_code 長度問題
-- =====================================================

USE Student_Management;
GO

PRINT N'開始修正遷移問題...';
GO

-- =====================================================
-- 1. 修正 category_code 長度問題
-- =====================================================

-- 先刪除有問題的記錄
DELETE FROM courses_categories 
WHERE category_code LIKE '%截斷%' OR LEN(category_code) > 20;
GO

-- 重新新增課程分類，使用較短的代碼
PRINT N'1. 重新新增課程分類...';

-- 從 teacher_courses 表新增分類（使用較短的代碼）
INSERT INTO courses_categories (category_code, category_name, description, sort_order)
SELECT 
    CASE 
        WHEN course_category = N'Adobe Creative Suite' THEN 'ADOBE_CS'
        WHEN course_category = N'網頁開發/APP/應用程式/遊戲' THEN 'WEB_APP_GAME'
        WHEN course_category = N'美國APCS A檢定考試' THEN 'APCS_A'
        WHEN course_category = N'移動應用開發' THEN 'MOBILE_DEV'
        WHEN course_category = N'AI工具運用' THEN 'AI_TOOLS'
        WHEN course_category = N'AI應用' THEN 'AI_APP'
        WHEN course_category = N'平面設計' THEN 'GRAPHIC_DESIGN'
        ELSE UPPER(LEFT(REPLACE(REPLACE(course_category, ' ', '_'), '/', '_'), 15))
    END as category_code,
    course_category as category_name,
    course_category + N' 相關課程' as description,
    100 + ROW_NUMBER() OVER (ORDER BY course_category) as sort_order
FROM (
    SELECT DISTINCT course_category 
    FROM teacher_courses 
    WHERE course_category IS NOT NULL 
    AND course_category != ''
    AND course_category NOT IN (SELECT category_name FROM courses_categories)
) new_categories;
GO

-- 從 courses 表新增分類
INSERT INTO courses_categories (category_code, category_name, description, sort_order)
SELECT 
    CASE 
        WHEN category = N'網頁開發/APP/應用程式/遊戲' THEN 'WEB_APP_GAME'
        WHEN category = N'AI工具運用' THEN 'AI_TOOLS'
        WHEN category = N'平面設計' THEN 'GRAPHIC_DESIGN'
        ELSE UPPER(LEFT(REPLACE(REPLACE(category, ' ', '_'), '/', '_'), 15))
    END as category_code,
    category as category_name,
    category + N' 相關課程' as description,
    200 + ROW_NUMBER() OVER (ORDER BY category) as sort_order
FROM (
    SELECT DISTINCT category 
    FROM courses 
    WHERE category IS NOT NULL 
    AND category != ''
    AND category NOT IN (SELECT category_name FROM courses_categories)
) new_categories;
GO

-- =====================================================
-- 2. 更新剩餘的 teacher_courses 記錄
-- =====================================================

PRINT N'2. 更新剩餘的 teacher_courses 記錄...';

UPDATE tc
SET category_id = cc.id
FROM teacher_courses tc
INNER JOIN courses_categories cc ON tc.course_category = cc.category_name
WHERE tc.course_category IS NOT NULL 
AND tc.course_category != ''
AND tc.category_id IS NULL;
GO

-- =====================================================
-- 3. 更新剩餘的 courses 記錄
-- =====================================================

PRINT N'3. 更新剩餘的 courses 記錄...';

UPDATE c
SET category_id = cc.id
FROM courses c
INNER JOIN courses_categories cc ON c.category = cc.category_name
WHERE c.category IS NOT NULL 
AND c.category != ''
AND c.category_id IS NULL;
GO

-- =====================================================
-- 4. 處理重複的課程分類名稱
-- =====================================================

PRINT N'4. 處理重複的課程分類名稱...';

-- 檢查重複的分類名稱
SELECT 
    category_name,
    COUNT(*) as count
FROM courses_categories
GROUP BY category_name
HAVING COUNT(*) > 1;
GO

-- 合併重複的分類（保留第一個，刪除後面的）
WITH DuplicateCategories AS (
    SELECT 
        id,
        category_name,
        ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY id) as rn
    FROM courses_categories
)
DELETE FROM courses_categories
WHERE id IN (
    SELECT id 
    FROM DuplicateCategories 
    WHERE rn > 1
);
GO

-- =====================================================
-- 5. 最終驗證
-- =====================================================

PRINT N'5. 最終驗證：';

PRINT N'5.1 課程分類統計：';
SELECT 
    category_name as [分類名稱],
    course_count as [課程數量],
    teacher_count as [師資數量],
    student_count as [學生數量],
    is_active as [啟用狀態]
FROM view_course_categories_management
ORDER BY sort_order;
GO

PRINT N'5.2 師資教學能力分佈：';
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
GO

PRINT N'5.3 檢查未遷移的資料：';
SELECT 
    'teacher_courses' as [表名],
    course_category as [未遷移分類],
    COUNT(*) as [記錄數量]
FROM teacher_courses 
WHERE course_category IS NOT NULL 
AND course_category != ''
AND category_id IS NULL
GROUP BY course_category

UNION ALL

SELECT 
    'courses' as [表名],
    category as [未遷移分類],
    COUNT(*) as [記錄數量]
FROM courses 
WHERE category IS NOT NULL 
AND category != ''
AND category_id IS NULL
GROUP BY category;
GO

PRINT N'5.4 檢查 category_code 長度：';
SELECT 
    category_name,
    category_code,
    LEN(category_code) as code_length
FROM courses_categories
WHERE LEN(category_code) > 20
ORDER BY LEN(category_code) DESC;
GO

PRINT N'=== 修正完成 ===';
PRINT N'如果還有未遷移的資料，請手動處理或建立對應的課程分類';
GO 