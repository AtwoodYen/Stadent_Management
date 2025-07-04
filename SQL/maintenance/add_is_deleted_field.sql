-- =====================================================
-- 為 teachers 表添加 is_deleted 欄位
-- 用於區分啟用/停用狀態和軟刪除狀態
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 為 teachers 表添加 is_deleted 欄位 ===';
GO

-- =====================================================
-- 1. 添加 is_deleted 欄位
-- =====================================================

-- 檢查是否已存在 is_deleted 欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('teachers') AND name = 'is_deleted')
BEGIN
    -- 添加 is_deleted 欄位，預設為 0（未刪除）
    ALTER TABLE teachers 
    ADD is_deleted BIT DEFAULT 0;
    
    PRINT N'已添加 is_deleted 欄位到 teachers 表';
END
ELSE
BEGIN
    PRINT N'is_deleted 欄位已存在';
END
GO

-- =====================================================
-- 2. 為 is_deleted 欄位添加索引
-- =====================================================

-- 檢查索引是否已存在
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_teachers_is_deleted')
BEGIN
    -- 為 is_deleted 欄位添加索引以提高查詢效能
    CREATE INDEX IX_teachers_is_deleted ON teachers(is_deleted);
    PRINT N'已為 is_deleted 欄位添加索引';
END
ELSE
BEGIN
    PRINT N'is_deleted 欄位的索引已存在';
END
GO

-- =====================================================
-- 3. 更新查詢視圖以包含 is_deleted 欄位
-- =====================================================

-- 更新 view_teachers_summary 視圖
IF EXISTS (SELECT * FROM sys.views WHERE name = 'view_teachers_summary')
BEGIN
    DROP VIEW [dbo].[view_teachers_summary];
    PRINT N'已刪除舊的 view_teachers_summary 視圖';
END

-- 重新創建視圖
CREATE VIEW [dbo].[view_teachers_summary] AS
SELECT 
    t.[id],
    t.[name],
    t.[email],
    t.[phone],
    t.[specialties],
    t.[available_days],
    t.[hourly_rate],
    t.[experience],
    t.[bio],
    t.[is_active],
    t.[is_deleted],
    CASE 
        WHEN t.[is_deleted] = 1 THEN N'已刪除'
        WHEN t.[is_active] = 1 THEN N'啟用'
        ELSE N'停用'
    END as [status_name],
    t.[created_at],
    t.[updated_at],
    -- 統計課程數量（只計算未刪除的師資）
    CASE 
        WHEN t.[is_deleted] = 1 THEN 0
        ELSE (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id])
    END as [total_courses],
    CASE 
        WHEN t.[is_deleted] = 1 THEN 0
        ELSE (SELECT COUNT(*) FROM [dbo].[teacher_courses] tc WHERE tc.[teacher_id] = t.[id] AND tc.[is_preferred] = 1)
    END as [preferred_courses]
FROM [dbo].[teachers] t;

PRINT N'已重新創建 view_teachers_summary 視圖';
GO

-- =====================================================
-- 4. 顯示更新結果
-- =====================================================

PRINT N'=== 更新結果 ===';
SELECT 
    'teachers' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_active = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as active_records,
    SUM(CASE WHEN is_active = 0 AND is_deleted = 0 THEN 1 ELSE 0 END) as inactive_records,
    SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted_records
FROM teachers;

-- 顯示欄位結構
PRINT N'=== teachers 表欄位結構 ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'teachers' 
ORDER BY ORDINAL_POSITION;
GO

PRINT N'=== is_deleted 欄位添加完成 ===';
PRINT N'現在 teachers 表有以下狀態：';
PRINT N'1. is_active = 1, is_deleted = 0: 啟用中';
PRINT N'2. is_active = 0, is_deleted = 0: 停用中';
PRINT N'3. is_deleted = 1: 已刪除（軟刪除）';
GO 