-- 最基本版本：為課程資料表新增排序欄位
-- 適用於 MS SQL Server
-- 說明：只做最基本的操作，避免所有可能的問題

PRINT N'=== 開始執行課程排序欄位新增（最基本版本） ===';

-- 步驟 1: 檢查資料表是否存在
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND type in (N'U'))
BEGIN
    PRINT N'錯誤：courses 資料表不存在！';
    RETURN;
END
PRINT N'✓ courses 資料表存在';

-- 步驟 2: 檢查欄位是否已存在
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order')
BEGIN
    PRINT N'✓ sort_order 欄位已存在，跳過新增步驟';
    GOTO UpdateData;
END

-- 步驟 3: 新增 sort_order 欄位
PRINT N'正在新增 sort_order 欄位...';
ALTER TABLE [dbo].[courses] ADD [sort_order] INT NULL;
PRINT N'✓ 已新增 sort_order 欄位';

UpdateData:
-- 步驟 4: 設定初始排序值
PRINT N'正在設定初始排序值...';
UPDATE [dbo].[courses] 
SET [sort_order] = [id]
WHERE [sort_order] IS NULL;

DECLARE @UpdatedRows INT = @@ROWCOUNT;
PRINT N'✓ 已設定 ' + CAST(@UpdatedRows AS NVARCHAR(10)) + N' 筆課程的初始排序值';

-- 步驟 5: 最終驗證
PRINT N'';
PRINT N'=== 最終驗證 ===';

-- 檢查欄位資訊
SELECT 
    COLUMN_NAME as [欄位名稱],
    DATA_TYPE as [資料類型],
    IS_NULLABLE as [可為空]
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';

-- 檢查資料
SELECT TOP 5 
    [id],
    [name] as [課程名稱],
    [sort_order] as [排序順序]
FROM [dbo].[courses] 
ORDER BY [sort_order];

PRINT N'';
PRINT N'=== 課程排序欄位新增完成 ===';
PRINT N'如果看到此訊息，表示腳本執行完成！'; 