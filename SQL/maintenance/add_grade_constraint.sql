-- =====================================================
-- 添加年級 CHECK 約束
-- 創建日期: 2025-01-28
-- 說明: 為 students 表的 grade 欄位添加 CHECK 約束，確保年級值在有效範圍內
-- =====================================================

-- 檢查是否已存在約束
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME = 'CK_students_grade'
)
BEGIN
    PRINT '年級約束已存在，正在刪除舊約束...';
    ALTER TABLE students DROP CONSTRAINT CK_students_grade;
END

-- 添加新的年級約束
ALTER TABLE students 
ADD CONSTRAINT CK_students_grade 
CHECK (grade IN (
    N'小一', N'小二', N'小三', N'小四', N'小五', N'小六',
    N'國一', N'國二', N'國三',
    N'高一', N'高二', N'高三',
    N'大一', N'大二', N'大三', N'大四'
));

PRINT '年級約束添加完成！';
PRINT '支援的年級：小一到小六、國一到國三、高一到高三、大一到大四';

-- 驗證約束是否正確添加
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_NAME = 'CK_students_grade'; 