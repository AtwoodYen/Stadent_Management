-- =====================================================
-- 將「進階」改為「中階」修正腳本（最終版）
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：將所有資料庫中的「進階」改為「中階」
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 開始將「進階」改為「中階」修正 ===';
GO

-- =====================================================
-- 1. 先移除檢查約束
-- =====================================================

PRINT N'1. 移除檢查約束...';

-- 移除 student_course_progress 表的檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_student_course_progress_ability_level')
BEGIN
    ALTER TABLE student_course_progress 
    DROP CONSTRAINT CHK_student_course_progress_ability_level;
    PRINT N'已移除 student_course_progress 表的檢查約束';
END

-- 移除 student_class_type_abilities 表的檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_student_class_type_abilities_level')
BEGIN
    ALTER TABLE student_class_type_abilities 
    DROP CONSTRAINT CHK_student_class_type_abilities_level;
    PRINT N'已移除 student_class_type_abilities 表的檢查約束';
END

-- 移除 students 表的檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_students_level_type')
BEGIN
    ALTER TABLE students 
    DROP CONSTRAINT CHK_students_level_type;
    PRINT N'已移除 students 表的檢查約束';
END

-- 移除 teacher_courses 表的檢查約束
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_teacher_courses_max_level')
BEGIN
    ALTER TABLE teacher_courses 
    DROP CONSTRAINT CHK_teacher_courses_max_level;
    PRINT N'已移除 teacher_courses 表的檢查約束';
END

GO

-- =====================================================
-- 2. 更新資料
-- =====================================================

PRINT N'2. 更新 student_course_progress 表的 ability_level...';
UPDATE student_course_progress 
SET ability_level = N'中階'
WHERE ability_level = N'進階';
PRINT N'已更新 student_course_progress 表 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆記錄';

PRINT N'3. 更新 student_class_type_abilities 表的 ability_level...';
UPDATE student_class_type_abilities 
SET ability_level = N'中階'
WHERE ability_level = N'進階';
PRINT N'已更新 student_class_type_abilities 表 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆記錄';

PRINT N'4. 更新 students 表的 level_type 欄位...';
UPDATE students 
SET level_type = N'中階'
WHERE level_type = N'進階';
PRINT N'已更新 students 表 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆記錄';

PRINT N'5. 更新 teacher_courses 表的 max_level 欄位...';
UPDATE teacher_courses 
SET max_level = N'中級'
WHERE max_level = N'進階';
PRINT N'已更新 teacher_courses 表 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆記錄';

GO

-- =====================================================
-- 3. 重新建立檢查約束
-- =====================================================

PRINT N'6. 重新建立檢查約束...';

-- 重新建立 student_course_progress 表的檢查約束
ALTER TABLE student_course_progress 
ADD CONSTRAINT CHK_student_course_progress_ability_level 
CHECK (ability_level IN (N'新手', N'入門', N'中階', N'高階', N'大師'));
PRINT N'已重新建立 student_course_progress 表的檢查約束';

-- 重新建立 student_class_type_abilities 表的檢查約束
ALTER TABLE student_class_type_abilities 
ADD CONSTRAINT CHK_student_class_type_abilities_level 
CHECK (ability_level IN (N'新手', N'入門', N'中階', N'高階', N'大師'));
PRINT N'已重新建立 student_class_type_abilities 表的檢查約束';

-- 重新建立 students 表的檢查約束
ALTER TABLE students 
ADD CONSTRAINT CHK_students_level_type 
CHECK (level_type IN (N'新手', N'入門', N'中階', N'高階', N'大師'));
PRINT N'已重新建立 students 表的檢查約束';

-- 重新建立 teacher_courses 表的檢查約束
ALTER TABLE teacher_courses 
ADD CONSTRAINT CHK_teacher_courses_max_level 
CHECK (max_level IN (N'初級', N'中級', N'高級'));
PRINT N'已重新建立 teacher_courses 表的檢查約束';

GO

-- =====================================================
-- 4. 驗證更新結果
-- =====================================================

PRINT N'7. 驗證更新結果...';

PRINT N'7.1 檢查是否還有「進階」字樣：';
SELECT 
    'student_course_progress' as table_name,
    COUNT(*) as count
FROM student_course_progress 
WHERE ability_level = N'進階'
UNION ALL
SELECT 
    'student_class_type_abilities' as table_name,
    COUNT(*) as count
FROM student_class_type_abilities 
WHERE ability_level = N'進階'
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as count
FROM students 
WHERE level_type = N'進階'
UNION ALL
SELECT 
    'teacher_courses' as table_name,
    COUNT(*) as count
FROM teacher_courses 
WHERE max_level = N'進階';

GO

PRINT N'7.2 檢查「中階」字樣的分布：';
SELECT 
    'student_course_progress' as table_name,
    COUNT(*) as count
FROM student_course_progress 
WHERE ability_level = N'中階'
UNION ALL
SELECT 
    'student_class_type_abilities' as table_name,
    COUNT(*) as count
FROM student_class_type_abilities 
WHERE ability_level = N'中階'
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as count
FROM students 
WHERE level_type = N'中階';

GO

PRINT N'=== 資料庫「進階」改「中階」修正完成 ===';
PRINT N'請記得同時更新前端和後端程式碼中的相關字樣'; 