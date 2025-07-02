-- 插入初始用戶資料
-- 創建日期：2025-01-28

-- 先確保資料表存在
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    PRINT '錯誤：users 資料表不存在，請先執行 create_users_table.sql';
    RETURN;
END;

-- 清空現有資料（可選）
-- DELETE FROM [dbo].[users];

-- 插入用戶資料
INSERT INTO [dbo].[users] (
    [username], [email], [password_hash], [full_name], [role], [is_active],
    [phone], [department], [email_verified], [password_changed_at]
) VALUES 
-- Atwood (您的個人帳號)
('atwood', 'atwood@example.com', 
 '$2b$12$q4/Rhfjz2/GdoOM3szyu9Ooyz3N2Ty0LUrcpptIxhMCTf.BZ5Jrua', -- 密碼: 123456
 N'Atwood', 'admin', 1,
 '0912-345-678', N'系統開發', 1, GETDATE()),

-- 系統管理員
('admin', 'admin@example.com', 
 '$2b$12$WIOEmhdpaIJ8I5D0hyYu7e5DRG8X1mLeMCYy/k/r6702sp7Sye2t.', -- 密碼: 580602
 N'系統管理員', 'admin', 1,
 '0923-456-789', N'資訊部', 1, GETDATE()),

-- 教務主任
('manager', 'manager@example.com',
 '$2b$12$q4/Rhfjz2/GdoOM3szyu9Ooyz3N2Ty0LUrcpptIxhMCTf.BZ5Jrua', -- 密碼: 123456
 N'教務主任', 'manager', 1,
 '0934-567-890', N'教務處', 1, GETDATE()),

-- 小剛老師
('teacher', 'teacher@example.com',
 '$2b$12$q4/Rhfjz2/GdoOM3szyu9Ooyz3N2Ty0LUrcpptIxhMCTf.BZ5Jrua', -- 密碼: 123456
 N'小剛老師', 'teacher', 1,
 '0945-678-901', N'程式設計科', 1, GETDATE());

GO

-- 顯示插入結果
SELECT 
    username, 
    full_name, 
    role, 
    is_active,
    email_verified,
    created_at
FROM [dbo].[users] 
ORDER BY role, username;

PRINT '用戶資料插入完成！'; 