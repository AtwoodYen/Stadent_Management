-- =====================================================
-- 修正 student_class_type_abilities 表的唯一約束
-- 創建日期：2025-01-10
-- 說明：允許多個 NULL 值的 class_type 記錄
-- =====================================================

-- 1. 先刪除現有的唯一約束
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UQ_student_class_type_abilities]') AND type = 'UQ')
BEGIN
    ALTER TABLE [dbo].[student_class_type_abilities] 
    DROP CONSTRAINT [UQ_student_class_type_abilities];
    PRINT N'已刪除唯一約束 UQ_student_class_type_abilities';
END

-- 2. 創建過濾索引來實現唯一約束（排除 NULL 值）
SET QUOTED_IDENTIFIER ON;
CREATE UNIQUE NONCLUSTERED INDEX [UQ_student_class_type_abilities_filtered] 
ON [dbo].[student_class_type_abilities] ([student_id], [class_type])
WHERE [class_type] IS NOT NULL;

PRINT N'已建立過濾唯一索引（排除 NULL 值）';

-- 3. 驗證修改結果
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_class_type_abilities')
AND i.name = 'UQ_student_class_type_abilities_filtered';

PRINT N'=== 修改完成 ===';
PRINT N'1. 已刪除原有的唯一約束';
PRINT N'2. 已建立過濾唯一索引，允許多個 NULL 值';
PRINT N'3. 非 NULL 值仍然保持唯一性';
PRINT N'4. 可以新增多個空白班別記錄'; 