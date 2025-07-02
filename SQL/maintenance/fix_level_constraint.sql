-- =====================================================
-- 修正學生程度約束腳本
-- 創建日期: 2025-01-28
-- 說明: 移除舊的程度約束並新增新的約束
-- =====================================================

PRINT '=== 開始修正程度約束 ===';

-- 步驟1: 檢查現有約束
PRINT '檢查現有約束...';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%level%';

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

-- 步驟3: 新增新的約束
PRINT '新增新的程度約束...';
ALTER TABLE students 
ADD CONSTRAINT CK_students_level_type 
CHECK (level_type IN (N'新手', N'入門', N'進階', N'高階', N'精英'));

PRINT '已新增新約束 CK_students_level_type';

-- 步驟4: 驗證約束
PRINT '驗證新約束...';
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%level%';

PRINT '';
PRINT '=== 約束修正完成 ===';
PRINT '現在可以執行 update_student_levels.sql 腳本'; 