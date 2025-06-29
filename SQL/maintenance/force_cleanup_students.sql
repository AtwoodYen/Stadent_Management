-- =====================================================
-- 強制清理students表 - 簡化版
-- 使用前請先備份資料庫！
-- =====================================================

USE [你的資料庫名];  -- 請修改為實際的資料庫名稱

GO

-- =====================================================
-- 1. 備份現有資料（如果需要）
-- =====================================================
/*
-- 取消註解以備份資料
IF OBJECT_ID('students_backup', 'U') IS NOT NULL
    DROP TABLE students_backup;

IF OBJECT_ID('students', 'U') IS NOT NULL
BEGIN
    SELECT * INTO students_backup FROM students;
    PRINT '已備份students表資料到students_backup';
END
*/

-- =====================================================
-- 2. 強制刪除所有相關約束和依賴
-- =====================================================

-- 禁用所有外鍵約束檢查
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- 刪除所有參照students表的外鍵約束
DECLARE @sql NVARCHAR(MAX) = '';

-- 找出所有相關的外鍵約束並生成刪除語句
SELECT @sql = @sql + 'ALTER TABLE [' + SCHEMA_NAME(t.schema_id) + '].[' + t.name + '] DROP CONSTRAINT [' + fk.name + '];' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE fk.referenced_object_id = OBJECT_ID('students')
   OR fk.parent_object_id = OBJECT_ID('students');

-- 執行刪除外鍵約束
IF LEN(@sql) > 0
BEGIN
    PRINT '刪除外鍵約束:';
    PRINT @sql;
    EXEC sp_executesql @sql;
END
ELSE
    PRINT '沒有找到相關的外鍵約束';

GO

-- =====================================================
-- 3. 刪除相關的觸發器
-- =====================================================
DECLARE @triggerSql NVARCHAR(MAX) = '';

SELECT @triggerSql = @triggerSql + 'DROP TRIGGER [' + t.name + '];' + CHAR(13)
FROM sys.triggers t
INNER JOIN sys.tables tb ON t.parent_id = tb.object_id
WHERE tb.name = 'students';

IF LEN(@triggerSql) > 0
BEGIN
    PRINT '刪除觸發器:';
    PRINT @triggerSql;
    EXEC sp_executesql @triggerSql;
END
ELSE
    PRINT '沒有找到相關的觸發器';

GO

-- =====================================================
-- 4. 強制刪除students表
-- =====================================================
IF OBJECT_ID('students', 'U') IS NOT NULL
BEGIN
    DROP TABLE students;
    PRINT '✅ students表已成功刪除';
END
ELSE
    PRINT 'ℹ️ students表不存在';

GO

-- =====================================================
-- 5. 恢復外鍵約束檢查
-- =====================================================
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

-- =====================================================
-- 6. 驗證清理結果
-- =====================================================
IF OBJECT_ID('students', 'U') IS NULL
    PRINT '✅ 清理成功！students表已完全刪除';
ELSE
    PRINT '❌ 清理失敗！students表仍然存在';

-- 檢查是否還有相關的外鍵約束
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    WHERE OBJECT_NAME(fk.referenced_object_id) = 'students'
       OR OBJECT_NAME(fk.parent_object_id) = 'students'
)
    PRINT '✅ 所有相關的外鍵約束已清理';
ELSE
    PRINT '⚠️ 仍有部分外鍵約束存在';

PRINT '=== 清理完成，可以執行新的建表腳本 ===';

GO 