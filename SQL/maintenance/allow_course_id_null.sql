-- =====================================================
-- 修改 student_course_progress 表，允許 course_id 為 NULL
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：為了支援空白課程記錄功能
-- =====================================================

-- 1. 先移除外鍵約束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_student_course_progress_course_id')
BEGIN
    ALTER TABLE [dbo].[student_course_progress] 
    DROP CONSTRAINT [FK_student_course_progress_course_id];
    PRINT N'已移除 course_id 外鍵約束';
END

-- 2. 移除唯一約束（因為 course_id 可能為 NULL）
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UK_student_course_progress_student_course]') AND type in (N'UQ'))
BEGIN
    ALTER TABLE [dbo].[student_course_progress] 
    DROP CONSTRAINT [UK_student_course_progress_student_course];
    PRINT N'已移除 student_course 唯一約束';
END

-- 3. 修改 course_id 欄位允許 NULL
ALTER TABLE [dbo].[student_course_progress] 
ALTER COLUMN [course_id] INT NULL;
PRINT N'已修改 course_id 欄位允許 NULL';

-- 4. 重新建立外鍵約束（允許 NULL）
ALTER TABLE [dbo].[student_course_progress] 
ADD CONSTRAINT [FK_student_course_progress_course_id] 
    FOREIGN KEY ([course_id]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE;
PRINT N'已重新建立 course_id 外鍵約束（允許 NULL）';

-- 5. 建立新的唯一約束（只對非 NULL 的 course_id 生效）
SET QUOTED_IDENTIFIER ON;
CREATE UNIQUE NONCLUSTERED INDEX [UK_student_course_progress_student_course_not_null]
ON [dbo].[student_course_progress] ([student_id], [course_id])
WHERE [course_id] IS NOT NULL;
PRINT N'已建立新的唯一索引（只對非 NULL course_id 生效）';

-- 6. 驗證修改結果
PRINT N'=== 驗證修改結果 ===';
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_course_progress' 
AND COLUMN_NAME = 'course_id';

PRINT N'=== course_id 欄位修改完成 ===';
PRINT N'1. course_id 欄位現在允許 NULL 值';
PRINT N'2. 外鍵約束已重新建立（允許 NULL）';
PRINT N'3. 唯一約束已改為只對非 NULL 值生效'; 