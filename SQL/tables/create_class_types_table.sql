-- =====================================================
-- 班別管理系統 - 班別資料表建立腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 建立班別管理系統，支援動態維護課程班別
-- =====================================================

-- 檢查並刪除已存在的資料表
IF OBJECT_ID('class_types', 'U') IS NOT NULL
    DROP TABLE class_types;

GO

-- 創建班別資料表
CREATE TABLE class_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    class_code NVARCHAR(20) NOT NULL UNIQUE,   -- 班別代碼（用於資料庫存儲）
    class_name NVARCHAR(50) NOT NULL UNIQUE,   -- 班別顯示名稱
    description NVARCHAR(200),                 -- 班別描述
    is_active BIT DEFAULT 1,                   -- 是否啟用
    sort_order INT DEFAULT 0,                  -- 排序順序
    created_at DATETIME2 DEFAULT GETDATE(),    -- 建立時間
    updated_at DATETIME2 DEFAULT GETDATE()     -- 更新時間
);

GO

-- 創建索引以提升查詢效能
CREATE INDEX IX_class_types_class_code ON class_types(class_code);
CREATE INDEX IX_class_types_is_active ON class_types(is_active);
CREATE INDEX IX_class_types_sort_order ON class_types(sort_order);

GO

-- 插入班別資料
INSERT INTO class_types (class_code, class_name, description, sort_order) VALUES 
(N'CPP', N'C/C++', N'C/C++程式設計課程，適合想學習系統程式設計的學生', 1),
(N'PROJECT', N'專題製作', N'專題製作課程，培養學生完整專案開發能力', 2),
(N'SCRATCH', N'Scratch', N'Scratch視覺化程式設計，適合程式設計初學者', 3),
(N'APCS_A', N'美國APCS A', N'美國大學先修課程 Computer Science A', 4),
(N'APCS_P', N'美國APCS P', N'美國大學先修課程 Computer Science Principles', 5),
(N'ANIMATION', N'動畫美術', N'動畫製作與美術設計課程', 6);

GO

-- 創建更新時間的觸發器
CREATE TRIGGER tr_class_types_update_timestamp
ON class_types
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE class_types 
    SET updated_at = GETDATE()
    FROM class_types ct
    INNER JOIN inserted i ON ct.id = i.id;
END;

GO

-- =====================================================
-- 常用查詢範例
-- =====================================================

-- 1. 查詢所有啟用的班別（按排序順序）
SELECT 
    id,
    class_code AS '班別代碼', 
    class_name AS '班別名稱', 
    description AS '描述'
FROM class_types 
WHERE is_active = 1
ORDER BY sort_order, class_name;

-- 2. 查詢班別統計（需要先建立外鍵關聯）
-- SELECT 
--     ct.class_name AS '班別名稱',
--     COUNT(s.id) AS '學生人數'
-- FROM class_types ct
-- LEFT JOIN students s ON ct.class_code = s.class_type
-- WHERE ct.is_active = 1
-- GROUP BY ct.class_name, ct.sort_order
-- ORDER BY ct.sort_order;

PRINT '班別資料表建立完成！';
PRINT '已插入 6 種班別資料';
PRINT '已建立 3 個效能索引';
PRINT '已建立自動更新時間戳觸發器'; 