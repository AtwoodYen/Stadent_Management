-- =====================================================
-- 新增班級排程類型欄位 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為 students 表新增 class_schedule_type 欄位，用於區分常態班和短期班
-- =====================================================

-- 檢查欄位是否已存在
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_schedule_type')
BEGIN
    -- 新增 class_schedule_type 欄位
    ALTER TABLE students 
    ADD class_schedule_type NVARCHAR(20) DEFAULT N'常態班' 
    CHECK (class_schedule_type IN (N'常態班', N'短期班'));
    
    PRINT '✓ 已新增 class_schedule_type 欄位';
    
    -- 為新欄位建立索引
    CREATE INDEX IX_students_class_schedule_type ON students(class_schedule_type);
    PRINT '✓ 已建立 class_schedule_type 索引';
    
    -- 更新現有學生資料，預設為常態班
    UPDATE students 
    SET class_schedule_type = N'常態班'
    WHERE class_schedule_type IS NULL;
    
    PRINT '✓ 已更新現有學生資料為常態班';
    
    -- 顯示更新結果
    SELECT 
        class_schedule_type AS '班級排程類型',
        COUNT(*) AS '學生人數'
    FROM students 
    WHERE is_active = 1
    GROUP BY class_schedule_type
    ORDER BY class_schedule_type;
    
END
ELSE
BEGIN
    PRINT '⚠ class_schedule_type 欄位已存在';
END

-- 檢查索引是否存在
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_students_class_schedule_type' AND object_id = OBJECT_ID('students'))
BEGIN
    PRINT '✓ IX_students_class_schedule_type 索引已存在';
END
ELSE
BEGIN
    PRINT '⚠ IX_students_class_schedule_type 索引不存在，正在建立...';
    CREATE INDEX IX_students_class_schedule_type ON students(class_schedule_type);
    PRINT '✓ 已建立 class_schedule_type 索引';
END

-- 顯示完整的欄位結構
PRINT '=== 學生資料表結構 ===';
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型態',
    CHARACTER_MAXIMUM_LENGTH AS '最大長度',
    IS_NULLABLE AS '允許空值',
    COLUMN_DEFAULT AS '預設值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- 顯示班級排程類型統計（只有在欄位存在時才執行）
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_schedule_type')
BEGIN
    PRINT '=== 班級排程類型統計 ===';
    SELECT 
        class_schedule_type AS '班級排程類型',
        COUNT(*) AS '學生人數',
        ROUND(CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM students WHERE is_active = 1) * 100, 2) AS '百分比'
    FROM students 
    WHERE is_active = 1
    GROUP BY class_schedule_type
    ORDER BY class_schedule_type;

    -- 按學校和班級排程類型統計
    PRINT '=== 按學校和班級排程類型統計 ===';
    SELECT 
        school AS '學校',
        class_schedule_type AS '班級排程類型',
        COUNT(*) AS '學生人數'
    FROM students 
    WHERE is_active = 1
    GROUP BY school, class_schedule_type
    ORDER BY school, class_schedule_type;
END

PRINT '班級排程類型欄位新增完成！';
PRINT '常態班：每週定期的常態課程';
PRINT '短期班：寒暑假以週為單位的短期課程'; 