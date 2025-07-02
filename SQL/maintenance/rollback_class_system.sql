-- =====================================================
-- 班別系統回滾腳本
-- 創建日期: 2025-01-28
-- 說明: 將班別系統回滾到舊的 A班、B班、C班 狀態
-- =====================================================

PRINT '=== 開始班別系統回滾 ===';

-- 步驟1: 檢查備份表是否存在
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'students_class_backup')
BEGIN
    PRINT '錯誤: students_class_backup 備份表不存在，無法回滾';
    RETURN;
END

-- 步驟2: 檢查當前學生表結構
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'new_class_type')
BEGIN
    -- 如果還在遷移過程中，直接刪除新欄位
    ALTER TABLE students DROP COLUMN new_class_type;
    PRINT '已刪除 new_class_type 欄位';
END

-- 步驟3: 移除外鍵約束
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_students_class_type')
BEGIN
    ALTER TABLE students DROP CONSTRAINT FK_students_class_type;
    PRINT '已移除外鍵約束';
END

-- 步驟4: 移除班別索引
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_type' AND object_id = OBJECT_ID('students'))
BEGIN
    DROP INDEX IX_students_class_type ON students;
    PRINT '已移除班別索引';
END

-- 步驟5: 新增臨時欄位來存放舊的班別
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'temp_old_class_type')
BEGIN
    ALTER TABLE students ADD temp_old_class_type NVARCHAR(10);
    PRINT '已新增臨時欄位 temp_old_class_type';
END

-- 步驟6: 從當前班別代碼回滾到舊班別名稱
UPDATE students 
SET temp_old_class_type = CASE 
    WHEN class_type = N'CPP' THEN N'A班'        -- C/C++ -> A班
    WHEN class_type = N'SCRATCH' THEN N'B班'    -- Scratch -> B班
    WHEN class_type = N'PROJECT' THEN N'C班'    -- 專題製作 -> C班
    WHEN class_type = N'APCS_A' THEN N'A班'     -- APCS A -> A班
    WHEN class_type = N'APCS_P' THEN N'A班'     -- APCS P -> A班
    WHEN class_type = N'ANIMATION' THEN N'C班'  -- 動畫美術 -> C班
    ELSE N'A班'  -- 預設值
END;

PRINT '已將新班別代碼對應回舊班別名稱';

-- 步驟7: 刪除現有的 class_type 欄位
ALTER TABLE students DROP COLUMN class_type;
PRINT '已刪除新的 class_type 欄位';

-- 步驟8: 重新命名臨時欄位
EXEC sp_rename 'students.temp_old_class_type', 'class_type', 'COLUMN';
PRINT '已恢復 class_type 欄位為舊格式';

-- 步驟9: 重新建立舊的索引
CREATE INDEX IX_students_class_type ON students(class_type);
PRINT '已重新建立班別索引';

-- 步驟10: 驗證回滾結果
PRINT '=== 回滾驗證 ===';
SELECT 
    class_type AS '班別',
    COUNT(*) AS '學生人數'
FROM students
GROUP BY class_type
ORDER BY class_type;

-- 步驟11: 檢查與備份表的一致性
PRINT '=== 與備份表比較 ===';
SELECT 
    '現在' AS '狀態',
    s.class_type AS '班別',
    COUNT(*) AS '學生人數'
FROM students s
GROUP BY s.class_type
UNION ALL
SELECT 
    '備份' AS '狀態',
    scb.old_class_type AS '班別',
    COUNT(*) AS '學生人數'
FROM students_class_backup scb
GROUP BY scb.old_class_type
ORDER BY 狀態, 班別;

-- 步驟12: 刪除班別資料表（可選）
PRINT '是否要刪除 class_types 資料表？';
PRINT '如要刪除，請手動執行：DROP TABLE class_types;';

PRINT '=== 回滾完成 ===';
PRINT '1. 已恢復舊的班別格式 (A班、B班、C班)';
PRINT '2. 已移除新班別系統的約束和索引';
PRINT '3. 學生資料已恢復到遷移前狀態';
PRINT '4. 備份表 students_class_backup 仍然保留';
PRINT '5. 如需刪除備份表，請執行：DROP TABLE students_class_backup'; 