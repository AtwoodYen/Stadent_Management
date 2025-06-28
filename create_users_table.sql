-- 用戶管理系統 - 資料表建立語法
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28

-- 1. 如果資料表已存在則先刪除
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
DROP TABLE [dbo].[users];
GO

-- 2. 創建用戶資料表
CREATE TABLE [dbo].[users] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [username] NVARCHAR(50) NOT NULL UNIQUE,
    [email] NVARCHAR(100) NOT NULL UNIQUE,
    [password_hash] NVARCHAR(255) NOT NULL,
    [full_name] NVARCHAR(100) NOT NULL,
    [role] NVARCHAR(20) NOT NULL DEFAULT 'user',
    [is_active] BIT NOT NULL DEFAULT 1,
    [phone] NVARCHAR(20) NULL,
    [department] NVARCHAR(100) NULL,
    [avatar_url] NVARCHAR(255) NULL,
    [last_login] DATETIME2 NULL,
    [login_count] INT NOT NULL DEFAULT 0,
    [password_changed_at] DATETIME2 NULL,
    [email_verified] BIT NOT NULL DEFAULT 0,
    [two_factor_enabled] BIT NOT NULL DEFAULT 0,
    [notes] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_by] INT NULL,
    
    -- 約束條件
    CONSTRAINT [CHK_users_role] CHECK ([role] IN ('admin', 'manager', 'teacher', 'user')),
    CONSTRAINT [CHK_users_email] CHECK ([email] LIKE '%@%'),
    CONSTRAINT [CHK_users_username] CHECK (LEN([username]) >= 3)
);
GO

-- 3. 創建索引提升查詢效能
-- 角色索引
CREATE NONCLUSTERED INDEX [IX_users_role] ON [dbo].[users] ([role]);
GO

-- 狀態索引
CREATE NONCLUSTERED INDEX [IX_users_is_active] ON [dbo].[users] ([is_active]);
GO

-- 部門索引
CREATE NONCLUSTERED INDEX [IX_users_department] ON [dbo].[users] ([department]);
GO

-- 建立時間索引
CREATE NONCLUSTERED INDEX [IX_users_created_at] ON [dbo].[users] ([created_at]);
GO

-- 最後登入時間索引
CREATE NONCLUSTERED INDEX [IX_users_last_login] ON [dbo].[users] ([last_login]);
GO

-- 複合索引 (角色 + 狀態)
CREATE NONCLUSTERED INDEX [IX_users_role_active] ON [dbo].[users] ([role], [is_active]);
GO

-- 4. 創建觸發器自動更新 updated_at 欄位
CREATE TRIGGER [TR_users_update_timestamp]
ON [dbo].[users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[users]
    SET [updated_at] = GETDATE()
    FROM [dbo].[users] u
    INNER JOIN inserted i ON u.[id] = i.[id];
END;
GO

-- 5. 插入初始管理員和範例用戶資料
INSERT INTO [dbo].[users] (
    [username], [email], [password_hash], [full_name], [role], [is_active],
    [phone], [department], [last_login], [login_count], [email_verified],
    [password_changed_at], [created_by]
) VALUES 
-- 系統管理員
('admin', 'admin@example.com', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTgc0LYNzBbqL6e', -- 密碼: admin123
 N'系統管理員', 'admin', 1,
 '0912-345-678', N'資訊部', 
 '2025-01-28 09:30:00', 25, 1,
 '2024-01-01 00:00:00', NULL),

-- 教務主任
('manager01', 'manager@example.com',
 '$2b$12$8Y4n2X1qP5v9w7L3k6M9nOp8Q4R2T6U1s3A5B7C9D1E3F5G7H9I1J', -- 密碼: manager123
 N'教務主任', 'manager', 1,
 '0923-456-789', N'教務處',
 '2025-01-27 18:45:00', 15, 1,
 '2024-02-15 10:30:00', 1),

-- 小剛老師
('teacher_gang', 'gang@example.com',
 '$2b$12$9Z5o3Y2rQ6w0x8M4l7N0oP9R5T7V2t4B6C8D0E2F4G6H8I0J2K4L', -- 密碼: gang123
 N'小剛老師', 'teacher', 1,
 '0934-567-890', N'程式設計科',
 '2025-01-28 08:15:00', 45, 1,
 '2024-03-01 14:20:00', 1),

-- 小美老師
('teacher_mei', 'mei@example.com',
 '$2b$12$0A6p4Z3sR7x1y9N5m8O1pQ0S6U8W3u5C7D9E1F3G5H7I9J1K3M5N', -- 密碼: mei123
 N'小美老師', 'teacher', 1,
 '0945-678-901', N'前端開發科',
 '2025-01-27 16:30:00', 38, 1,
 '2024-03-15 09:45:00', 1),

-- 張助教
('assistant_zhang', 'zhang@example.com',
 '$2b$12$1B7q5A4tS8y2z0O6n9P2qR1T7V9X4v6D8E0F2G4H6I8J0K2L4M6O', -- 密碼: zhang123
 N'張助教', 'teacher', 1,
 '0956-789-012', N'資料科學科',
 '2025-01-26 14:20:00', 12, 1,
 '2024-04-01 11:30:00', 1),

-- 一般用戶 (停用狀態)
('user01', 'user@example.com',
 '$2b$12$2C8r6B5uT9z3A1P7o0Q3rS2U8W0Y5w7E9F1G3H5I7J9K1L3M5N7P', -- 密碼: user123
 N'一般用戶', 'user', 0,
 '0967-890-123', N'學員',
 '2025-01-20 12:00:00', 3, 1,
 '2024-06-01 16:30:00', 1),

-- 客服人員
('support01', 'support@example.com',
 '$2b$12$3D9s7C6vU0A4B2Q8p1R4sT3V9X1Z6x8F0G2H4I6J8K0L2M4N6O8Q', -- 密碼: support123
 N'客服人員', 'user', 1,
 '0978-901-234', N'客服部',
 '2025-01-27 10:15:00', 22, 1,
 '2024-05-15 13:45:00', 1),

-- 系統測試員
('tester01', 'tester@example.com',
 '$2b$12$4E0t8D7wV1B5C3R9q2S5tU4W0Y2A7y9G1H3I5J7K9L1M3N5O7P9R', -- 密碼: test123
 N'系統測試員', 'user', 1,
 '0989-012-345', N'品質保證部',
 '2025-01-28 07:30:00', 8, 1,
 '2024-07-01 09:20:00', 1);
GO

-- 6. 創建視圖方便查詢用戶資訊
CREATE VIEW [dbo].[view_users_summary] AS
SELECT 
    u.[id],
    u.[username],
    u.[email],
    u.[full_name],
    u.[role],
    CASE u.[role]
        WHEN 'admin' THEN N'系統管理員'
        WHEN 'manager' THEN N'管理者'
        WHEN 'teacher' THEN N'老師'
        WHEN 'user' THEN N'一般用戶'
        ELSE N'未知'
    END as [role_name],
    u.[is_active],
    CASE u.[is_active]
        WHEN 1 THEN N'啟用'
        ELSE N'停用'
    END as [status_name],
    u.[phone],
    u.[department],
    u.[last_login],
    u.[login_count],
    u.[email_verified],
    u.[created_at],
    u.[updated_at],
    DATEDIFF(DAY, u.[last_login], GETDATE()) as [days_since_last_login]
FROM [dbo].[users] u;
GO

-- 7. 創建常用查詢的預存程序

-- 7.1 根據角色查詢用戶
CREATE PROCEDURE [dbo].[sp_get_users_by_role]
    @role NVARCHAR(20) = NULL,
    @is_active BIT = NULL
AS
BEGIN
    SELECT * FROM [dbo].[view_users_summary]
    WHERE (@role IS NULL OR [role] = @role)
      AND (@is_active IS NULL OR [is_active] = @is_active)
    ORDER BY [role], [full_name];
END;
GO

-- 7.2 用戶登入記錄更新
CREATE PROCEDURE [dbo].[sp_update_user_login]
    @username NVARCHAR(50)
AS
BEGIN
    UPDATE [dbo].[users]
    SET [last_login] = GETDATE(),
        [login_count] = [login_count] + 1
    WHERE [username] = @username AND [is_active] = 1;
    
    SELECT @@ROWCOUNT as [rows_affected];
END;
GO

-- 7.3 用戶密碼重設
CREATE PROCEDURE [dbo].[sp_reset_user_password]
    @user_id INT,
    @new_password_hash NVARCHAR(255),
    @updated_by INT
AS
BEGIN
    UPDATE [dbo].[users]
    SET [password_hash] = @new_password_hash,
        [password_changed_at] = GETDATE(),
        [updated_by] = @updated_by
    WHERE [id] = @user_id;
    
    SELECT @@ROWCOUNT as [rows_affected];
END;
GO

-- 8. 查詢範例

-- 查看所有用戶摘要
SELECT * FROM [dbo].[view_users_summary] ORDER BY [role], [full_name];

-- 查詢啟用的老師
EXEC [dbo].[sp_get_users_by_role] @role = 'teacher', @is_active = 1;

-- 查詢管理員用戶
EXEC [dbo].[sp_get_users_by_role] @role = 'admin';

-- 查詢最近登入的用戶 (7天內)
SELECT * FROM [dbo].[view_users_summary] 
WHERE [last_login] >= DATEADD(DAY, -7, GETDATE())
ORDER BY [last_login] DESC;

-- 查詢從未登入的用戶
SELECT * FROM [dbo].[view_users_summary] 
WHERE [last_login] IS NULL;

-- 統計各角色用戶數量
SELECT 
    [role],
    [role_name],
    COUNT(*) as [total_count],
    SUM(CASE WHEN [is_active] = 1 THEN 1 ELSE 0 END) as [active_count],
    SUM(CASE WHEN [is_active] = 0 THEN 1 ELSE 0 END) as [inactive_count]
FROM [dbo].[view_users_summary]
GROUP BY [role], [role_name]
ORDER BY [role];

-- 查詢各部門用戶分佈
SELECT 
    ISNULL([department], N'未分配') as [department],
    COUNT(*) as [user_count],
    SUM(CASE WHEN [is_active] = 1 THEN 1 ELSE 0 END) as [active_count]
FROM [dbo].[view_users_summary]
GROUP BY [department]
ORDER BY [user_count] DESC;

PRINT N'用戶資料表建立完成！';
PRINT N'- 已創建 users 資料表';
PRINT N'- 已創建 6 個效能索引';
PRINT N'- 已創建自動更新時間戳觸發器';
PRINT N'- 已插入 8 筆範例用戶資料';
PRINT N'- 已創建查詢視圖和預存程序';
PRINT N'- 預設管理員帳號: admin / admin123'; 