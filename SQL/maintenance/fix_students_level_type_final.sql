-- =====================================================
-- 修正 students 表 level_type 約束（最終版）
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 修正 students 表 level_type 約束 ===';
GO

-- 1. 移除舊約束
PRINT N'1. 移除舊約束...';
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_students_level_type')
BEGIN
    ALTER TABLE students 
    DROP CONSTRAINT CK_students_level_type;
    PRINT N'已移除 CK_students_level_type 約束';
END

GO

-- 2. 更新資料
PRINT N'2. 更新 students 表的 level_type 欄位...';
UPDATE students 
SET level_type = N'中階'
WHERE level_type = N'進階';
PRINT N'已更新 students 表 ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' 筆記錄';

GO

-- 3. 重新建立約束
PRINT N'3. 重新建立約束...';
ALTER TABLE students 
ADD CONSTRAINT CK_students_level_type 
CHECK (level_type IN (N'新手', N'入門', N'中階', N'高階', N'大師'));
PRINT N'已重新建立 students 表的 level_type 約束';

GO

-- 4. 驗證結果
PRINT N'4. 驗證結果...';
SELECT 
    'students' as table_name,
    COUNT(*) as count
FROM students 
WHERE level_type = N'進階'
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as count
FROM students 
WHERE level_type = N'中階';

GO

PRINT N'=== students 表 level_type 約束修正完成 ==='; 