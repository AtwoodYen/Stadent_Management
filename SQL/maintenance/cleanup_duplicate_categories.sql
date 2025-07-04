-- =====================================================
-- 清理重複課程分類腳本
-- 將帶底線的分類合併到不帶底線的分類，並處理所有關聯資料
-- =====================================================

USE Student_Management;
GO

PRINT N'開始清理重複課程分類...';
GO

-- =====================================================
-- 1. 檢查重複的分類名稱
-- =====================================================

PRINT N'1. 檢查重複的分類名稱：';
SELECT 
    category_name,
    COUNT(*) as count,
    STRING_AGG(CAST(id as NVARCHAR(10)) + '(' + category_code + ')', ', ') as ids
FROM courses_categories
GROUP BY category_name
HAVING COUNT(*) > 1
ORDER BY category_name;
GO

-- =====================================================
-- 2. 建立重複分類的對應關係
-- =====================================================

PRINT N'2. 建立重複分類的對應關係...';

-- 建立臨時表來儲存對應關係
CREATE TABLE #category_mapping (
    source_id INT,
    source_code NVARCHAR(20),
    target_id INT,
    target_code NVARCHAR(20),
    category_name NVARCHAR(50)
);

-- 插入對應關係（保留不帶底線的，刪除帶底線的）
INSERT INTO #category_mapping (source_id, source_code, target_id, target_code, category_name)
SELECT 
    cc1.id as source_id,
    cc1.category_code as source_code,
    cc2.id as target_id,
    cc2.category_code as target_code,
    cc1.category_name
FROM courses_categories cc1
INNER JOIN courses_categories cc2 ON cc1.category_name = cc2.category_name
WHERE cc1.category_code LIKE '_%'  -- 帶底線的（要刪除的）
AND cc2.category_code NOT LIKE '_%'  -- 不帶底線的（要保留的）
AND cc1.id != cc2.id;

-- 顯示對應關係
SELECT 
    category_name as [分類名稱],
    source_code as [要刪除的代碼],
    target_code as [要保留的代碼]
FROM #category_mapping
ORDER BY category_name;
GO

-- =====================================================
-- 3. 更新 teacher_courses 表的關聯
-- =====================================================

PRINT N'3. 更新 teacher_courses 表的關聯...';

UPDATE tc
SET category_id = cm.target_id
FROM teacher_courses tc
INNER JOIN #category_mapping cm ON tc.category_id = cm.source_id;

PRINT N'已更新 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆 teacher_courses 記錄';
GO

-- =====================================================
-- 4. 更新 courses 表的關聯
-- =====================================================

PRINT N'4. 更新 courses 表的關聯...';

UPDATE c
SET category_id = cm.target_id
FROM courses c
INNER JOIN #category_mapping cm ON c.category_id = cm.source_id;

PRINT N'已更新 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆 courses 記錄';
GO

-- =====================================================
-- 5. 刪除重複的分類（帶底線的）
-- =====================================================

PRINT N'5. 刪除重複的分類（帶底線的）...';

DELETE FROM courses_categories 
WHERE id IN (SELECT source_id FROM #category_mapping);

PRINT N'已刪除 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 個重複的課程分類';
GO

-- =====================================================
-- 6. 清理臨時表
-- =====================================================

DROP TABLE #category_mapping;
GO

-- =====================================================
-- 7. 驗證清理結果
-- =====================================================

PRINT N'7. 驗證清理結果：';

PRINT N'7.1 檢查是否還有重複的分類名稱：';
SELECT 
    category_name,
    COUNT(*) as count
FROM courses_categories
GROUP BY category_name
HAVING COUNT(*) > 1
ORDER BY category_name;
GO

PRINT N'7.2 檢查是否還有帶底線的分類代碼：';
SELECT 
    id,
    category_name,
    category_code,
    is_active
FROM courses_categories
WHERE category_code LIKE '_%'
ORDER BY category_name;
GO

PRINT N'7.3 顯示清理後的課程分類統計：';
SELECT 
    category_name as [分類名稱],
    category_code as [分類代碼],
    course_count as [課程數量],
    teacher_count as [師資數量],
    student_count as [學生數量],
    is_active as [啟用狀態]
FROM view_course_categories_management
ORDER BY sort_order, category_name;
GO

-- =====================================================
-- 8. 重新整理排序
-- =====================================================

PRINT N'8. 重新整理排序...';

-- 重新設定排序值（每10個為一組）
WITH CategoryOrder AS (
    SELECT 
        id,
        category_name,
        ROW_NUMBER() OVER (ORDER BY sort_order, category_name) * 10 as new_sort_order
    FROM courses_categories
    WHERE is_active = 1
)
UPDATE cc
SET sort_order = co.new_sort_order
FROM courses_categories cc
INNER JOIN CategoryOrder co ON cc.id = co.id;

PRINT N'課程分類排序已重新整理';
GO

PRINT N'=== 清理完成 ===';
PRINT N'注意事項：';
PRINT N'1. 所有帶底線的重複分類已被合併到不帶底線的分類';
PRINT N'2. 相關的師資和課程資料已更新到正確的分類';
PRINT N'3. 排序已重新整理';
PRINT N'4. 建議測試系統功能確保正常運作';
GO 