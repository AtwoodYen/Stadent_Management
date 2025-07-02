-- 創建 atwood 用戶
-- 帳號: atwood，密碼: 123456
-- 創建日期：2025-01-28

-- 確認用戶不存在
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'atwood')
BEGIN
    -- 新增 atwood 用戶
    INSERT INTO users (
        username, 
        email, 
        password_hash, 
        full_name, 
        role, 
        is_active,
        phone, 
        department, 
        email_verified, 
        password_changed_at,
        created_at,
        updated_at
    ) VALUES (
        'atwood',
        'atwood@example.com',
        '$2b$12$q4/Rhfjz2/GdoOM3szyu9Ooyz3N2Ty0LUrcpptIxhMCTf.BZ5Jrua', -- 密碼: 123456
        N'Atwood',
        'admin',
        1,
        '0912-345-678',
        N'系統開發',
        1,
        GETDATE(),
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'atwood 用戶已成功創建，密碼為 123456';
    
    -- 顯示創建結果
    SELECT 
        id,
        username,
        email,
        full_name,
        role,
        is_active,
        department,
        created_at
    FROM users 
    WHERE username = 'atwood';
END
ELSE
BEGIN
    PRINT '錯誤：用戶 atwood 已存在';
    
    -- 顯示現有用戶資訊
    SELECT 
        id,
        username,
        email,
        full_name,
        role,
        is_active,
        department,
        created_at
    FROM users 
    WHERE username = 'atwood';
END 