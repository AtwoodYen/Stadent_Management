-- 新增帳號鎖定相關欄位到 users 資料表
-- 執行前請確保已連接到正確的資料庫

USE [your_database_name]; -- 請替換成實際的資料庫名稱

-- 新增兩個欄位
ALTER TABLE users 
ADD 
    is_locked BIT DEFAULT 0,                    -- 帳號是否被鎖定 (0=未鎖定, 1=已鎖定)
    unlock_time DATETIME2 NULL;                 -- 解鎖時間 (NULL=未設定解鎖時間)

-- 新增註解說明
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'帳號是否因連續錯誤登入而被鎖定 (0=未鎖定, 1=已鎖定)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'users', 
    @level2type = N'COLUMN', @level2name = N'is_locked';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'帳號解鎖時間，超過此時間後帳號自動解鎖', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'users', 
    @level2type = N'COLUMN', @level2name = N'unlock_time';

-- 檢視新增結果
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
    AND COLUMN_NAME IN ('is_locked', 'unlock_time')
ORDER BY ORDINAL_POSITION;

PRINT '帳號鎖定欄位新增完成！';
PRINT 'is_locked: 記錄帳號是否被鎖定';
PRINT 'unlock_time: 記錄帳號解鎖時間'; 