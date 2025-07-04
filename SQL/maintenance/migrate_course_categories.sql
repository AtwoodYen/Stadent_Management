-- =====================================================
-- 課程分類資料遷移腳本
-- 將現有的 course_category 字串資料遷移到新的外鍵關聯系統
-- =====================================================

USE Student_Management;
GO

PRINT N'開始課程分類資料遷移...';
GO

-- =====================================================
-- 1. 檢查現有資料
-- =====================================================

PRINT N'1. 檢查現有的 teacher_courses 資料：';
SELECT 
    course_category as [現有課程分類],
    COUNT(*) as [記錄數量]
FROM teacher_courses 
WHERE course_category IS NOT NULL AND course_category != ''
GROUP BY course_category
ORDER BY course_category;
GO

PRINT N'2. 檢查現有的 courses 資料：';
SELECT 
    category as [現有課程分類],
    COUNT(*) as [記錄數量]
FROM courses 
WHERE category IS NOT NULL AND category != ''
GROUP BY category
ORDER BY category;
GO

-- =====================================================
-- 2. 新增缺失的課程分類
-- =====================================================

PRINT N'3. 新增缺失的課程分類...';

-- 從 teacher_courses 表新增分類
INSERT INTO courses_categories (category_code, category_name, description, sort_order)
SELECT 
    UPPER(REPLACE(course_category, ' ', '_')) as category_code,
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
    UPPER(REPLACE(category, ' ', '_')) as category_code,
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
-- 3. 更新 teacher_courses 表的 category_id
-- =====================================================

PRINT N'4. 更新 teacher_courses 表的 category_id...';

UPDATE tc
SET category_id = cc.id
FROM teacher_courses tc
INNER JOIN courses_categories cc ON tc.course_category = cc.category_name
WHERE tc.course_category IS NOT NULL 
AND tc.course_category != ''
AND tc.category_id IS NULL;
GO

-- =====================================================
-- 4. 更新 courses 表的 category_id
-- =====================================================

PRINT N'5. 更新 courses 表的 category_id...';

UPDATE c
SET category_id = cc.id
FROM courses c
INNER JOIN courses_categories cc ON c.category = cc.category_name
WHERE c.category IS NOT NULL 
AND c.category != ''
AND c.category_id IS NULL;
GO

-- =====================================================
-- 5. 驗證遷移結果
-- =====================================================

PRINT N'6. 驗證遷移結果：';

PRINT N'6.1 課程分類統計：';
SELECT 
    category_name as [分類名稱],
    course_count as [課程數量],
    teacher_count as [師資數量],
    student_count as [學生數量],
    is_active as [啟用狀態]
FROM view_course_categories_management
ORDER BY sort_order;
GO

PRINT N'6.2 師資教學能力分佈：';
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

PRINT N'6.3 檢查未遷移的資料：';
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

PRINT N'=== 遷移完成 ===';
PRINT N'注意事項：';
PRINT N'1. 遷移完成後，可以考慮移除舊的 course_category 和 category 欄位';
PRINT N'2. 建議先測試系統功能正常後再移除舊欄位';
PRINT N'3. 如果發現問題，可以透過 category_id 欄位回滾遷移';
GO 