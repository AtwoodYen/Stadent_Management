-- =====================================================
-- 檢查課程等級約束狀態腳本
-- 創建日期: 2025-01-28
-- 說明: 檢查資料庫中各個表格的等級約束狀態
-- =====================================================

PRINT '=== 檢查課程等級約束狀態 ===';

-- 1. 檢查 courses 表的約束
PRINT '';
PRINT '=== 1. courses 表約束 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%courses%level%';

-- 2. 檢查 students 表的約束
PRINT '';
PRINT '=== 2. students 表約束 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%students%level%';

-- 3. 檢查 teacher_courses 表的約束
PRINT '';
PRINT '=== 3. teacher_courses 表約束 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%teacher%level%';

-- 4. 檢查 student_course_progress 表的約束
PRINT '';
PRINT '=== 4. student_course_progress 表約束 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%student_course_progress%level%';

-- 5. 檢查實際資料分佈
PRINT '';
PRINT '=== 5. 實際資料分佈 ===';

-- courses 表等級分佈
PRINT 'courses 表等級分佈:';
SELECT 
    level AS '等級',
    COUNT(*) AS '課程數量'
FROM courses 
WHERE is_active = 1
GROUP BY level
ORDER BY level;

-- students 表等級分佈
PRINT '';
PRINT 'students 表等級分佈:';
SELECT 
    level_type AS '等級',
    COUNT(*) AS '學生數量'
FROM students 
WHERE is_active = 1
GROUP BY level_type
ORDER BY level_type;

-- teacher_courses 表等級分佈
PRINT '';
PRINT 'teacher_courses 表等級分佈:';
SELECT 
    max_level AS '等級',
    COUNT(*) AS '記錄數量'
FROM teacher_courses 
GROUP BY max_level
ORDER BY max_level;

-- student_course_progress 表等級分佈
PRINT '';
PRINT 'student_course_progress 表等級分佈:';
SELECT 
    ability_level AS '等級',
    COUNT(*) AS '記錄數量'
FROM student_course_progress 
WHERE is_active = 1
GROUP BY ability_level
ORDER BY ability_level;

PRINT '';
PRINT '=== 檢查完成 ==='; 