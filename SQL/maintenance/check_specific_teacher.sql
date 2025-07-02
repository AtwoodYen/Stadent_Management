-- 檢查特定師資的 email 衝突
-- 創建日期：2025-01-29

USE TutoringDB;
GO

DECLARE @target_email NVARCHAR(100) = 'atwood.yen.gun@gmail.com';

PRINT '=== 師資 Email 衝突詳細檢查 ===';
PRINT '目標 Email: ' + @target_email;
PRINT '';

-- 1. 顯示所有使用此 email 的師資記錄
PRINT '--- 所有使用此 email 的師資記錄 ---';
SELECT 
    id,
    name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
FROM teachers 
WHERE email = @target_email
ORDER BY id;

-- 2. 檢查是否有類似的 email（可能有空格、大小寫差異）
PRINT '';
PRINT '--- 檢查類似的 email ---';
SELECT 
    id,
    name,
    email,
    '[' + email + ']' as email_with_brackets,
    LEN(email) as email_length,
    ASCII(SUBSTRING(email, 1, 1)) as first_char_ascii,
    ASCII(SUBSTRING(email, LEN(email), 1)) as last_char_ascii
FROM teachers 
WHERE LOWER(LTRIM(RTRIM(email))) = LOWER(LTRIM(RTRIM(@target_email)))
   OR email LIKE '%atwood%'
ORDER BY id;

-- 3. 測試更新操作（假設要更新 ID=1 的師資）
PRINT '';
PRINT '--- 測試更新操作 ---';
DECLARE @test_teacher_id INT;

-- 找出第一個使用此 email 的師資 ID
SELECT TOP 1 @test_teacher_id = id 
FROM teachers 
WHERE email = @target_email
ORDER BY id;

IF @test_teacher_id IS NOT NULL
BEGIN
    PRINT '正在測試更新師資 ID: ' + CAST(@test_teacher_id AS NVARCHAR(10));
    
    -- 測試更新時的 email 檢查查詢
    SELECT 
        id,
        name,
        email,
        '會阻止更新' as check_result
    FROM teachers 
    WHERE email = @target_email 
      AND id != @test_teacher_id;
      
    IF @@ROWCOUNT > 0
    BEGIN
        PRINT '發現衝突：有其他師資使用相同的 email';
    END
    ELSE
    BEGIN
        PRINT '沒有衝突：可以更新此師資的 email';
    END
END
ELSE
BEGIN
    PRINT '沒有找到使用此 email 的師資記錄';
END

-- 4. 檢查 users 表中是否有相同 email
PRINT '';
PRINT '--- 檢查 users 表 ---';
SELECT 
    id,
    username,
    email,
    full_name,
    role,
    is_active
FROM users 
WHERE email = @target_email;

IF @@ROWCOUNT > 0
BEGIN
    PRINT '在 users 表中找到相同 email';
END
ELSE
BEGIN
    PRINT '在 users 表中沒有找到相同 email';
END

PRINT '';
PRINT '=== 檢查完成 ===';

GO 