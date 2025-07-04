-- =====================================================
-- 移除分類代碼開頭底線腳本
-- 將所有以底線開頭的分類代碼修改為不帶底線
-- =====================================================

USE Student_Management;
GO

PRINT N'開始移除分類代碼開頭的底線...';
GO

-- =====================================================
-- 1. 檢查需要修改的分類代碼
-- =====================================================

PRINT N'1. 檢查需要修改的分類代碼：';
SELECT 
    id,
    category_name,
    category_code as [原代碼],
    SUBSTRING(category_code, 2, LEN(category_code)) as [新代碼]
FROM courses_categories
WHERE category_code LIKE '_%'
ORDER BY category_name;
GO

-- =====================================================
-- 2. 更新分類代碼（移除開頭的底線）
-- =====================================================

PRINT N'2. 更新分類代碼（移除開頭的底線）...';

UPDATE courses_categories
SET category_code = SUBSTRING(category_code, 2, LEN(category_code))
WHERE category_code LIKE '_%';

PRINT N'已更新 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 個分類代碼';
GO

-- =====================================================
-- 3. 驗證更新結果
-- =====================================================

PRINT N'3. 驗證更新結果：';

PRINT N'3.1 檢查是否還有帶底線開頭的分類代碼：';
SELECT 
    id,
    category_name,
    category_code
FROM courses_categories
WHERE category_code LIKE '_%'
ORDER BY category_name;
GO

PRINT N'3.2 顯示所有分類代碼：';
SELECT 
    id,
    category_name,
    category_code,
    is_active
FROM courses_categories
ORDER BY category_name;
GO

-- =====================================================
-- 4. 檢查是否有重複的分類代碼
-- =====================================================

PRINT N'4. 檢查是否有重複的分類代碼：';
SELECT 
    category_code,
    COUNT(*) as count,
    STRING_AGG(CAST(id as NVARCHAR(10)) + '(' + category_name + ')', ', ') as ids
FROM courses_categories
GROUP BY category_code
HAVING COUNT(*) > 1
ORDER BY category_code;
GO

-- =====================================================
-- 5. 如果發現重複，處理衝突
-- =====================================================

-- 檢查是否有重複的分類代碼
IF EXISTS (
    SELECT 1 
    FROM courses_categories 
    GROUP BY category_code 
    HAVING COUNT(*) > 1
)
BEGIN
    PRINT N'發現重複的分類代碼，需要處理衝突...';
    
    -- 為重複的代碼添加後綴
    WITH DuplicateCodes AS (
        SELECT 
            id,
            category_code,
            ROW_NUMBER() OVER (PARTITION BY category_code ORDER BY id) as rn
        FROM courses_categories
        WHERE category_code IN (
            SELECT category_code 
            FROM courses_categories 
            GROUP BY category_code 
            HAVING COUNT(*) > 1
        )
    )
    UPDATE cc
    SET category_code = dc.category_code + '_' + CAST(dc.rn AS NVARCHAR(10))
    FROM courses_categories cc
    INNER JOIN DuplicateCodes dc ON cc.id = dc.id
    WHERE dc.rn > 1;
    
    PRINT N'重複的分類代碼已處理';
END
ELSE
BEGIN
    PRINT N'沒有發現重複的分類代碼';
END
GO

-- =====================================================
-- 6. 最終驗證
-- =====================================================

PRINT N'6. 最終驗證：';

PRINT N'6.1 最終的分類代碼列表：';
SELECT 
    id,
    category_name,
    category_code,
    is_active
FROM courses_categories
ORDER BY category_name;
GO

PRINT N'6.2 檢查分類代碼的唯一性：';
SELECT 
    category_code,
    COUNT(*) as count
FROM courses_categories
GROUP BY category_code
HAVING COUNT(*) > 1
ORDER BY category_code;
GO

PRINT N'=== 移除底線前綴完成 ===';
PRINT N'注意事項：';
PRINT N'1. 所有分類代碼開頭的底線已移除';
PRINT N'2. 如果發現重複代碼，已自動添加後綴處理';
PRINT N'3. 建議測試系統功能確保正常運作';
GO 