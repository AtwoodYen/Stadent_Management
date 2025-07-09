-- 簡單版本：為課程資料表新增排序欄位
-- 適用於 MS SQL Server

-- 檢查並新增 sort_order 欄位
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order')
BEGIN
    ALTER TABLE [dbo].[courses] ADD [sort_order] INT NULL;
    PRINT N'已新增 sort_order 欄位';
END
ELSE
BEGIN
    PRINT N'sort_order 欄位已存在';
END

-- 設定初始值
UPDATE [dbo].[courses] 
SET [sort_order] = [id]
WHERE [sort_order] IS NULL;

PRINT N'已設定初始排序值';

-- 顯示結果
SELECT TOP 5 
    [id],
    [name],
    [sort_order]
FROM [dbo].[courses] 
ORDER BY [sort_order]; 