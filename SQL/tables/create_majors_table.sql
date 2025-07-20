-- =====================================================
-- 建立科系資料表
-- 創建日期: 2025-01-28
-- 說明: 記錄科系資料
-- =====================================================

-- 建立科系資料表
CREATE TABLE majors (
    id INT IDENTITY(1,1) PRIMARY KEY,
    major_name NVARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

-- 建立索引
CREATE INDEX IX_majors_name ON majors(major_name);
CREATE INDEX IX_majors_active ON majors(is_active);

PRINT '科系資料表建立完成';

GO

-- 建立觸發器更新 updated_at
CREATE TRIGGER TR_majors_update_timestamp
ON majors
AFTER UPDATE
AS
BEGIN
    UPDATE majors 
    SET updated_at = GETDATE()
    FROM majors m
    INNER JOIN inserted i ON m.id = i.id;
END;

PRINT '科系資料表觸發器建立完成'; 