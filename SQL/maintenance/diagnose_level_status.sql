-- =====================================================
-- 診斷學生程度狀態腳本
-- 創建日期: 2025-01-28
-- 說明: 檢查目前的程度資料和約束狀態
-- =====================================================

PRINT '=== 診斷學生程度狀態 ===';

-- 檢查1: 目前程度分佈
PRINT '=== 1. 目前程度分佈 ===';
SELECT 
    level_type AS '程度等級',
    COUNT(*) AS '學生人數',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM students), 2) AS '百分比'
FROM students 
GROUP BY level_type
ORDER BY level_type;

-- 檢查2: 約束狀態
PRINT '';
PRINT '=== 2. 約束狀態 ===';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'dbo' 
AND TABLE_NAME = 'students'
AND CONSTRAINT_TYPE = 'CHECK';

-- 檢查3: 是否有衝突的資料
PRINT '';
PRINT '=== 3. 檢查是否有衝突的資料 ===';
SELECT 
    '舊程度資料' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
WHERE level_type IN (N'初級', N'中級', N'進階')
UNION ALL
SELECT 
    '新程度資料' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
WHERE level_type IN (N'新手', N'入門', N'進階', N'高階', N'精英')
UNION ALL
SELECT 
    '其他程度資料' AS '檢查項目',
    COUNT(*) AS '數量'
FROM students
WHERE level_type NOT IN (N'初級', N'中級', N'進階', N'新手', N'入門', N'進階', N'高階', N'精英')
AND level_type IS NOT NULL;

-- 檢查4: 備份表狀態
PRINT '';
PRINT '=== 4. 備份表狀態 ===';
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

-- 檢查5: 建議操作
PRINT '';
PRINT '=== 5. 建議操作 ===';

-- 檢查是否有新約束但舊資料
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'dbo' 
    AND TABLE_NAME = 'students'
    AND CONSTRAINT_NAME = 'CK_students_level_type'
)
AND EXISTS (
    SELECT * FROM students 
    WHERE level_type IN (N'初級', N'中級')
)
BEGIN
    PRINT '⚠️  發現問題：有新約束但仍有舊程度資料';
    PRINT '建議：執行 safe_level_update.sql 腳本';
END
ELSE IF EXISTS (
    SELECT * FROM students 
    WHERE level_type IN (N'新手', N'入門', N'進階', N'高階', N'精英')
)
BEGIN
    PRINT '✅ 資料已更新為新程度等級';
    PRINT '建議：檢查前端功能是否正常';
END
ELSE
BEGIN
    PRINT '📝 資料仍為舊程度等級';
    PRINT '建議：執行 safe_level_update.sql 腳本進行更新';
END

PRINT '';
PRINT '=== 診斷完成 ==='; 