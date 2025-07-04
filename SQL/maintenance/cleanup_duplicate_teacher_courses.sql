-- =====================================================
-- 清理重複的師資課程能力記錄
-- 保留每個師資每個課程分類的最新記錄
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 開始清理重複的師資課程能力記錄 ===';
GO

-- 1. 顯示重複記錄統計
PRINT N'1. 重複記錄統計：';
SELECT 
    tc.teacher_id,
    t.name as teacher_name,
    cc.category_name,
    COUNT(*) as duplicate_count
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
INNER JOIN courses_categories cc ON tc.category_id = cc.id
GROUP BY tc.teacher_id, t.name, cc.category_name
HAVING COUNT(*) > 1
ORDER BY t.name, cc.category_name;

-- 2. 刪除重複記錄，保留每個師資每個課程分類的最新記錄
PRINT N'2. 開始刪除重複記錄...';

WITH DuplicateRecords AS (
    SELECT 
        tc.id,
        tc.teacher_id,
        tc.category_id,
        ROW_NUMBER() OVER (
            PARTITION BY tc.teacher_id, tc.category_id 
            ORDER BY tc.created_at DESC, tc.id DESC
        ) as rn
    FROM teacher_courses tc
)
DELETE FROM teacher_courses 
WHERE id IN (
    SELECT id 
    FROM DuplicateRecords 
    WHERE rn > 1
);

PRINT N'重複記錄清理完成';
GO

-- 3. 顯示清理後的結果
PRINT N'3. 清理後的記錄統計：';
SELECT 
    tc.teacher_id,
    t.name as teacher_name,
    cc.category_name,
    COUNT(*) as record_count
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
INNER JOIN courses_categories cc ON tc.category_id = cc.id
GROUP BY tc.teacher_id, t.name, cc.category_name
ORDER BY t.name, cc.category_name;

-- 4. 檢查是否還有重複記錄
PRINT N'4. 檢查是否還有重複記錄：';
SELECT 
    tc.teacher_id,
    t.name as teacher_name,
    cc.category_name,
    COUNT(*) as duplicate_count
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
INNER JOIN courses_categories cc ON tc.category_id = cc.id
GROUP BY tc.teacher_id, t.name, cc.category_name
HAVING COUNT(*) > 1
ORDER BY t.name, cc.category_name;

IF @@ROWCOUNT = 0
    PRINT N'✅ 沒有發現重複記錄';
ELSE
    PRINT N'❌ 仍有重複記錄需要處理';

PRINT N'=== 重複記錄清理完成 ===';
GO 