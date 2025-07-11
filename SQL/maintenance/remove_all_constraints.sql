-- =====================================================
-- 完全移除所有約束，簡化表結構
-- 創建日期：2025-01-10
-- 說明：解決 QUOTED_IDENTIFIER 問題
-- =====================================================

-- 1. 先刪除所有相關的索引和約束
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_student_class_type_abilities_filtered')
BEGIN
    DROP INDEX [UQ_student_class_type_abilities_filtered] ON [dbo].[student_class_type_abilities];
    PRINT N'已刪除 filtered index UQ_student_class_type_abilities_filtered';
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_student_class_type_abilities_simple')
BEGIN
    DROP INDEX [UQ_student_class_type_abilities_simple] ON [dbo].[student_class_type_abilities];
    PRINT N'已刪除 simple index UQ_student_class_type_abilities_simple';
END

-- 2. 檢查並刪除唯一約束
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UQ_student_class_type_abilities]') AND type = 'UQ')
BEGIN
    ALTER TABLE [dbo].[student_class_type_abilities] 
    DROP CONSTRAINT [UQ_student_class_type_abilities];
    PRINT N'已刪除唯一約束 UQ_student_class_type_abilities';
END

PRINT N'=== 修改完成 ===';
PRINT N'1. 已移除所有複雜的索引和約束';
PRINT N'2. 表結構已簡化';
PRINT N'3. 不再需要 QUOTED_IDENTIFIER 設定';
PRINT N'4. 唯一性檢查將在應用層面進行'; 