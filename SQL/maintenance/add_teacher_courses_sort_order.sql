-- =====================================================
-- 為 teacher_courses 表添加排序欄位
-- 這個欄位用於儲存師資課程能力的顯示順序
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 為師資課程能力添加排序功能 ===';
GO

-- =====================================================
-- 1. 添加 sort_order 欄位到 teacher_courses 表
-- =====================================================

-- 檢查是否已存在 sort_order 欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('teacher_courses') AND name = 'sort_order')
BEGIN
    -- 添加 sort_order 欄位
    ALTER TABLE teacher_courses 
    ADD sort_order INT DEFAULT 0;
    
    PRINT N'已添加 sort_order 欄位到 teacher_courses 表';
END
ELSE
BEGIN
    PRINT N'sort_order 欄位已存在';
END
GO

-- =====================================================
-- 2. 為現有的課程能力設定初始排序值
-- =====================================================

PRINT N'2. 為現有課程能力設定初始排序值...';

-- 按照師資ID、主力課程優先、課程分類排序來設定初始排序值
WITH CourseOrder AS (
    SELECT 
        id,
        teacher_id,
        is_preferred,
        course_category,
        ROW_NUMBER() OVER (
            PARTITION BY teacher_id 
            ORDER BY 
                is_preferred DESC,  -- 主力課程優先
                course_category     -- 然後按課程分類名稱
        ) * 10 as new_sort_order
    FROM teacher_courses
    WHERE sort_order = 0 OR sort_order IS NULL
)
UPDATE tc
SET sort_order = co.new_sort_order
FROM teacher_courses tc
INNER JOIN CourseOrder co ON tc.id = co.id;

PRINT N'初始排序值設定完成';
GO

-- =====================================================
-- 3. 為 sort_order 欄位添加索引
-- =====================================================

-- 檢查索引是否已存在
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_teacher_courses_sort_order')
BEGIN
    CREATE INDEX IX_teacher_courses_sort_order ON teacher_courses(sort_order);
    PRINT N'已為 sort_order 欄位添加索引';
END
ELSE
BEGIN
    PRINT N'sort_order 索引已存在';
END
GO

-- =====================================================
-- 4. 更新師資教學能力視圖，加入排序
-- =====================================================

PRINT N'4. 更新師資教學能力視圖...';

CREATE OR ALTER VIEW [dbo].[view_teacher_capabilities] AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    cc.category_name,
    tc.max_level,
    tc.is_preferred,
    tc.sort_order,
    -- 該師資在此分類的教學水準
    CASE tc.max_level
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'高級' THEN 3
        ELSE 0
    END as level_numeric
FROM teachers t
INNER JOIN teacher_courses tc ON t.id = tc.teacher_id
INNER JOIN courses_categories cc ON tc.category_id = cc.id
WHERE t.is_active = 1 AND cc.is_active = 1
ORDER BY t.name, tc.sort_order, level_numeric DESC;
GO

-- =====================================================
-- 5. 建立重新排序師資課程能力的預存程序
-- =====================================================

PRINT N'5. 建立重新排序預存程序...';

CREATE OR ALTER PROCEDURE sp_reorder_teacher_courses
    @teacher_id INT = NULL  -- 如果為 NULL，則重新排序所有師資
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @teacher_id IS NULL
    BEGIN
        -- 重新排序所有師資的課程能力
        WITH CourseOrder AS (
            SELECT 
                id,
                teacher_id,
                ROW_NUMBER() OVER (
                    PARTITION BY teacher_id 
                    ORDER BY 
                        is_preferred DESC,  -- 主力課程優先
                        course_category     -- 然後按課程分類名稱
                ) * 10 as new_sort_order
            FROM teacher_courses
        )
        UPDATE tc
        SET sort_order = co.new_sort_order
        FROM teacher_courses tc
        INNER JOIN CourseOrder co ON tc.id = co.id;
        
        PRINT N'已重新排序所有師資的課程能力';
    END
    ELSE
    BEGIN
        -- 重新排序特定師資的課程能力
        WITH CourseOrder AS (
            SELECT 
                id,
                teacher_id,
                ROW_NUMBER() OVER (
                    ORDER BY 
                        is_preferred DESC,  -- 主力課程優先
                        course_category     -- 然後按課程分類名稱
                ) * 10 as new_sort_order
            FROM teacher_courses
            WHERE teacher_id = @teacher_id
        )
        UPDATE tc
        SET sort_order = co.new_sort_order
        FROM teacher_courses tc
        INNER JOIN CourseOrder co ON tc.id = co.id;
        
        PRINT N'已重新排序師資 ID ' + CAST(@teacher_id AS NVARCHAR(10)) + ' 的課程能力';
    END
END
GO

-- =====================================================
-- 6. 建立更新師資課程能力排序的預存程序
-- =====================================================

CREATE OR ALTER PROCEDURE sp_update_teacher_course_sort_order
    @course_id INT,
    @new_sort_order INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 檢查課程能力是否存在
    IF NOT EXISTS (SELECT 1 FROM teacher_courses WHERE id = @course_id)
    BEGIN
        PRINT N'錯誤：課程能力 ID ' + CAST(@course_id AS NVARCHAR(10)) + ' 不存在';
        RETURN;
    END
    
    -- 更新排序值
    UPDATE teacher_courses 
    SET sort_order = @new_sort_order
    WHERE id = @course_id;
    
    PRINT N'已更新課程能力 ID ' + CAST(@course_id AS NVARCHAR(10)) + ' 的排序值為 ' + CAST(@new_sort_order AS NVARCHAR(10));
END
GO

-- =====================================================
-- 7. 驗證排序結果
-- =====================================================

PRINT N'7. 驗證排序結果：';

-- 顯示前10筆課程能力的排序狀況
SELECT TOP 10
    tc.id,
    t.name as teacher_name,
    tc.course_category,
    tc.max_level,
    tc.is_preferred,
    tc.sort_order
FROM teacher_courses tc
INNER JOIN teachers t ON tc.teacher_id = t.id
ORDER BY tc.teacher_id, tc.sort_order;
GO

-- 顯示每個師資的課程能力排序
PRINT N'師資課程能力排序狀況：';
SELECT 
    t.name as teacher_name,
    COUNT(tc.id) as course_count,
    MIN(tc.sort_order) as min_sort,
    MAX(tc.sort_order) as max_sort,
    STRING_AGG(CONCAT(tc.course_category, '(', tc.sort_order, ')'), ', ') as courses_with_sort
FROM teachers t
INNER JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name
ORDER BY t.name;
GO

PRINT N'=== 師資課程能力排序功能添加完成 ===';
PRINT N'可用的預存程序：';
PRINT N'1. sp_reorder_teacher_courses - 重新排序所有師資的課程能力';
PRINT N'2. sp_reorder_teacher_courses @teacher_id = X - 重新排序特定師資的課程能力';
PRINT N'3. sp_update_teacher_course_sort_order - 更新特定課程能力的排序值';
GO 