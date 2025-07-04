-- =====================================================
-- 課程分類管理腳本
-- 提供完整的課程分類管理功能
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 課程分類管理工具 ===';
GO

-- =====================================================
-- 1. 查看課程分類統計
-- =====================================================

PRINT N'1. 課程分類統計報告：';
SELECT 
    cc.category_name as [分類名稱],
    cc.category_code as [分類代碼],
    cc.description as [描述],
    cc.is_active as [啟用狀態],
    cc.sort_order as [排序],
    vcm.course_count as [課程數量],
    vcm.teacher_count as [師資數量],
    vcm.student_count as [學生數量]
FROM courses_categories cc
LEFT JOIN view_course_categories_management vcm ON cc.id = vcm.id
ORDER BY cc.sort_order, cc.category_name;
GO

-- =====================================================
-- 2. 新增課程分類函數
-- =====================================================

-- 建立新增課程分類的預存程序
CREATE OR ALTER PROCEDURE sp_add_course_category
    @category_name NVARCHAR(50),
    @description NVARCHAR(200) = NULL,
    @sort_order INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 檢查課程分類是否已存在
    IF EXISTS (SELECT 1 FROM courses_categories WHERE category_name = @category_name)
    BEGIN
        PRINT N'錯誤：課程分類 "' + @category_name + N'" 已存在';
        RETURN;
    END
    
    -- 生成分類代碼
    DECLARE @category_code NVARCHAR(20) = UPPER(REPLACE(REPLACE(@category_name, ' ', '_'), '/', '_'));
    
    -- 如果沒有指定排序，使用最大排序值 + 10
    IF @sort_order IS NULL
    BEGIN
        SELECT @sort_order = ISNULL(MAX(sort_order), 0) + 10 FROM courses_categories;
    END
    
    -- 新增課程分類
    INSERT INTO courses_categories (category_code, category_name, description, sort_order)
    VALUES (@category_code, @category_name, @description, @sort_order);
    
    PRINT N'成功新增課程分類：' + @category_name;
    PRINT N'分類代碼：' + @category_code;
    PRINT N'排序值：' + CAST(@sort_order AS NVARCHAR(10));
END
GO

-- =====================================================
-- 3. 修改課程分類函數
-- =====================================================

CREATE OR ALTER PROCEDURE sp_update_course_category
    @category_name NVARCHAR(50),
    @new_name NVARCHAR(50) = NULL,
    @description NVARCHAR(200) = NULL,
    @sort_order INT = NULL,
    @is_active BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 檢查課程分類是否存在
    IF NOT EXISTS (SELECT 1 FROM courses_categories WHERE category_name = @category_name)
    BEGIN
        PRINT N'錯誤：課程分類 "' + @category_name + N'" 不存在';
        RETURN;
    END
    
    -- 檢查新名稱是否與其他分類衝突
    IF @new_name IS NOT NULL AND @new_name != @category_name
    BEGIN
        IF EXISTS (SELECT 1 FROM courses_categories WHERE category_name = @new_name)
        BEGIN
            PRINT N'錯誤：課程分類 "' + @new_name + N'" 已存在';
            RETURN;
        END
    END
    
    -- 更新課程分類
    UPDATE courses_categories 
    SET 
        category_name = ISNULL(@new_name, category_name),
        description = ISNULL(@description, description),
        sort_order = ISNULL(@sort_order, sort_order),
        is_active = ISNULL(@is_active, is_active),
        updated_at = GETDATE()
    WHERE category_name = @category_name;
    
    PRINT N'成功更新課程分類：' + @category_name;
    IF @new_name IS NOT NULL AND @new_name != @category_name
        PRINT N'新名稱：' + @new_name;
END
GO

-- =====================================================
-- 4. 停用/啟用課程分類函數
-- =====================================================

CREATE OR ALTER PROCEDURE sp_toggle_course_category
    @category_name NVARCHAR(50),
    @enable BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 檢查課程分類是否存在
    IF NOT EXISTS (SELECT 1 FROM courses_categories WHERE category_name = @category_name)
    BEGIN
        PRINT N'錯誤：課程分類 "' + @category_name + N'" 不存在';
        RETURN;
    END
    
    -- 更新狀態
    UPDATE courses_categories 
    SET is_active = @enable, updated_at = GETDATE()
    WHERE category_name = @category_name;
    
    IF @enable = 1
        PRINT N'成功啟用課程分類：' + @category_name;
    ELSE
        PRINT N'成功停用課程分類：' + @category_name;
END
GO

-- =====================================================
-- 5. 重新排序課程分類函數
-- =====================================================

CREATE OR ALTER PROCEDURE sp_reorder_course_categories
AS
BEGIN
    SET NOCOUNT ON;
    
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
END
GO

-- =====================================================
-- 6. 使用範例
-- =====================================================

PRINT N'=== 使用範例 ===';

-- 新增課程分類
PRINT N'新增課程分類範例：';
EXEC sp_add_course_category 
    @category_name = N'區塊鏈開發',
    @description = N'區塊鏈技術與智能合約開發課程',
    @sort_order = 100;
GO

-- 修改課程分類
PRINT N'修改課程分類範例：';
EXEC sp_update_course_category 
    @category_name = N'Python',
    @description = N'Python 程式設計與資料分析課程（更新版）',
    @sort_order = 5;
GO

-- 停用課程分類
PRINT N'停用課程分類範例：';
EXEC sp_toggle_course_category 
    @category_name = N'舊課程分類',
    @enable = 0;
GO

-- 重新排序
PRINT N'重新排序課程分類：';
EXEC sp_reorder_course_categories;
GO

-- =====================================================
-- 7. 快速查詢工具
-- =====================================================

PRINT N'=== 快速查詢工具 ===';

-- 查看啟用的課程分類
PRINT N'啟用的課程分類：';
SELECT category_name, category_code, sort_order
FROM courses_categories 
WHERE is_active = 1
ORDER BY sort_order;
GO

-- 查看停用的課程分類
PRINT N'停用的課程分類：';
SELECT category_name, category_code, sort_order
FROM courses_categories 
WHERE is_active = 0
ORDER BY sort_order;
GO

-- 查看沒有師資的課程分類
PRINT N'沒有師資的課程分類：';
SELECT cc.category_name, cc.description
FROM courses_categories cc
LEFT JOIN teacher_courses tc ON cc.id = tc.category_id
WHERE tc.category_id IS NULL AND cc.is_active = 1
ORDER BY cc.category_name;
GO

-- 查看熱門課程分類（師資數量最多）
PRINT N'熱門課程分類（按師資數量排序）：';
SELECT 
    cc.category_name,
    COUNT(DISTINCT tc.teacher_id) as teacher_count,
    COUNT(*) as total_records
FROM courses_categories cc
LEFT JOIN teacher_courses tc ON cc.id = tc.category_id
WHERE cc.is_active = 1
GROUP BY cc.id, cc.category_name
ORDER BY teacher_count DESC;
GO

PRINT N'=== 課程分類管理工具載入完成 ===';
PRINT N'可用的預存程序：';
PRINT N'1. sp_add_course_category - 新增課程分類';
PRINT N'2. sp_update_course_category - 修改課程分類';
PRINT N'3. sp_toggle_course_category - 停用/啟用課程分類';
PRINT N'4. sp_reorder_course_categories - 重新排序課程分類';
GO 