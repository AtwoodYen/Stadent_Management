-- 更新 admin 用戶的密碼為 580602
-- 創建日期：2025-01-28

-- 確認用戶存在
IF EXISTS (SELECT 1 FROM users WHERE username = 'admin')
BEGIN
    -- 更新密碼哈希值 (密碼: 580602)
    UPDATE users 
    SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTgc0LYNzBbqL6e',
        password_changed_at = GETDATE(),
        updated_at = GETDATE()
    WHERE username = 'admin';
    
    PRINT 'admin 用戶密碼已更新為 580602';
    
    -- 顯示更新結果
    SELECT 
        username,
        full_name,
        role,
        password_changed_at,
        updated_at
    FROM users 
    WHERE username = 'admin';
END
ELSE
BEGIN
    PRINT '錯誤：找不到用戶 admin';
END 