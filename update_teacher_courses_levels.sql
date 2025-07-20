-- =====================================================
-- 更新師資課程等級腳本
-- 創建日期: 2025-01-28
-- 說明: 將師資課程表的等級從五個等級轉換為三個等級
-- =====================================================

PRINT '=== 開始更新師資課程等級 ===';

-- 步驟1: 備份現有資料
IF OBJECT_ID('teacher_courses_level_backup', 'U') IS NOT NULL
    DROP TABLE teacher_courses_level_backup;

SELECT id, teacher_id, course_category, max_level as old_max_level, is_preferred, created_at
INTO teacher_courses_level_backup
FROM teacher_courses;

PRINT '已備份現有師資課程等級資料到 teacher_courses_level_backup 表';

-- 步驟2: 檢查現有約束
PRINT '';
PRINT '=== 檢查現有約束 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%teacher%level%';

-- 步驟3: 移除舊約束
PRINT '';
PRINT '=== 移除舊約束 ===';
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'dbo' 
    AND CONSTRAINT_NAME = 'CK_teacher_courses_max_level'
)
BEGIN
    ALTER TABLE teacher_courses 
    DROP CONSTRAINT CK_teacher_courses_max_level;
    PRINT '已移除舊約束 CK_teacher_courses_max_level';
END
ELSE
BEGIN
    PRINT '找不到指定的約束';
END

-- 步驟4: 更新等級資料
PRINT '';
PRINT '=== 更新等級資料 ===';
UPDATE teacher_courses 
SET max_level = CASE 
    WHEN max_level = N'新手' THEN N'初級'        -- 新手 -> 初級
    WHEN max_level = N'入門' THEN N'初級'        -- 入門 -> 初級
    WHEN max_level = N'中階' THEN N'中級'        -- 中階 -> 中級
    WHEN max_level = N'高階' THEN N'高級'        -- 高階 -> 高級
    WHEN max_level = N'精英' THEN N'高級'        -- 精英 -> 高級
    ELSE max_level  -- 保持其他值不變
END;

PRINT '已更新師資課程等級資料';

-- 步驟5: 新增新約束
PRINT '';
PRINT '=== 新增新約束 ===';
ALTER TABLE teacher_courses 
ADD CONSTRAINT CK_teacher_courses_max_level 
CHECK (max_level IN (N'初級', N'中級', N'高級'));

PRINT '已新增新約束 CK_teacher_courses_max_level';

-- 步驟6: 檢查更新結果
PRINT '';
PRINT '=== 更新結果檢查 ===';
SELECT 
    old_max_level AS '原等級',
    max_level AS '新等級',
    COUNT(*) AS '記錄數量'
FROM teacher_courses tc
INNER JOIN teacher_courses_level_backup tclb ON tc.id = tclb.id
GROUP BY old_max_level, max_level
ORDER BY old_max_level;

-- 步驟7: 顯示各等級分佈
PRINT '';
PRINT '=== 各等級分佈 ===';
SELECT 
    max_level AS '等級',
    COUNT(*) AS '記錄數量',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM teacher_courses), 2) AS '百分比'
FROM teacher_courses 
GROUP BY max_level
ORDER BY 
    CASE max_level
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'高級' THEN 3
        ELSE 4
    END;

-- 步驟8: 驗證約束
PRINT '';
PRINT '=== 約束驗證 ===';
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'dbo' 
AND CONSTRAINT_NAME LIKE '%teacher%level%';

PRINT '';
PRINT '=== 師資課程等級更新完成 ===';
PRINT '1. 已備份原始等級資料到 teacher_courses_level_backup 表';
PRINT '2. 已移除舊的等級約束';
PRINT '3. 已更新師資課程等級為新的三個等級';
PRINT '4. 已新增新的等級約束';
PRINT '5. 新等級: 初級、中級、高級'; 