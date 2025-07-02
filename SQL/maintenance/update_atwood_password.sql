-- 更新 atwood 用戶的密碼
-- 將密碼改為 123456
-- 創建日期：2025-01-28

-- 確認用戶存在
IF EXISTS (SELECT 1 FROM users WHERE username = 'atwood')
BEGIN
    -- 更新密碼哈希值 (密碼: 123456)
    UPDATE users 
    SET password_hash = '$2b$12$q4/Rhfjz2/GdoOM3szyu9Ooyz3N2Ty0LUrcpptIxhMCTf.BZ5Jrua',
        password_changed_at = GETDATE(),
        updated_at = GETDATE()
    WHERE username = 'atwood';
    
    PRINT 'atwood 用戶密碼已更新為 123456';
    
    -- 顯示更新結果
    SELECT 
        username,
        full_name,
        role,
        password_changed_at,
        updated_at
    FROM users 
    WHERE username = 'atwood';
END
ELSE
BEGIN
    PRINT '錯誤：找不到用戶 atwood';
END 