-- 師資課程能力診斷腳本
-- 檢查資料庫中的實際資料結構和關聯

PRINT N'=== 師資課程能力診斷開始 ===';

-- 1. 檢查基本資料統計
PRINT N'1. 基本資料統計';
SELECT 
    'teachers' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records,
    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_records
FROM teachers
UNION ALL
SELECT 
    'teacher_courses' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT teacher_id) as teachers_with_courses,
    COUNT(DISTINCT course_category) as unique_categories
FROM teacher_courses;

-- 2. 檢查師資課程能力關聯
PRINT N'2. 師資課程能力關聯檢查';
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.is_active,
    COUNT(tc.id) as course_count,
    STRING_AGG(tc.course_category, ', ') as course_categories,
    STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', ') as preferred_courses
FROM teachers t
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name, t.is_active
ORDER BY t.id;

-- 3. 檢查 STRING_AGG 的實際結果
PRINT N'3. STRING_AGG 聚合結果檢查';
SELECT 
    t.id,
    t.name,
    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses,
    LEN(ISNULL(STRING_AGG(tc.course_category, ', '), '')) as course_categories_length,
    LEN(ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '')) as preferred_courses_length
FROM teachers t
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name
ORDER BY t.id;

-- 4. 檢查是否有重複的課程能力記錄
PRINT N'4. 檢查重複記錄';
SELECT 
    teacher_id,
    course_category,
    COUNT(*) as duplicate_count
FROM teacher_courses
GROUP BY teacher_id, course_category
HAVING COUNT(*) > 1
ORDER BY teacher_id, course_category;

-- 5. 檢查課程能力資料的詳細內容
PRINT N'5. 課程能力詳細資料';
SELECT TOP 10
    tc.id,
    tc.teacher_id,
    t.name as teacher_name,
    tc.course_category,
    tc.max_level,
    tc.is_preferred,
    tc.created_at
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
ORDER BY tc.teacher_id, tc.course_category;

-- 6. 檢查特定師資的課程能力
PRINT N'6. 檢查前5位師資的課程能力';
SELECT TOP 5
    t.id,
    t.name,
    t.is_active,
    COUNT(tc.id) as course_count,
    STRING_AGG(tc.course_category, ', ') as course_categories,
    STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', ') as preferred_courses
FROM teachers t
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name, t.is_active
ORDER BY t.id;

-- 7. 檢查課程分類分布
PRINT N'7. 課程分類分布';
SELECT 
    course_category,
    COUNT(*) as teacher_count,
    SUM(CASE WHEN is_preferred = 1 THEN 1 ELSE 0 END) as preferred_count
FROM teacher_courses
GROUP BY course_category
ORDER BY teacher_count DESC;

PRINT N'=== 師資課程能力診斷完成 ==='; 