-- Step 1: 新增 class_schedule_type 欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('students') AND name = 'class_schedule_type')
BEGIN
    ALTER TABLE students 
    ADD class_schedule_type NVARCHAR(20) DEFAULT N'常態班' 
    CHECK (class_schedule_type IN (N'常態班', N'短期班'));
    PRINT '✓ 已新增 class_schedule_type 欄位';
END
ELSE
BEGIN
    PRINT '⚠ class_schedule_type 欄位已存在';
END 