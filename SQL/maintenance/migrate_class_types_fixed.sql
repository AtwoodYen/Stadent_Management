-- =====================================================
-- 班別系統遷移腳本 (修正版)
-- 創建日期: 2025-01-28
-- 說明: 將現有學生資料的班別欄位遷移到新的班別系統
-- =====================================================

-- 步驟1: 檢查班別資料表是否存在
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
BEGIN
    PRINT '錯誤: class_types 資料表不存在，請先執行 create_class_types_table.sql';
    RETURN;
END

PRINT '=== 開始班別系統遷移 ===';

-- 步驟2: 備份現有學生資料的班別資料
IF OBJECT_ID('students_class_backup', 'U') IS NOT NULL
    DROP TABLE students_class_backup;

SELECT id, chinese_name, class_type as old_class_type
INTO students_class_backup
FROM students;

PRINT '已備份現有學生班別資料到 students_class_backup 表';

-- 步驟3: 檢查並新增臨時欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
BEGIN
    ALTER TABLE students ADD new_class_type NVARCHAR(20);
    PRINT '已新增 new_class_type 欄位';
END
ELSE
BEGIN
    PRINT 'new_class_type 欄位已存在，跳過建立';
END

-- 步驟4: 根據舊的班別資料映射到新的班別代碼
UPDATE students 
SET new_class_type = CASE 
    WHEN class_type = N'A班' THEN N'CPP'        -- A班 -> C/C++
    WHEN class_type = N'B班' THEN N'SCRATCH'    -- B班 -> Scratch  
    WHEN class_type = N'C班' THEN N'PROJECT'    -- C班 -> 專題製作
    ELSE N'SCRATCH'  -- 預設值
END;

PRINT '已將舊班別對應到新班別代碼';

-- 步驟5: 檢查對應結果 (修正版)
PRINT '=== 班別對應檢查 ===';
SELECT 
    scb.old_class_type AS '舊班別',
    s.new_class_type AS '新班別代碼',
    ct.class_name AS '新班別名稱',
    COUNT(*) AS '學生人數'
FROM students s
INNER JOIN students_class_backup scb ON s.id = scb.id
LEFT JOIN class_types ct ON s.new_class_type = ct.class_code
GROUP BY scb.old_class_type, s.new_class_type, ct.class_name
ORDER BY scb.old_class_type;

-- 步驟6: 檢查是否有無效的新班別代碼
PRINT '=== 檢查無效班別代碼 ===';
SELECT 
    s.id,
    s.chinese_name,
    s.new_class_type AS '無效的班別代碼'
FROM students s
LEFT JOIN class_types ct ON s.new_class_type = ct.class_code
WHERE ct.class_code IS NULL;

-- 如果有無效代碼，停止執行
IF @@ROWCOUNT > 0
BEGIN
    PRINT '錯誤: 發現無效的班別代碼，請檢查上述記錄';
    RETURN;
END

PRINT '所有班別代碼都有效，繼續執行';

-- 步驟7: 刪除舊的 class_type 欄位上的索引
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type' AND object_id = OBJECT_ID('students'))
BEGIN
    DROP INDEX IX_students_class_type ON students;
    PRINT '已刪除舊的班別索引';
END

-- 步驟8: 刪除舊欄位
ALTER TABLE students DROP COLUMN class_type;
PRINT '已刪除舊的 class_type 欄位';

-- 步驟9: 重新命名新欄位
EXEC sp_rename 'students.new_class_type', 'class_type', 'COLUMN';
PRINT '已重新命名 new_class_type 為 class_type';

-- 步驟10: 建立外鍵約束
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
BEGIN
    ALTER TABLE students 
    ADD CONSTRAINT FK_students_class_type 
    FOREIGN KEY (class_type) REFERENCES class_types(class_code);
    PRINT '已建立學生表與班別表的外鍵約束';
END

-- 步驟11: 重新建立索引
CREATE INDEX IX_students_class_type ON students(class_type);
PRINT '已重新建立班別索引';

-- 步驟12: 最終驗證
PRINT '=== 最終驗證 ===';
SELECT 
    s.chinese_name AS '學生姓名',
    s.class_type AS '班別代碼',
    ct.class_name AS '班別名稱',
    ct.description AS '班別描述'
FROM students s
INNER JOIN class_types ct ON s.class_type = ct.class_code
ORDER BY ct.sort_order, s.chinese_name;

-- 統計結果
PRINT '=== 遷移統計 ===';
SELECT 
    ct.class_name AS '班別名稱',
    COUNT(s.id) AS '學生人數'
FROM class_types ct
LEFT JOIN students s ON ct.class_code = s.class_type
WHERE ct.is_active = 1
GROUP BY ct.class_name, ct.sort_order
ORDER BY ct.sort_order;

PRINT '=== 遷移完成 ===';
PRINT '1. 已建立班別資料表關聯';
PRINT '2. 已更新學生資料的班別欄位';
PRINT '3. 已建立外鍵約束確保資料完整性';
PRINT '4. 舊資料已備份到 students_class_backup 表';
PRINT '5. 如確認遷移無問題，可刪除備份表：DROP TABLE students_class_backup'; 