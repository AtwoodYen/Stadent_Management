-- =====================================================
-- 緊急學生程度修復腳本
-- 創建日期: 2025-01-28
-- 說明: 專門處理約束衝突的緊急修復腳本
-- =====================================================

PRINT '=== 開始緊急學生程度修復 ===';

-- 步驟1: 備份現有程度資料
IF OBJECT_ID('students_level_backup', 'U') IS NOT NULL
    DROP TABLE students_level_backup;

SELECT id, chinese_name, level_type as old_level_type
INTO students_level_backup
FROM students;

PRINT '已備份現有程度資料到 students_level_backup 表';

-- 步驟2: 強制移除所有程度相關約束
PRINT '強制移除所有程度相關約束...';

-- 移除新約束
BEGIN TRY
    ALTER TABLE students DROP CONSTRAINT CK_students_level_type;
    PRINT '已移除約束 CK_students_level_type';
END TRY
BEGIN CATCH
    PRINT '約束 CK_students_level_type 不存在或無法移除';
END CATCH

-- 移除舊約束
BEGIN TRY
    ALTER TABLE students DROP CONSTRAINT CK__students__level___34C8D9D1;
    PRINT '已移除約束 CK__students__level___34C8D9D1';
END TRY
BEGIN CATCH
    PRINT '約束 CK__students__level___34C8D9D1 不存在或無法移除';
END CATCH

-- 嘗試移除其他可能的約束
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'BEGIN TRY ALTER TABLE students DROP CONSTRAINT ' + CONSTRAINT_NAME + '; PRINT ''已移除約束 ' + CONSTRAINT_NAME + '''; END TRY BEGIN CATCH PRINT ''約束 ' + CONSTRAINT_NAME + ' 不存在或無法移除''; END CATCH' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'dbo' 
AND TABLE_NAME = 'students'
AND CONSTRAINT_TYPE = 'CHECK'
AND CONSTRAINT_NAME LIKE '%level%';

IF @sql != ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT '已嘗試移除所有程度相關約束';
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
BEGIN TRY
    ALTER TABLE students 
    ADD CONSTRAINT CK_students_level_type 
    CHECK (level_type IN (N'新手', N'入門', N'進階', N'高階', N'精英'));
    PRINT '已新增新約束 CK_students_level_type';
END TRY
BEGIN CATCH
    PRINT '無法新增約束，但資料已更新完成';
    PRINT '錯誤訊息: ' + ERROR_MESSAGE();
END CATCH

-- 步驟5: 驗證結果
PRINT '=== 修復結果驗證 ===';

-- 檢查資料更新
SELECT 
    old_level_type AS '原程度',
    level_type AS '新程度',
    COUNT(*) AS '學生人數'
FROM students s
INNER JOIN students_level_backup slb ON s.id = slb.id
GROUP BY old_level_type, level_type
ORDER BY old_level_type;

-- 檢查約束狀態
PRINT '';
PRINT '=== 約束狀態 ===';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'dbo' 
AND TABLE_NAME = 'students'
AND CONSTRAINT_TYPE = 'CHECK';

-- 檢查資料完整性
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
WHERE level_type IS NOT NULL AND level_type != '';

PRINT '';
PRINT '=== 緊急修復完成 ===';
PRINT '1. 已備份原始程度資料到 students_level_backup 表';
PRINT '2. 已強制移除所有程度相關約束';
PRINT '3. 已更新學生程度為新的五個等級';
PRINT '4. 已嘗試新增新的程度約束';
PRINT '5. 新等級: 新手、入門、進階、高階、精英';
PRINT '6. 如確認修復無問題，可刪除備份表：DROP TABLE students_level_backup'; 