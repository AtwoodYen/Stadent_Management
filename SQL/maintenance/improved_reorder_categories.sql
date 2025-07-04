-- =====================================================
-- 改善版課程分類重新排序腳本
-- 保留手動設定的排序值，只在需要時重新整理
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 改善版課程分類重新排序 ===';
GO

-- =====================================================
-- 1. 檢查當前的排序狀況
-- =====================================================

PRINT N'1. 檢查當前的排序狀況：';
SELECT 
    id,
    category_name,
    sort_order,
    CASE 
        WHEN sort_order % 10 = 0 THEN '已標準化'
        ELSE '手動設定'
    END as [排序狀態]
FROM courses_categories
WHERE is_active = 1
ORDER BY sort_order;
GO

-- =====================================================
-- 2. 智能重新排序（保留手動設定）
-- =====================================================

PRINT N'2. 建立智能重新排序預存程序...';

-- 建立改善版的重新排序預存程序
CREATE OR ALTER PROCEDURE sp_smart_reorder_course_categories
    @force_standardize BIT = 0  -- 0: 保留手動設定, 1: 強制標準化
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @force_standardize = 1
    BEGIN
        -- 強制標準化：每10個為一組
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
        
        PRINT N'已強制標準化排序（每10個為一組）';
    END
    ELSE
    BEGIN
        -- 智能排序：保留手動設定，只整理有問題的
        DECLARE @min_sort INT, @max_sort INT;
        
        -- 找出排序範圍
        SELECT @min_sort = MIN(sort_order), @max_sort = MAX(sort_order)
        FROM courses_categories
        WHERE is_active = 1;
        
        -- 檢查是否有重複的排序值
        IF EXISTS (
            SELECT sort_order, COUNT(*)
            FROM courses_categories
            WHERE is_active = 1
            GROUP BY sort_order
            HAVING COUNT(*) > 1
        )
        BEGIN
            PRINT N'發現重複的排序值，正在修正...';
            
            -- 重新分配重複的排序值
            WITH DuplicateSorts AS (
                SELECT 
                    id,
                    sort_order,
                    ROW_NUMBER() OVER (PARTITION BY sort_order ORDER BY category_name) as rn
                FROM courses_categories
                WHERE is_active = 1
                AND sort_order IN (
                    SELECT sort_order
                    FROM courses_categories
                    WHERE is_active = 1
                    GROUP BY sort_order
                    HAVING COUNT(*) > 1
                )
            )
            UPDATE cc
            SET sort_order = cc.sort_order + ds.rn - 1
            FROM courses_categories cc
            INNER JOIN DuplicateSorts ds ON cc.id = ds.id
            WHERE ds.rn > 1;
            
            PRINT N'重複排序值已修正';
        END
        ELSE
        BEGIN
            PRINT N'排序值正常，無需修正';
        END
        
        -- 檢查是否有負數或過大的排序值
        IF EXISTS (
            SELECT 1 FROM courses_categories 
            WHERE is_active = 1 
            AND (sort_order < 0 OR sort_order > 10000)
        )
        BEGIN
            PRINT N'發現異常排序值，正在標準化...';
            
            -- 重新標準化異常的排序值
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
            INNER JOIN CategoryOrder co ON cc.id = co.id
            WHERE cc.sort_order < 0 OR cc.sort_order > 10000;
            
            PRINT N'異常排序值已標準化';
        END
    END
END
GO

-- =====================================================
-- 3. 執行智能重新排序
-- =====================================================

PRINT N'3. 執行智能重新排序...';
EXEC sp_smart_reorder_course_categories @force_standardize = 0;
GO

-- =====================================================
-- 4. 驗證排序結果
-- =====================================================

PRINT N'4. 驗證排序結果：';
SELECT 
    id,
    category_name,
    sort_order,
    CASE 
        WHEN sort_order % 10 = 0 THEN '標準化'
        ELSE '手動設定'
    END as [排序狀態]
FROM courses_categories
WHERE is_active = 1
ORDER BY sort_order;
GO

-- =====================================================
-- 5. 排序建議
-- =====================================================

PRINT N'5. 排序建議：';
PRINT N'✓ 手動設定排序值時，建議使用 5 的倍數（如：5, 15, 25...）';
PRINT N'✓ 這樣可以在標準化排序（10, 20, 30...）之間插入';
PRINT N'✓ 避免與自動生成的排序值衝突';
PRINT N'✓ 使用 sp_smart_reorder_course_categories 進行智能排序';
GO

PRINT N'=== 改善版重新排序完成 ===';
PRINT N'可用的預存程序：';
PRINT N'- sp_smart_reorder_course_categories @force_standardize = 0  (智能排序)';
PRINT N'- sp_smart_reorder_course_categories @force_standardize = 1  (強制標準化)';
GO 