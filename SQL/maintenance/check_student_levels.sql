-- =====================================================
-- 檢查學生程度分佈腳本
-- 創建日期: 2025-01-28
-- 說明: 檢查目前學生程度的分布情況
-- =====================================================

PRINT '=== 學生程度分佈檢查 ===';

-- 檢查目前程度分佈
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
        WHEN N'初級' THEN 6
        WHEN N'中級' THEN 7
        ELSE 8
    END;

-- 檢查是否有空值或無效值
PRINT '';
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
WHERE level_type IS NOT NULL AND level_type != ''
UNION ALL
SELECT 
    '無程度資料的學生' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
WHERE level_type IS NULL OR level_type = '';

-- 檢查備份表是否存在
PRINT '';
PRINT '=== 備份表檢查 ===';
IF OBJECT_ID('students_level_backup', 'U') IS NOT NULL
BEGIN
    PRINT '備份表 students_level_backup 存在';
    SELECT 
        '備份表記錄數' AS '檢查項目',
        COUNT(*) AS '數量'
    FROM students_level_backup;
END
ELSE
BEGIN
    PRINT '備份表 students_level_backup 不存在';
END

-- 顯示前10筆學生資料作為範例
PRINT '';
PRINT '=== 學生資料範例 (前10筆) ===';
SELECT TOP 10
    id,
    chinese_name,
    english_name,
    level_type AS '程度',
    class_type AS '班別',
    school,
    grade
FROM students
ORDER BY id; 