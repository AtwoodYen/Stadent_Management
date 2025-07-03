-- 師資查詢優化測試腳本
-- 測試 LEFT JOIN 和 STRING_AGG 的效能和正確性

-- 1. 測試基本查詢（包含課程能力聚合）
PRINT N'=== 測試基本師資查詢（包含課程能力聚合） ===';
SELECT 
    t.id, t.name, t.email, t.phone, t.available_days, 
    t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
    t.created_at, t.updated_at,
    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
FROM teachers t 
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
WHERE t.is_active = 1
GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at
ORDER BY ISNULL(t.sort_order, 999999), t.id ASC;

-- 2. 測試課程分類篩選查詢
PRINT N'=== 測試課程分類篩選查詢 ===';
DECLARE @test_category NVARCHAR(100) = N'Python';
SELECT 
    t.id, t.name, t.email, t.phone, t.available_days, 
    t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
    t.created_at, t.updated_at,
    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
FROM teachers t 
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
WHERE t.is_active = 1
    AND EXISTS (
        SELECT 1 FROM teacher_courses tc2 
        WHERE tc2.teacher_id = t.id 
        AND tc2.course_category = @test_category
    )
GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at
ORDER BY ISNULL(t.sort_order, 999999), t.id ASC;

-- 3. 測試單一師資查詢
PRINT N'=== 測試單一師資查詢 ===';
DECLARE @test_teacher_id INT = 1;
SELECT 
    t.id, t.name, t.email, t.phone, t.available_days, 
    t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url,
    t.created_at, t.updated_at,
    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
FROM teachers t 
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
WHERE t.id = @test_teacher_id
GROUP BY t.id, t.name, t.email, t.phone, t.available_days, t.hourly_rate, t.experience, t.bio, t.is_active, t.avatar_url, t.created_at, t.updated_at;

-- 4. 測試課程分類列表查詢
PRINT N'=== 測試課程分類列表查詢 ===';
SELECT DISTINCT tc.course_category
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
WHERE t.is_active = 1
ORDER BY tc.course_category;

-- 5. 效能分析查詢
PRINT N'=== 效能分析查詢 ===';

-- 檢查索引使用情況
SELECT 
    OBJECT_NAME(i.object_id) as table_name,
    i.name as index_name,
    i.type_desc as index_type,
    STUFF((
        SELECT ', ' + COL_NAME(ic.object_id, ic.column_id)
        FROM sys.index_columns ic
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') as index_columns
FROM sys.indexes i
WHERE i.object_id IN (OBJECT_ID('teachers'), OBJECT_ID('teacher_courses'))
ORDER BY table_name, index_name;

-- 檢查統計資訊
PRINT N'=== 統計資訊 ===';
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

-- 6. 查詢執行計劃分析
PRINT N'=== 建議的索引優化 ===';
PRINT N'1. 確保 teachers 表有 sort_order 欄位的索引';
PRINT N'2. 確保 teacher_courses 表有 (teacher_id, course_category) 的複合索引';
PRINT N'3. 確保 teacher_courses 表有 is_preferred 欄位的索引';

-- 7. 測試空值處理
PRINT N'=== 測試空值處理 ===';
SELECT 
    t.id, t.name,
    CASE 
        WHEN tc.course_category IS NULL THEN '無課程能力'
        ELSE '有課程能力'
    END as has_courses,
    ISNULL(STRING_AGG(tc.course_category, ', '), '') as course_categories,
    ISNULL(STRING_AGG(CASE WHEN tc.is_preferred = 1 THEN tc.course_category END, ', '), '') as preferred_courses
FROM teachers t 
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name, tc.course_category
ORDER BY t.id;

PRINT N'=== 查詢優化測試完成 ==='; 