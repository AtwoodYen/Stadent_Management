-- =====================================================
-- 完全移除 student_course_progress 表的所有 filtered index
-- 創建日期：2025-01-10
-- 說明：解決 QUOTED_IDENTIFIER 問題，改為應用層面檢查唯一性
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 開始完全移除 student_course_progress 表的所有 filtered index ===';

-- 1. 檢查現有的所有 filtered index
PRINT N'1. 檢查現有的 filtered index：';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_course_progress')
AND i.filter_definition IS NOT NULL;

-- 2. 移除所有 filtered index
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UK_student_course_progress_student_course_not_null')
BEGIN
    DROP INDEX [UK_student_course_progress_student_course_not_null] ON [dbo].[student_course_progress];
    PRINT N'已刪除 filtered index UK_student_course_progress_student_course_not_null';
END
ELSE
BEGIN
    PRINT N'filtered index UK_student_course_progress_student_course_not_null 不存在';
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UK_student_course_progress_simple')
BEGIN
    DROP INDEX [UK_student_course_progress_simple] ON [dbo].[student_course_progress];
    PRINT N'已刪除 filtered index UK_student_course_progress_simple';
END
ELSE
BEGIN
    PRINT N'filtered index UK_student_course_progress_simple 不存在';
END

-- 3. 驗證所有 filtered index 已移除
PRINT N'2. 驗證所有 filtered index 已移除：';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_course_progress')
AND i.filter_definition IS NOT NULL;

-- 4. 顯示剩餘的索引
PRINT N'3. 剩餘的索引：';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_course_progress')
AND i.name NOT LIKE 'PK_%';

PRINT N'=== 修改完成 ===';
PRINT N'1. 已完全移除所有 filtered index';
PRINT N'2. 不再需要 QUOTED_IDENTIFIER 設定';
PRINT N'3. 唯一性檢查將由應用層面處理';
PRINT N'4. 允許多個 NULL course_id 值'; 