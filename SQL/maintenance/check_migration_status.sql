-- =====================================================
-- 班別系統遷移狀態檢查腳本
-- 創建日期: 2025-01-28
-- 說明: 檢查班別系統遷移的當前狀態，幫助診斷問題
-- =====================================================

PRINT '=== 班別系統遷移狀態檢查 ===';
PRINT '';

-- 檢查1: 班別資料表是否存在
PRINT '1. 檢查 class_types 資料表...';
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
BEGIN
    PRINT '✓ class_types 資料表存在';
    
    -- 顯示班別資料
    SELECT 
        class_code AS '班別代碼',
        class_name AS '班別名稱',
        is_active AS '啟用狀態',
        sort_order AS '排序'
    FROM class_types 
    ORDER BY sort_order;
END
ELSE
BEGIN
    PRINT '✗ class_types 資料表不存在 - 需要先執行 create_class_types_table.sql';
END
PRINT '';

-- 檢查2: 學生表結構
PRINT '2. 檢查 students 表結構...';
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型別',
    CHARACTER_MAXIMUM_LENGTH AS '長度',
    IS_NULLABLE AS '可為空'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students' 
    AND COLUMN_NAME IN ('class_type', 'new_class_type')
ORDER BY COLUMN_NAME;

-- 檢查特定欄位狀態
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_type')
    PRINT '✓ class_type 欄位存在';
ELSE
    PRINT '✗ class_type 欄位不存在';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
    PRINT '⚠ new_class_type 欄位存在 (遷移過程中)';
ELSE
    PRINT '✓ new_class_type 欄位不存在 (正常狀態)';
PRINT '';

-- 檢查3: 備份表
PRINT '3. 檢查備份表...';
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'students_class_backup')
BEGIN
    PRINT '✓ students_class_backup 備份表存在';
    
    -- 顯示備份表內容統計
    SELECT 
        old_class_type AS '原始班別',
        COUNT(*) AS '學生人數'
    FROM students_class_backup 
    GROUP BY old_class_type 
    ORDER BY old_class_type;
END
ELSE
BEGIN
    PRINT '✗ students_class_backup 備份表不存在';
END
PRINT '';

-- 檢查4: 外鍵約束
PRINT '4. 檢查外鍵約束...';
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
BEGIN
    PRINT '✓ FK_students_class_type 外鍵約束存在';
    
    -- 顯示外鍵詳細資訊
    SELECT 
        fk.name AS '外鍵名稱',
        OBJECT_NAME(fk.parent_object_id) AS '子表',
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS '子表欄位',
        OBJECT_NAME(fk.referenced_object_id) AS '父表',
        COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS '父表欄位'
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    WHERE fk.name = 'FK_students_class_type';
END
ELSE
BEGIN
    PRINT '✗ FK_students_class_type 外鍵約束不存在';
END
PRINT '';

-- 檢查5: 索引
PRINT '5. 檢查索引...';
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type' AND object_id = OBJECT_ID('students'))
    PRINT '✓ IX_students_class_type 索引存在';
ELSE
    PRINT '✗ IX_students_class_type 索引不存在';
PRINT '';

-- 檢查6: 學生表的班別資料
PRINT '6. 檢查學生表班別資料...';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_type')
BEGIN
    -- 顯示班別統計
    SELECT 
        class_type AS '班別',
        COUNT(*) AS '學生人數'
    FROM students 
    GROUP BY class_type 
    ORDER BY class_type;
    
    -- 檢查是否有無效的班別代碼
    PRINT '';
    PRINT '檢查無效班別代碼...';
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
    BEGIN
        SELECT 
            s.class_type AS '無效班別代碼',
            COUNT(*) AS '學生人數'
        FROM students s
        LEFT JOIN class_types ct ON s.class_type = ct.class_code
        WHERE ct.class_code IS NULL
        GROUP BY s.class_type;
        
        IF @@ROWCOUNT = 0
            PRINT '✓ 所有班別代碼都有效';
    END
END
ELSE
BEGIN
    PRINT '✗ 無法檢查班別資料，class_type 欄位不存在';
END
PRINT '';

-- 檢查7: 判斷遷移狀態
PRINT '7. 遷移狀態判斷...';
DECLARE @migration_status NVARCHAR(50);

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
    SET @migration_status = N'尚未開始';
ELSE IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
    SET @migration_status = N'遷移中斷';
ELSE IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
    SET @migration_status = N'遷移未完成';
ELSE IF EXISTS (SELECT * FROM students s LEFT JOIN class_types ct ON s.class_type = ct.class_code WHERE ct.class_code IS NULL)
    SET @migration_status = N'資料有誤';
ELSE
    SET @migration_status = N'遷移完成';

PRINT '目前狀態: ' + @migration_status;
PRINT '';

-- 建議動作
PRINT '=== 建議動作 ===';
IF @migration_status = N'尚未開始'
BEGIN
    PRINT '1. 先執行 create_class_types_table.sql 建立班別資料表';
    PRINT '2. 再執行 migrate_class_types_fixed.sql 進行遷移';
END
ELSE IF @migration_status = N'遷移中斷'
BEGIN
    PRINT '1. 檢查錯誤訊息';
    PRINT '2. 執行 rollback_class_system.sql 回滾到原始狀態';
    PRINT '3. 重新執行 migrate_class_types_fixed.sql';
END
ELSE IF @migration_status = N'遷移未完成'
BEGIN
    PRINT '1. 手動執行缺少的步驟（外鍵約束、索引等）';
    PRINT '2. 或執行 rollback_class_system.sql 後重新遷移';
END
ELSE IF @migration_status = N'資料有誤'
BEGIN
    PRINT '1. 檢查上述無效班別代碼';
    PRINT '2. 手動修正資料或回滾重新遷移';
END
ELSE
BEGIN
    PRINT '✓ 系統狀態正常，可以開始使用新的班別系統';
END

PRINT '';
PRINT '=== 檢查完成 ==='; 