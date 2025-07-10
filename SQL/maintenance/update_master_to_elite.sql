-- =====================================================
-- 將程度「大師」更新為「精英」
-- 創建日期: 2025-01-28
-- 說明: 將所有表格中的「大師」程度改為「精英」
-- =====================================================

BEGIN TRANSACTION;

-- 檢查各表格的實際程度資料
PRINT '=== 檢查各表格的程度資料 ===';

PRINT 'students 表的 level_type:';
SELECT level_type, COUNT(*) as count
FROM students 
GROUP BY level_type;

PRINT 'courses 表的 level:';
SELECT level, COUNT(*) as count
FROM courses 
GROUP BY level;

PRINT 'teacher_courses 表的 max_level:';
SELECT max_level, COUNT(*) as count
FROM teacher_courses 
GROUP BY max_level;

PRINT 'student_course_progress 表的 ability_level:';
SELECT ability_level, COUNT(*) as count
FROM student_course_progress 
GROUP BY ability_level;

-- 只更新實際包含「大師」的表格
IF EXISTS (SELECT 1 FROM students WHERE level_type = N'大師')
BEGIN
    UPDATE students 
    SET level_type = N'精英' 
    WHERE level_type = N'大師';
    PRINT '已更新 students 表中的程度：大師 → 精英';
END
ELSE
BEGIN
    PRINT 'students 表中沒有「大師」程度的資料';
END

IF EXISTS (SELECT 1 FROM courses WHERE level = N'大師')
BEGIN
    UPDATE courses 
    SET level = N'精英' 
    WHERE level = N'大師';
    PRINT '已更新 courses 表中的程度：大師 → 精英';
END
ELSE
BEGIN
    PRINT 'courses 表中沒有「大師」程度的資料';
END

IF EXISTS (SELECT 1 FROM teacher_courses WHERE max_level = N'大師')
BEGIN
    UPDATE teacher_courses 
    SET max_level = N'精英' 
    WHERE max_level = N'大師';
    PRINT '已更新 teacher_courses 表中的程度：大師 → 精英';
END
ELSE
BEGIN
    PRINT 'teacher_courses 表中沒有「大師」程度的資料';
END

IF EXISTS (SELECT 1 FROM student_course_progress WHERE ability_level = N'大師')
BEGIN
    UPDATE student_course_progress 
    SET ability_level = N'精英' 
    WHERE ability_level = N'大師';
    PRINT '已更新 student_course_progress 表中的程度：大師 → 精英';
END
ELSE
BEGIN
    PRINT 'student_course_progress 表中沒有「大師」程度的資料';
END

-- 更新約束（只更新實際存在的約束）
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'CK_students_level_type'
)
BEGIN
    ALTER TABLE students DROP CONSTRAINT CK_students_level_type;
    ALTER TABLE students 
    ADD CONSTRAINT CK_students_level_type 
    CHECK (level_type IN (N'新手', N'入門', N'中階', N'高階', N'精英'));
    PRINT '已更新 students level_type 約束';
END

IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'CK_courses_level'
)
BEGIN
    ALTER TABLE courses DROP CONSTRAINT CK_courses_level;
    ALTER TABLE courses 
    ADD CONSTRAINT CK_courses_level 
    CHECK (level IN (N'新手', N'入門', N'中階', N'高階', N'精英'));
    PRINT '已更新 courses level 約束';
END

IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'CK_teacher_courses_max_level'
)
BEGIN
    ALTER TABLE teacher_courses DROP CONSTRAINT CK_teacher_courses_max_level;
    ALTER TABLE teacher_courses 
    ADD CONSTRAINT CK_teacher_courses_max_level 
    CHECK (max_level IN (N'新手', N'入門', N'中階', N'高階', N'精英'));
    PRINT '已更新 teacher_courses max_level 約束';
END

IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'CHK_student_course_progress_ability_level'
)
BEGIN
    ALTER TABLE student_course_progress DROP CONSTRAINT CHK_student_course_progress_ability_level;
    ALTER TABLE student_course_progress 
    ADD CONSTRAINT CHK_student_course_progress_ability_level 
    CHECK (ability_level IN (N'新手', N'入門', N'中階', N'高階', N'精英'));
    PRINT '已更新 student_course_progress ability_level 約束';
END

PRINT '程度更新完成！所有「大師」已改為「精英」';

COMMIT TRANSACTION; 