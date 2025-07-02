-- =====================================================
-- 完整學生程度等級更新腳本
-- 創建日期: 2025-01-28
-- 說明: 包含約束修正和資料更新的完整腳本
-- =====================================================

PRINT '=== 開始完整學生程度等級更新 ===';

-- 步驟1: 備份現有程度資料
IF OBJECT_ID('students_level_backup', 'U') IS NOT NULL
    DROP TABLE students_level_backup;

SELECT id, chinese_name, level_type as old_level_type
INTO students_level_backup
FROM students;

PRINT '已備份現有程度資料到 students_level_backup 表';

-- 步驟2: 移除舊的約束
PRINT '移除舊的程度約束...';
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'dbo' 
    AND CONSTRAINT_NAME = 'CK__students__level___34C8D9D1'
)
BEGIN
    ALTER TABLE students 
    DROP CONSTRAINT CK__students__level___34C8D9D1;
    PRINT '已移除舊約束 CK__students__level___34C8D9D1';
END
ELSE
BEGIN
    PRINT '找不到指定的約束，嘗試移除所有程度相關約束...';
    
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE students DROP CONSTRAINT ' + CONSTRAINT_NAME + ';' + CHAR(13)
    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'dbo' 
    AND CONSTRAINT_NAME LIKE '%level%';
    
    IF @sql != ''
    BEGIN
        EXEC sp_executesql @sql;
        PRINT '已移除所有程度相關約束';
    END
    ELSE
    BEGIN
        PRINT '沒有找到程度相關約束';
    END
END

-- 步驟3: 更新程度資料
PRINT '更新學生程度等級...';
UPDATE students 
SET level_type = CASE 
    WHEN level_type = N'初級' THEN N'新手'        -- 初級 -> 新手
    WHEN level_type = N'中級' THEN N'入門'        -- 中級 -> 入門
    WHEN level_type = N'進階' THEN N'進階'        -- 進階 -> 進階 (保持不變)
    ELSE N'新手'  -- 預設值
END;

PRINT '已更新學生程度等級';

-- 步驟4: 新增新的約束
PRINT '新增新的程度約束...';
ALTER TABLE students 
ADD CONSTRAINT CK_students_level_type 
CHECK (level_type IN (N'新手', N'入門', N'進階', N'高階', N'精英'));

PRINT '已新增新約束 CK_students_level_type';

-- 步驟5: 檢查更新結果
PRINT '=== 更新結果檢查 ===';
SELECT 
    old_level_type AS '原程度',
    level_type AS '新程度',
    COUNT(*) AS '學生人數'
FROM students s
INNER JOIN students_level_backup slb ON s.id = slb.id
GROUP BY old_level_type, level_type
ORDER BY old_level_type;

-- 步驟6: 顯示各等級學生分佈
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

-- 步驟7: 驗證資料完整性
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

-- 步驟8: 驗證約束
PRINT '=== 約束驗證 ===';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%level%';

PRINT '';
PRINT '=== 完整更新完成 ===';
PRINT '1. 已備份原始程度資料到 students_level_backup 表';
PRINT '2. 已移除舊的程度約束';
PRINT '3. 已更新學生程度為新的五個等級';
PRINT '4. 已新增新的程度約束';
PRINT '5. 新等級: 新手、入門、進階、高階、精英';
PRINT '6. 如確認更新無問題，可刪除備份表：DROP TABLE students_level_backup'; 