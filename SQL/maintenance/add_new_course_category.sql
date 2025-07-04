-- =============================================
-- 新增課程分類腳本
-- 適用於 MS SQL Server
-- =============================================

USE StudentManagement;

-- 設定要新增的課程分類名稱
DECLARE @new_category NVARCHAR(100) = N'新課程分類'; -- 請修改為您要新增的課程分類名稱

-- 1. 檢查課程分類是否已存在於 courses 表
IF NOT EXISTS (SELECT 1 FROM courses WHERE category = @new_category)
BEGIN
    -- 新增課程分類到 courses 表（包含基礎課程）
    INSERT INTO courses (name, category, level, duration_minutes, price, description, prerequisites) VALUES
    (@new_category + N' 基礎入門', @new_category, N'初級', 90, 1200.00, N'學習 ' + @new_category + N' 的基本概念和基礎技能', N'無'),
    (@new_category + N' 進階應用', @new_category, N'中級', 120, 1800.00, N'深入學習 ' + @new_category + N' 的進階技巧和實務應用', @new_category + N' 基礎入門'),
    (@new_category + N' 專業實戰', @new_category, N'高級', 180, 2500.00, N'專業級 ' + @new_category + N' 專案開發和實戰經驗', @new_category + N' 進階應用');
    
    PRINT N'已新增課程分類 "' + @new_category + N'" 到 courses 表';
END
ELSE
BEGIN
    PRINT N'課程分類 "' + @new_category + N'" 已存在於 courses 表中';
END

-- 2. 顯示新增的課程
PRINT N'=== 新增的課程列表 ===';
SELECT 
    name as [課程名稱],
    category as [課程分類],
    level as [難度等級],
    duration_minutes as [時長分鐘],
    price as [課程價格]
FROM courses 
WHERE category = @new_category
ORDER BY 
    CASE level 
        WHEN N'初級' THEN 1 
        WHEN N'中級' THEN 2 
        WHEN N'高級' THEN 3 
    END;

-- 3. 可選：為特定師資新增此課程分類能力
-- 取消註解以下程式碼並修改 teacher_id 來為特定師資新增課程能力

/*
DECLARE @teacher_id INT = 1; -- 請修改為目標師資的 ID

-- 檢查師資是否存在
IF EXISTS (SELECT 1 FROM teachers WHERE id = @teacher_id)
BEGIN
    -- 檢查是否已有此課程分類
    IF NOT EXISTS (SELECT 1 FROM teacher_courses WHERE teacher_id = @teacher_id AND course_category = @new_category)
    BEGIN
        INSERT INTO teacher_courses (teacher_id, course_category, max_level, is_preferred) VALUES
        (@teacher_id, @new_category, N'中級', 0);
        
        PRINT N'已為師資 ID ' + CAST(@teacher_id AS NVARCHAR(10)) + N' 新增課程分類 "' + @new_category + N'"';
    END
    ELSE
    BEGIN
        PRINT N'師資 ID ' + CAST(@teacher_id AS NVARCHAR(10)) + N' 已有課程分類 "' + @new_category + N'"';
    END
END
ELSE
BEGIN
    PRINT N'師資 ID ' + CAST(@teacher_id AS NVARCHAR(10)) + N' 不存在';
END
*/

-- 4. 顯示所有課程分類統計
PRINT N'=== 所有課程分類統計 ===';
SELECT 
    category as [課程分類],
    COUNT(*) as [課程數量],
    AVG(price) as [平均價格],
    MIN(price) as [最低價格],
    MAX(price) as [最高價格]
FROM courses 
WHERE is_active = 1
GROUP BY category
ORDER BY COUNT(*) DESC;

PRINT N'';
PRINT N'課程分類新增完成！';
PRINT N'現在可以在師資管理介面中為師資新增此課程分類的教學能力。'; 