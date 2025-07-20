-- =====================================================
-- 建立大學資料表
-- 創建日期: 2025-01-28
-- 說明: 記錄大學資料
-- =====================================================

-- 建立大學資料表
CREATE TABLE universities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    university_name NVARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

-- 建立索引
CREATE INDEX IX_universities_name ON universities(university_name);
CREATE INDEX IX_universities_active ON universities(is_active);

PRINT '大學資料表建立完成';

GO

-- 建立觸發器更新 updated_at
CREATE TRIGGER TR_universities_update_timestamp
ON universities
AFTER UPDATE
AS
BEGIN
    UPDATE universities 
    SET updated_at = GETDATE()
    FROM universities u
    INNER JOIN inserted i ON u.id = i.id;
END;

PRINT '大學資料表觸發器建立完成'; 