-- =====================================================
-- 回滾學生程度等級腳本
-- 創建日期: 2025-01-28
-- 說明: 將學生程度從新的五個等級回滾到原本的三個等級
-- =====================================================

PRINT '=== 開始回滾學生程度等級 ===';

-- 檢查備份表是否存在
IF OBJECT_ID('students_level_backup', 'U') IS NULL
BEGIN
    PRINT '錯誤: 找不到備份表 students_level_backup';
    PRINT '無法執行回滾操作';
    RETURN;
END

-- 回滾程度資料
UPDATE students 
SET level_type = CASE 
    WHEN slb.old_level_type = N'新手' THEN N'初級'        -- 新手 -> 初級
    WHEN slb.old_level_type = N'入門' THEN N'中級'        -- 入門 -> 中級
    WHEN slb.old_level_type = N'進階' THEN N'進階'        -- 進階 -> 進階 (保持不變)
    WHEN slb.old_level_type = N'高階' THEN N'進階'        -- 高階 -> 進階
    WHEN slb.old_level_type = N'精英' THEN N'進階'        -- 精英 -> 進階
    ELSE N'初級'  -- 預設值
END
FROM students s
INNER JOIN students_level_backup slb ON s.id = slb.id;

PRINT '已回滾學生程度等級';

-- 檢查回滾結果
PRINT '=== 回滾結果檢查 ===';
SELECT 
    slb.old_level_type AS '原程度',
    s.level_type AS '回滾後程度',
    COUNT(*) AS '學生人數'
FROM students s
INNER JOIN students_level_backup slb ON s.id = slb.id
GROUP BY slb.old_level_type, s.level_type
ORDER BY slb.old_level_type;

-- 顯示各等級學生分佈
PRINT '=== 各等級學生分佈 ===';
SELECT 
    level_type AS '程度等級',
    COUNT(*) AS '學生人數',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM students), 2) AS '百分比'
FROM students 
GROUP BY level_type
ORDER BY 
    CASE level_type
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'進階' THEN 3
        ELSE 4
    END;

PRINT '';
PRINT '=== 回滾完成 ===';
PRINT '1. 已將學生程度回滾到原本的三個等級';
PRINT '2. 原本等級: 初級、中級、進階';
PRINT '3. 備份表 students_level_backup 仍然保留';
PRINT '4. 如確認回滾無問題，可刪除備份表：DROP TABLE students_level_backup'; 