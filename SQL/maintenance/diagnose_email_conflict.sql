-- 診斷 email 衝突問題
-- 檢查 atwood.yen.gun@gmail.com 的使用情況
-- 創建日期：2025-01-29

USE TutoringDB;
GO

DECLARE @target_email NVARCHAR(100) = 'atwood.yen.gun@gmail.com';

PRINT '=== Email 衝突診斷報告 ===';
PRINT '目標 Email: ' + @target_email;
PRINT '';

-- 1. 檢查 users 表
PRINT '--- 檢查 users 表 ---';
IF EXISTS (SELECT 1 FROM users WHERE email = @target_email)
BEGIN
    SELECT 
        id,
        username,
        email,
        full_name,
        role,
        is_active,
        created_at
    FROM users 
    WHERE email = @target_email;
    
    PRINT '在 users 表中找到此 email';
END
ELSE
BEGIN
    PRINT '在 users 表中未找到此 email';
END
PRINT '';

-- 2. 檢查 teachers 表
PRINT '--- 檢查 teachers 表 ---';
IF EXISTS (SELECT 1 FROM teachers WHERE email = @target_email)
BEGIN
    SELECT 
        id,
        name,
        email,
        phone,
        is_active,
        created_at
    FROM teachers 
    WHERE email = @target_email;
    
    PRINT '在 teachers 表中找到此 email';
END
ELSE
BEGIN
    PRINT '在 teachers 表中未找到此 email';
END
PRINT '';

-- 3. 檢查類似的 email（可能有空格或大小寫差異）
PRINT '--- 檢查類似的 email ---';
SELECT 'users' as table_name, id as record_id, username as identifier, email, LEN(email) as email_length
FROM users 
WHERE LOWER(LTRIM(RTRIM(email))) = LOWER(LTRIM(RTRIM(@target_email)))
   OR email LIKE '%atwood.yen.gun%'
UNION ALL
SELECT 'teachers' as table_name, id as record_id, name as identifier, email, LEN(email) as email_length
FROM teachers 
WHERE LOWER(LTRIM(RTRIM(email))) = LOWER(LTRIM(RTRIM(@target_email)))
   OR email LIKE '%atwood.yen.gun%'
ORDER BY table_name, record_id;

-- 4. 檢查資料庫約束
PRINT '';
PRINT '--- 檢查資料庫約束 ---';
SELECT 
    t.name AS table_name,
    kc.name AS constraint_name,
    c.name AS column_name,
    kc.type AS constraint_type
FROM sys.key_constraints kc
INNER JOIN sys.tables t ON kc.parent_object_id = t.object_id
INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name IN ('users', 'teachers')
  AND c.name = 'email'
ORDER BY table_name;

-- 5. 測試實際插入
PRINT '';
PRINT '--- 測試實際插入到 teachers 表 ---';
BEGIN TRY
    BEGIN TRANSACTION;
    
    -- 嘗試插入到 teachers 表
    INSERT INTO teachers (name, email, phone, specialties, available_days, hourly_rate, experience, bio, is_active)
    VALUES ('測試老師', @target_email, '0900-000-000', '[]', '[]', 1000, 1, '測試', 1);
    
    PRINT '成功：可以在 teachers 表中插入此 email';
    
    ROLLBACK TRANSACTION;
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '失敗：無法在 teachers 表中插入此 email';
    PRINT '錯誤號碼：' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT '錯誤訊息：' + ERROR_MESSAGE();
END CATCH;

-- 6. 檢查是否有觸發器
PRINT '';
PRINT '--- 檢查觸發器 ---';
SELECT 
    t.name AS table_name,
    tr.name AS trigger_name,
    tr.is_disabled,
    OBJECT_DEFINITION(tr.object_id) AS trigger_definition
FROM sys.triggers tr
INNER JOIN sys.tables t ON tr.parent_id = t.object_id
WHERE t.name IN ('users', 'teachers')
ORDER BY table_name, trigger_name;

PRINT '';
PRINT '=== 診斷完成 ===';

GO 