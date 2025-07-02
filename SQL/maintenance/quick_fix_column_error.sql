-- =====================================================
-- 快速修復腳本 - 處理 new_class_type 欄位錯誤
-- 創建日期: 2025-01-28
-- 說明: 專門處理「無效的資料行名稱 'new_class_type'」錯誤
-- =====================================================

PRINT '=== 快速修復：new_class_type 欄位錯誤 ===';

-- 檢查當前狀態
PRINT '檢查當前資料庫狀態...';

-- 1. 檢查是否有遺留的 new_class_type 欄位
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
BEGIN
    PRINT '發現遺留的 new_class_type 欄位，正在清理...';
    ALTER TABLE students DROP COLUMN new_class_type;
    PRINT '✓ 已清理 new_class_type 欄位';
END
ELSE
BEGIN
    PRINT '✓ 沒有發現 new_class_type 欄位';
END

-- 2. 檢查是否有不完整的外鍵約束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
BEGIN
    PRINT '發現外鍵約束，正在移除...';
    ALTER TABLE students DROP CONSTRAINT FK_students_class_type;
    PRINT '✓ 已移除外鍵約束';
END

-- 3. 檢查 class_types 表是否存在但遷移未完成
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
   AND EXISTS (SELECT * FROM students WHERE class_type IN (N'A班', N'B班', N'C班'))
BEGIN
    PRINT '發現未完成的遷移狀態，正在修正...';
    
    -- 直接更新學生表的班別代碼
    UPDATE students 
    SET class_type = CASE 
        WHEN class_type = N'A班' THEN N'CPP'
        WHEN class_type = N'B班' THEN N'SCRATCH'
        WHEN class_type = N'C班' THEN N'PROJECT'
        ELSE class_type
    END
    WHERE class_type IN (N'A班', N'B班', N'C班');
    
    PRINT '✓ 已更新班別代碼';
    
    -- 重新建立外鍵約束
    ALTER TABLE students 
    ADD CONSTRAINT FK_students_class_type 
    FOREIGN KEY (class_type) REFERENCES class_types(class_code);
    
    PRINT '✓ 已重新建立外鍵約束';
    
    -- 確保索引存在
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type' AND object_id = OBJECT_ID('students'))
    BEGIN
        CREATE INDEX IX_students_class_type ON students(class_type);
        PRINT '✓ 已建立班別索引';
    END
END

-- 4. 驗證修復結果
PRINT '';
PRINT '=== 修復驗證 ===';

-- 檢查班別分佈
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_type')
BEGIN
    SELECT 
        class_type AS '班別',
        COUNT(*) AS '學生人數'
    FROM students 
    GROUP BY class_type 
    ORDER BY class_type;
END

-- 檢查外鍵約束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
    PRINT '✓ 外鍵約束正常';
ELSE
    PRINT '⚠ 外鍵約束不存在（可能是因為 class_types 表不存在）';

-- 檢查索引
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type' AND object_id = OBJECT_ID('students'))
    PRINT '✓ 班別索引正常';
ELSE
    PRINT '⚠ 班別索引不存在';

PRINT '';
PRINT '=== 修復完成 ===';
PRINT '如果 class_types 表不存在，請執行：';
PRINT '1. create_class_types_table.sql';
PRINT '2. 然後重新執行 migrate_class_types_fixed.sql';
PRINT '';
PRINT '如果問題仍然存在，請執行 check_migration_status.sql 進行完整診斷'; 