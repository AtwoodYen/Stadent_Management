-- =====================================================
-- 修正課程難度約束腳本
-- 創建日期: 2025-01-28
-- 說明: 將課程資料表的 level 欄位約束從舊的難度值改為新的難度值
-- =====================================================

PRINT '=== 開始修正課程難度約束 ===';

-- 步驟1: 檢查現有約束
PRINT '檢查現有約束...';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%courses%level%';

-- 步驟2: 移除舊的約束
PRINT '移除舊的課程難度約束...';
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'dbo' 
    AND CONSTRAINT_NAME = 'CHK_courses_level'
)
BEGIN
    ALTER TABLE courses 
    DROP CONSTRAINT CHK_courses_level;
    PRINT '已移除舊約束 CHK_courses_level';
END
ELSE
BEGIN
    PRINT '找不到指定的約束，嘗試移除所有課程難度相關約束...';
    
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE courses DROP CONSTRAINT ' + CONSTRAINT_NAME + ';' + CHAR(13)
    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'dbo' 
    AND CONSTRAINT_NAME LIKE '%courses%level%';
    
    IF @sql != ''
    BEGIN
        EXEC sp_executesql @sql;
        PRINT '已移除所有課程難度相關約束';
    END
    ELSE
    BEGIN
        PRINT '沒有找到課程難度相關約束';
    END
END

-- 步驟3: 更新現有課程的難度值
PRINT '更新現有課程的難度值...';
UPDATE courses 
SET level = CASE 
    WHEN level = N'初級' THEN N'新手'        -- 初級 -> 新手
    WHEN level = N'中級' THEN N'入門'        -- 中級 -> 入門
    WHEN level = N'高級' THEN N'高階'        -- 高級 -> 高階
    ELSE level  -- 保持其他值不變
END;

PRINT '已更新課程難度值';

-- 步驟4: 新增新的約束
PRINT '新增新的課程難度約束...';
ALTER TABLE courses 
ADD CONSTRAINT CHK_courses_level 
CHECK (level IN (N'新手', N'入門', N'進階', N'高階', N'精英'));

PRINT '已新增新約束 CHK_courses_level';

-- 步驟5: 檢查更新結果
PRINT '=== 更新結果檢查 ===';
SELECT 
    level AS '難度等級',
    COUNT(*) AS '課程數量'
FROM courses 
GROUP BY level
ORDER BY 
    CASE level
        WHEN N'新手' THEN 1
        WHEN N'入門' THEN 2
        WHEN N'進階' THEN 3
        WHEN N'高階' THEN 4
        WHEN N'精英' THEN 5
        ELSE 6
    END;

-- 步驟6: 驗證約束
PRINT '';
PRINT '=== 約束驗證 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%courses%level%';

-- 步驟7: 顯示課程資料範例
PRINT '';
PRINT '=== 課程資料範例 (前10筆) ===';
SELECT TOP 10
    id,
    name,
    category,
    level AS '難度',
    duration_minutes,
    price
FROM courses
ORDER BY id;

PRINT '';
PRINT '=== 課程難度約束修正完成 ===';
PRINT '1. 已移除舊的難度約束 (初級、中級、高級)';
PRINT '2. 已更新現有課程的難度值';
PRINT '3. 已新增新的難度約束 (新手、入門、進階、高階、精英)';
PRINT '4. 新難度值與前端和後端 API 一致'; 