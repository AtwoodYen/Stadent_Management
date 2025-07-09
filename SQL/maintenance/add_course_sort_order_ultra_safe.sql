-- 超安全版本：為課程資料表新增排序欄位
-- 適用於 MS SQL Server
-- 說明：完全避免在欄位新增之前使用該欄位

PRINT N'=== 開始執行課程排序欄位新增（超安全版本） ===';

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
BEGIN TRY
    ALTER TABLE [dbo].[courses] ADD [sort_order] INT NULL;
    PRINT N'✓ 已新增 sort_order 欄位';
END TRY
BEGIN CATCH
    PRINT N'✗ 新增 sort_order 欄位失敗：' + ERROR_MESSAGE();
    RETURN;
END CATCH

-- 步驟 4: 再次檢查欄位是否新增成功
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND name = 'sort_order')
BEGIN
    PRINT N'✗ sort_order 欄位新增失敗！';
    RETURN;
END
PRINT N'✓ sort_order 欄位確認存在';

UpdateData:
-- 步驟 5: 檢查現有資料（不查詢 sort_order 欄位）
PRINT N'正在檢查現有資料...';
DECLARE @TotalRows INT;
SELECT @TotalRows = COUNT(*) FROM [dbo].[courses];
PRINT N'總課程數：' + CAST(@TotalRows AS NVARCHAR(10));

-- 步驟 6: 設定初始排序值（使用動態 SQL 避免編譯時檢查）
PRINT N'正在設定初始排序值...';
BEGIN TRY
    DECLARE @UpdateSQL NVARCHAR(MAX) = N'UPDATE [dbo].[courses] SET [sort_order] = [id] WHERE [sort_order] IS NULL';
    EXEC sp_executesql @UpdateSQL;
    
    DECLARE @UpdatedRows INT = @@ROWCOUNT;
    PRINT N'✓ 已設定 ' + CAST(@UpdatedRows AS NVARCHAR(10)) + N' 筆課程的初始排序值';
END TRY
BEGIN CATCH
    PRINT N'✗ 設定初始排序值失敗：' + ERROR_MESSAGE();
    RETURN;
END CATCH

-- 步驟 7: 將欄位設為 NOT NULL
PRINT N'正在設定欄位為 NOT NULL...';
BEGIN TRY
    ALTER TABLE [dbo].[courses] ALTER COLUMN [sort_order] INT NOT NULL;
    PRINT N'✓ 已將 sort_order 欄位設為 NOT NULL';
END TRY
BEGIN CATCH
    PRINT N'✗ 設定 NOT NULL 失敗：' + ERROR_MESSAGE();
    PRINT N'注意：欄位仍為可為 NULL，但不影響功能';
END CATCH

-- 步驟 8: 建立索引
PRINT N'正在建立索引...';
BEGIN TRY
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_courses_sort_order')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_courses_sort_order] ON [dbo].[courses] ([sort_order]);
        PRINT N'✓ 已建立 sort_order 索引';
    END
    ELSE
    BEGIN
        PRINT N'✓ sort_order 索引已存在';
    END
END TRY
BEGIN CATCH
    PRINT N'✗ 建立索引失敗：' + ERROR_MESSAGE();
END CATCH

-- 步驟 9: 新增預設值約束
PRINT N'正在新增預設值約束...';
BEGIN TRY
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_courses_sort_order')
    BEGIN
        ALTER TABLE [dbo].[courses] ADD CONSTRAINT [DF_courses_sort_order] DEFAULT (0) FOR [sort_order];
        PRINT N'✓ 已新增 sort_order 預設值約束';
    END
    ELSE
    BEGIN
        PRINT N'✓ sort_order 預設值約束已存在';
    END
END TRY
BEGIN CATCH
    PRINT N'✗ 新增預設值約束失敗：' + ERROR_MESSAGE();
END CATCH

-- 步驟 10: 最終驗證
PRINT N'';
PRINT N'=== 最終驗證 ===';

-- 檢查欄位資訊
BEGIN TRY
    SELECT 
        COLUMN_NAME as [欄位名稱],
        DATA_TYPE as [資料類型],
        IS_NULLABLE as [可為空],
        COLUMN_DEFAULT as [預設值]
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'sort_order';
    
    PRINT N'✓ 欄位資訊查詢成功';
END TRY
BEGIN CATCH
    PRINT N'✗ 欄位資訊查詢失敗：' + ERROR_MESSAGE();
END CATCH

-- 檢查資料（使用動態 SQL）
BEGIN TRY
    DECLARE @SelectSQL NVARCHAR(MAX) = N'SELECT TOP 10 [id], [name] as [課程名稱], [category] as [課程分類], [sort_order] as [排序順序] FROM [dbo].[courses] ORDER BY [sort_order], [id]';
    EXEC sp_executesql @SelectSQL;
    
    PRINT N'✓ 課程排序查詢成功';
END TRY
BEGIN CATCH
    PRINT N'✗ 課程排序查詢失敗：' + ERROR_MESSAGE();
END CATCH

PRINT N'';
PRINT N'=== 課程排序欄位新增完成 ===';
PRINT N'如果看到此訊息，表示腳本執行完成！'; 