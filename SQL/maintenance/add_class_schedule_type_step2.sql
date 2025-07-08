-- Step 2: 更新 class_schedule_type 資料、建立索引與查詢
-- 更新現有學生資料，預設為常態班
UPDATE students 
SET class_schedule_type = N'常態班'
WHERE class_schedule_type IS NULL;

-- 建立索引（如果尚未存在）
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_schedule_type' AND object_id = OBJECT_ID('students'))
BEGIN
    CREATE INDEX IX_students_class_schedule_type ON students(class_schedule_type);
    PRINT '✓ 已建立 class_schedule_type 索引';
END
ELSE
BEGIN
    PRINT '✓ IX_students_class_schedule_type 索引已存在';
END

-- 顯示統計
PRINT '=== 班級排程類型統計 ===';
SELECT 
    class_schedule_type AS '班級排程類型',
    COUNT(*) AS '學生人數',
    ROUND(CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM students WHERE is_active = 1) * 100, 2) AS '百分比'
FROM students 
WHERE is_active = 1
GROUP BY class_schedule_type
ORDER BY class_schedule_type;

PRINT '=== 按學校和班級排程類型統計 ===';
SELECT 
    school AS '學校',
    class_schedule_type AS '班級排程類型',
    COUNT(*) AS '學生人數'
FROM students 
WHERE is_active = 1
GROUP BY school, class_schedule_type
ORDER BY school, class_schedule_type; 