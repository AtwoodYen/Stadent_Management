-- 移除師資專長欄位，統一使用課程能力系統
-- 這個腳本將師資專長資料遷移到 teacher_courses 表，然後移除 specialties 欄位

-- 1. 先備份現有的專長資料到臨時表
IF OBJECT_ID('tempdb..#teacher_specialties_backup') IS NOT NULL
    DROP TABLE #teacher_specialties_backup;

CREATE TABLE #teacher_specialties_backup (
    teacher_id INT,
    teacher_name NVARCHAR(100),
    specialties NVARCHAR(500),
    parsed_specialties NVARCHAR(MAX)
);

-- 2. 提取所有師資的專長資料
INSERT INTO #teacher_specialties_backup (teacher_id, teacher_name, specialties, parsed_specialties)
SELECT 
    id,
    name,
    specialties,
    CASE 
        WHEN specialties IS NULL OR specialties = '' THEN '[]'
        WHEN specialties LIKE '[%]' THEN specialties  -- 已經是 JSON 格式
        ELSE '["' + REPLACE(specialties, ',', '","') + '"]'  -- 轉換逗號分隔為 JSON
    END as parsed_specialties
FROM teachers 
WHERE specialties IS NOT NULL AND specialties != '';

-- 3. 將專長資料遷移到 teacher_courses 表
-- 為每個師資的每個專長建立課程能力記錄
DECLARE @teacher_id INT, @teacher_name NVARCHAR(100), @specialties NVARCHAR(MAX);
DECLARE @specialty NVARCHAR(100);
DECLARE @i INT, @len INT;

DECLARE teacher_cursor CURSOR FOR 
SELECT teacher_id, teacher_name, parsed_specialties 
FROM #teacher_specialties_backup;

OPEN teacher_cursor;
FETCH NEXT FROM teacher_cursor INTO @teacher_id, @teacher_name, @specialties;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- 解析 JSON 陣列
    SET @specialties = REPLACE(REPLACE(@specialties, '[', ''), ']', '');
    SET @specialties = REPLACE(@specialties, '"', '');
    
    -- 分割專長字串
    DECLARE @specialties_table TABLE (specialty NVARCHAR(100));
    INSERT INTO @specialties_table (specialty)
    SELECT value FROM STRING_SPLIT(@specialties, ',');
    
    -- 為每個專長建立課程能力記錄
    DECLARE specialty_cursor CURSOR FOR 
    SELECT specialty FROM @specialties_table WHERE specialty != '';
    
    OPEN specialty_cursor;
    FETCH NEXT FROM specialty_cursor INTO @specialty;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- 檢查是否已存在該課程能力記錄
        IF NOT EXISTS (
            SELECT 1 FROM teacher_courses 
            WHERE teacher_id = @teacher_id AND course_category = @specialty
        )
        BEGIN
            -- 新增課程能力記錄
            INSERT INTO teacher_courses (teacher_id, course_category, max_level, is_preferred)
            VALUES (@teacher_id, @specialty, N'中級', 1);  -- 預設中級，設為主力課程
            
            PRINT N'已為師資 ' + @teacher_name + N' 新增課程能力: ' + @specialty;
        END
        ELSE
        BEGIN
            PRINT N'師資 ' + @teacher_name + N' 的課程能力已存在: ' + @specialty;
        END
        
        FETCH NEXT FROM specialty_cursor INTO @specialty;
    END
    
    CLOSE specialty_cursor;
    DEALLOCATE specialty_cursor;
    
    FETCH NEXT FROM teacher_cursor INTO @teacher_id, @teacher_name, @specialties;
END

CLOSE teacher_cursor;
DEALLOCATE teacher_cursor;

-- 4. 顯示遷移結果
PRINT N'=== 專長遷移結果 ===';
SELECT 
    t.name as teacher_name,
    COUNT(tc.course_category) as course_count,
    STRING_AGG(tc.course_category, ', ') as courses
FROM teachers t
LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- 5. 移除 teachers 表的 specialties 欄位
PRINT N'正在移除 teachers 表的 specialties 欄位...';

-- 先檢查是否有依賴這個欄位的索引或約束
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_teachers_specialties')
BEGIN
    DROP INDEX IX_teachers_specialties ON teachers;
    PRINT N'已移除 specialties 欄位的索引';
END

-- 移除欄位
ALTER TABLE teachers DROP COLUMN specialties;
PRINT N'已成功移除 teachers 表的 specialties 欄位';

-- 6. 清理臨時表
DROP TABLE #teacher_specialties_backup;

-- 7. 顯示最終結果
PRINT N'=== 遷移完成 ===';
PRINT N'所有師資專長已成功遷移到 teacher_courses 表';
PRINT N'teachers 表的 specialties 欄位已移除';
PRINT N'系統現在統一使用課程能力管理師資專業技能'; 