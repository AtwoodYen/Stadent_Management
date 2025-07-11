-- =====================================================
-- 修改 student_class_type_abilities 表允許 class_type 為 NULL
-- 創建日期：2025-01-10
-- 說明：允許新增空白班別記錄，用戶可以稍後選擇班別
-- =====================================================

-- 1. 先刪除唯一約束（因為 NULL 值會影響唯一性檢查）
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UQ_student_class_type_abilities]') AND type = 'UQ')
BEGIN
    ALTER TABLE [dbo].[student_class_type_abilities] 
    DROP CONSTRAINT [UQ_student_class_type_abilities];
    PRINT N'已刪除唯一約束 UQ_student_class_type_abilities';
END

-- 2. 修改 class_type 欄位允許 NULL
ALTER TABLE [dbo].[student_class_type_abilities] 
ALTER COLUMN [class_type] NVARCHAR(50) NULL;

PRINT N'已修改 class_type 欄位允許 NULL 值';

-- 3. 重新建立唯一約束（排除 NULL 值）
ALTER TABLE [dbo].[student_class_type_abilities] 
ADD CONSTRAINT [UQ_student_class_type_abilities] 
UNIQUE ([student_id], [class_type]);

PRINT N'已重新建立唯一約束（排除 NULL 值）';

-- 4. 驗證修改結果
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'student_class_type_abilities' 
AND COLUMN_NAME = 'class_type';

PRINT N'=== 修改完成 ===';
PRINT N'1. class_type 欄位現在允許 NULL 值';
PRINT N'2. 唯一約束已重新建立，允許多個 NULL 值';
PRINT N'3. 可以新增空白班別記錄供用戶稍後選擇'; 