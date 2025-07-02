-- =====================================================
-- 班別系統遷移腳本
-- 創建日期: 2025-01-28
-- 說明: 將現有學生資料的班別欄位遷移到新的班別系統
-- =====================================================

-- 步驟1: 先建立班別資料表（如果還沒建立）
-- 請先執行 create_class_types_table.sql

-- 步驟2: 備份現有學生資料的班別資料
IF OBJECT_ID('students_class_backup', 'U') IS NOT NULL
    DROP TABLE students_class_backup;

SELECT id, chinese_name, class_type as old_class_type
INTO students_class_backup
FROM students;

PRINT '已備份現有學生班別資料到 students_class_backup 表';

-- 步驟3: 新增臨時欄位來存放新的班別代碼
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
BEGIN
    ALTER TABLE students ADD new_class_type NVARCHAR(20);
    PRINT '已新增 new_class_type 欄位';
END

-- 步驟4: 根據舊的班別資料映射到新的班別代碼
-- 將舊的 A班、B班、C班 對應到新的班別系統
UPDATE students 
SET new_class_type = CASE 
    WHEN class_type = N'A班' THEN N'CPP'        -- A班 -> C/C++
    WHEN class_type = N'B班' THEN N'SCRATCH'    -- B班 -> Scratch  
    WHEN class_type = N'C班' THEN N'PROJECT'    -- C班 -> 專題製作
    ELSE N'SCRATCH'  -- 預設值
END;

PRINT '已將舊班別對應到新班別代碼';

-- 步驟5: 檢查對應結果
SELECT 
    old_class_type AS '舊班別',
    new_class_type AS '新班別代碼',
    ct.class_name AS '新班別名稱',
    COUNT(*) AS '學生人數'
FROM students s
LEFT JOIN students_class_backup scb ON s.id = scb.id
LEFT JOIN class_types ct ON s.new_class_type = ct.class_code
GROUP BY old_class_type, new_class_type, ct.class_name
ORDER BY old_class_type;

-- 步驟6: 刪除舊的班別欄位，重新命名新欄位
-- 先刪除舊的 class_type 欄位上的索引
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type')
BEGIN
    DROP INDEX IX_students_class_type ON students;
    PRINT '已刪除舊的班別索引';
END

-- 刪除舊欄位
ALTER TABLE students DROP COLUMN class_type;
PRINT '已刪除舊的 class_type 欄位';

-- 重新命名新欄位
EXEC sp_rename 'students.new_class_type', 'class_type', 'COLUMN';
PRINT '已重新命名 new_class_type 為 class_type';

-- 步驟7: 建立外鍵約束（可選，建議建立以確保資料完整性）
ALTER TABLE students 
ADD CONSTRAINT FK_students_class_type 
FOREIGN KEY (class_type) REFERENCES class_types(class_code);

PRINT '已建立學生表與班別表的外鍵約束';

-- 步驟8: 重新建立索引
CREATE INDEX IX_students_class_type ON students(class_type);
PRINT '已重新建立班別索引';

-- 步驟9: 驗證遷移結果
SELECT 
    s.chinese_name AS '學生姓名',
    s.class_type AS '班別代碼',
    ct.class_name AS '班別名稱',
    ct.description AS '班別描述'
FROM students s
INNER JOIN class_types ct ON s.class_type = ct.class_code
ORDER BY ct.sort_order, s.chinese_name;

PRINT '=== 遷移完成 ===';
PRINT '1. 已建立班別資料表';
PRINT '2. 已更新學生資料的班別欄位';
PRINT '3. 已建立外鍵約束確保資料完整性';
PRINT '4. 舊資料已備份到 students_class_backup 表';
PRINT '5. 如確認遷移無問題，可刪除備份表：DROP TABLE students_class_backup'; 