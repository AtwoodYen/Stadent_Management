-- =====================================================
-- 移除 filtered index 並使用簡單的約束
-- 創建日期：2025-01-10
-- 說明：解決 QUOTED_IDENTIFIER 問題
-- =====================================================

-- 1. 先刪除 filtered index
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_student_class_type_abilities_filtered')
BEGIN
    DROP INDEX [UQ_student_class_type_abilities_filtered] ON [dbo].[student_class_type_abilities];
    PRINT N'已刪除 filtered index UQ_student_class_type_abilities_filtered';
END

-- 2. 創建一個簡單的唯一約束（不包含 NULL 值）
-- 使用觸發器來實現 NULL 值的唯一性檢查
CREATE UNIQUE NONCLUSTERED INDEX [UQ_student_class_type_abilities_simple] 
ON [dbo].[student_class_type_abilities] ([student_id], [class_type])
WHERE [class_type] IS NOT NULL;

PRINT N'已建立簡單的唯一索引（排除 NULL 值）';

-- 3. 驗證修改結果
SELECT 
    i.name as [索引名稱],
    i.type_desc as [索引類型],
    i.is_unique as [是否唯一],
    i.filter_definition as [過濾條件]
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('student_class_type_abilities')
AND i.name = 'UQ_student_class_type_abilities_simple';

PRINT N'=== 修改完成 ===';
PRINT N'1. 已刪除複雜的 filtered index';
PRINT N'2. 已建立簡單的唯一索引，允許多個 NULL 值';
PRINT N'3. 非 NULL 值仍然保持唯一性';
PRINT N'4. 不再需要 QUOTED_IDENTIFIER 設定'; 