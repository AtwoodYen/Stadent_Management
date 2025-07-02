-- =====================================================
-- 更新學生程度等級腳本
-- 創建日期: 2025-01-28
-- 說明: 將學生程度從原本的初級/中級/進階更新為新的五個等級
-- =====================================================

PRINT '=== 開始更新學生程度等級 ===';

-- 步驟1: 備份現有程度資料
IF OBJECT_ID('students_level_backup', 'U') IS NOT NULL
    DROP TABLE students_level_backup;

SELECT id, chinese_name, level_type as old_level_type
INTO students_level_backup
FROM students;

PRINT '已備份現有程度資料到 students_level_backup 表';

-- 步驟2: 更新程度資料
-- 將舊的程度對應到新的等級
UPDATE students 
SET level_type = CASE 
    WHEN level_type = N'初級' THEN N'新手'        -- 初級 -> 新手
    WHEN level_type = N'中級' THEN N'入門'        -- 中級 -> 入門
    WHEN level_type = N'進階' THEN N'進階'        -- 進階 -> 進階 (保持不變)
    ELSE N'新手'  -- 預設值
END;

PRINT '已更新學生程度等級';

-- 步驟3: 檢查更新結果
PRINT '=== 更新結果檢查 ===';
SELECT 
    old_level_type AS '原程度',
    level_type AS '新程度',
    COUNT(*) AS '學生人數'
FROM students s
INNER JOIN students_level_backup slb ON s.id = slb.id
GROUP BY old_level_type, level_type
ORDER BY old_level_type;

-- 步驟4: 顯示各等級學生分佈
PRINT '=== 各等級學生分佈 ===';
SELECT 
    level_type AS '程度等級',
    COUNT(*) AS '學生人數',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM students), 2) AS '百分比'
FROM students 
GROUP BY level_type
ORDER BY 
    CASE level_type
        WHEN N'新手' THEN 1
        WHEN N'入門' THEN 2
        WHEN N'進階' THEN 3
        WHEN N'高階' THEN 4
        WHEN N'精英' THEN 5
        ELSE 6
    END;

-- 步驟5: 驗證資料完整性
PRINT '=== 資料完整性檢查 ===';
SELECT 
    '總學生數' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
UNION ALL
SELECT 
    '有程度資料的學生' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
WHERE level_type IS NOT NULL AND level_type != '';

PRINT '';
PRINT '=== 更新完成 ===';
PRINT '1. 已備份原始程度資料到 students_level_backup 表';
PRINT '2. 已更新學生程度為新的五個等級';
PRINT '3. 新等級: 新手、入門、進階、高階、精英';
PRINT '4. 如確認更新無問題，可刪除備份表：DROP TABLE students_level_backup'; 