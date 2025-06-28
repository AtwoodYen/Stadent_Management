-- =====================================================
-- 安全刪除現有學生資料表和相關關聯
-- 使用前請先備份資料庫！
-- =====================================================

-- 設定為不檢查外鍵約束（暫時）
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"

GO

-- =====================================================
-- 1. 查詢現有的外鍵約束
-- =====================================================
PRINT '=== 查詢現有的外鍵約束 ===';

SELECT 
    fk.name AS '外鍵名稱',
    OBJECT_NAME(fk.parent_object_id) AS '子表',
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS '子表欄位',
    OBJECT_NAME(fk.referenced_object_id) AS '父表',
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS '父表欄位'
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.referenced_object_id) = 'students'
   OR OBJECT_NAME(fk.parent_object_id) = 'students'
ORDER BY fk.name;

GO

-- =====================================================
-- 2. 自動刪除所有相關的外鍵約束
-- =====================================================
PRINT '=== 刪除相關的外鍵約束 ===';

-- 刪除參照students表的外鍵
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + '].[' + OBJECT_NAME(fk.parent_object_id) + '] DROP CONSTRAINT [' + fk.name + '];' + CHAR(13)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.referenced_object_id) = 'students';

IF @sql != ''
BEGIN
    PRINT '刪除參照students表的外鍵約束:';
    PRINT @sql;
    EXEC sp_executesql @sql;
END
ELSE
    PRINT '沒有找到參照students表的外鍵約束';

-- 刪除students表中的外鍵
SET @sql = '';
SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + '].[' + OBJECT_NAME(fk.parent_object_id) + '] DROP CONSTRAINT [' + fk.name + '];' + CHAR(13)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) = 'students';

IF @sql != ''
BEGIN
    PRINT '刪除students表中的外鍵約束:';
    PRINT @sql;
    EXEC sp_executesql @sql;
END
ELSE
    PRINT '沒有找到students表中的外鍵約束';

GO

-- =====================================================
-- 3. 刪除相關的索引（非主鍵索引）
-- =====================================================
PRINT '=== 刪除相關的索引 ===';

DECLARE @dropIndexSql NVARCHAR(MAX) = '';
SELECT @dropIndexSql = @dropIndexSql + 'DROP INDEX [' + i.name + '] ON [' + OBJECT_SCHEMA_NAME(i.object_id) + '].[' + OBJECT_NAME(i.object_id) + '];' + CHAR(13)
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) = 'students'
  AND i.is_primary_key = 0
  AND i.is_unique_constraint = 0
  AND i.type > 0;

IF @dropIndexSql != ''
BEGIN
    PRINT '刪除students表的索引:';
    PRINT @dropIndexSql;
    EXEC sp_executesql @dropIndexSql;
END
ELSE
    PRINT '沒有找到需要刪除的索引';

GO

-- =====================================================
-- 4. 刪除相關的觸發器
-- =====================================================
PRINT '=== 刪除相關的觸發器 ===';

DECLARE @dropTriggerSql NVARCHAR(MAX) = '';
SELECT @dropTriggerSql = @dropTriggerSql + 'DROP TRIGGER [' + t.name + '];' + CHAR(13)
FROM sys.triggers t
INNER JOIN sys.tables tb ON t.parent_id = tb.object_id
WHERE tb.name = 'students';

IF @dropTriggerSql != ''
BEGIN
    PRINT '刪除students表的觸發器:';
    PRINT @dropTriggerSql;
    EXEC sp_executesql @dropTriggerSql;
END
ELSE
    PRINT '沒有找到需要刪除的觸發器';

GO

-- =====================================================
-- 5. 刪除相關的檢視（如果有的話）
-- =====================================================
PRINT '=== 檢查相關的檢視 ===';

SELECT 
    v.name AS '檢視名稱',
    v.create_date AS '建立日期'
FROM sys.views v
INNER JOIN sys.sql_dependencies d ON v.object_id = d.object_id
WHERE d.referenced_major_id = OBJECT_ID('students');

-- 注意：檢視需要手動檢查和刪除，因為可能影響其他功能

GO

-- =====================================================
-- 6. 備份現有資料（可選）
-- =====================================================
PRINT '=== 備份現有資料 ===';

-- 如果需要備份資料，請取消以下註解
/*
IF OBJECT_ID('students_backup', 'U') IS NOT NULL
    DROP TABLE students_backup;

SELECT * INTO students_backup FROM students;
PRINT '已將students表資料備份到students_backup表';
*/

GO

-- =====================================================
-- 7. 最終刪除students表
-- =====================================================
PRINT '=== 刪除students表 ===';

IF OBJECT_ID('students', 'U') IS NOT NULL
BEGIN
    DROP TABLE students;
    PRINT 'students表已成功刪除';
END
ELSE
    PRINT 'students表不存在';

GO

-- =====================================================
-- 8. 恢復外鍵約束檢查
-- =====================================================
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"

GO

-- =====================================================
-- 9. 檢查清理結果
-- =====================================================
PRINT '=== 清理結果檢查 ===';

-- 檢查students表是否還存在
IF OBJECT_ID('students', 'U') IS NULL
    PRINT '✅ students表已成功刪除';
ELSE
    PRINT '❌ students表仍然存在，可能有未解決的依賴關係';

-- 檢查是否還有相關的外鍵約束
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    WHERE OBJECT_NAME(fk.referenced_object_id) = 'students'
       OR OBJECT_NAME(fk.parent_object_id) = 'students'
)
    PRINT '✅ 所有相關的外鍵約束已清理';
ELSE
    PRINT '❌ 仍有相關的外鍵約束存在';

GO

-- =====================================================
-- 手動清理指令（如果自動清理失敗）
-- =====================================================
/*
-- 如果自動清理失敗，可以使用以下手動指令：

-- 1. 手動刪除特定外鍵約束
-- ALTER TABLE [表名] DROP CONSTRAINT [外鍵約束名];

-- 2. 手動刪除特定索引
-- DROP INDEX [索引名] ON [表名];

-- 3. 手動刪除特定觸發器
-- DROP TRIGGER [觸發器名];

-- 4. 強制刪除表（最後手段）
-- DROP TABLE students;

-- 5. 查看所有相關物件
SELECT 
    o.name AS '物件名稱',
    o.type_desc AS '物件類型',
    o.create_date AS '建立日期'
FROM sys.objects o
WHERE o.name LIKE '%student%'
   OR o.name LIKE '%Student%';
*/

PRINT '=== 清理腳本執行完成 ===';
PRINT '如果仍有問題，請檢查手動清理指令部分'; 