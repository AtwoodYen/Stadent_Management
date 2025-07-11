-- =====================================================
-- 移除 student_course_progress 表的 filtered index
-- 創建日期：2025-01-10
-- 說明：解決 QUOTED_IDENTIFIER 問題
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 開始移除 student_course_progress 表的 filtered index ===';

-- 1. 檢查現有的 filtered index
PRINT N'1. 檢查現有的 filtered index：';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_course_progress')
AND i.filter_definition IS NOT NULL;

-- 2. 移除 filtered index
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UK_student_course_progress_student_course_not_null')
BEGIN
    DROP INDEX [UK_student_course_progress_student_course_not_null] ON [dbo].[student_course_progress];
    PRINT N'已刪除 filtered index UK_student_course_progress_student_course_not_null';
END
ELSE
BEGIN
    PRINT N'filtered index UK_student_course_progress_student_course_not_null 不存在';
END

-- 3. 建立簡單的唯一索引（不包含 NULL 值）
PRINT N'2. 建立簡單的唯一索引（排除 NULL 值）：';
CREATE UNIQUE NONCLUSTERED INDEX [UK_student_course_progress_simple] 
ON [dbo].[student_course_progress] ([student_id], [course_id])
WHERE [course_id] IS NOT NULL;

PRINT N'已建立簡單的唯一索引（排除 NULL 值）';

-- 4. 驗證修改結果
PRINT N'3. 驗證修改結果：';
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_course_progress')
AND i.name = 'UK_student_course_progress_simple';

PRINT N'=== 修改完成 ===';
PRINT N'1. 已刪除複雜的 filtered index';
PRINT N'2. 已建立簡單的唯一索引，允許多個 NULL 值';
PRINT N'3. 非 NULL 值仍然保持唯一性';
PRINT N'4. 不再需要 QUOTED_IDENTIFIER 設定'; 