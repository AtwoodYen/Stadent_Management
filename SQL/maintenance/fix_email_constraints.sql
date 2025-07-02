-- 修正 email 約束問題
-- 允許同一 email 同時存在於 users 和 teachers 表中
-- 但在同一表內仍保持唯一性
-- 創建日期：2025-01-29

USE TutoringDB;
GO

PRINT '=== 開始修正 email 約束 ===';

-- 1. 檢查當前約束狀況
PRINT '--- 檢查當前的 UNIQUE 約束 ---';
SELECT 
    t.name AS table_name,
    i.name AS constraint_name,
    c.name AS column_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('users', 'teachers')
  AND c.name = 'email'
  AND i.is_unique_constraint = 1;

-- 2. 檢查是否有 email 衝突的情況
PRINT '--- 檢查跨表 email 使用情況 ---';
SELECT 
    u.email,
    u.username AS user_account,
    u.full_name AS user_name,
    t.name AS teacher_name,
    t.id AS teacher_id
FROM users u
FULL OUTER JOIN teachers t ON u.email = t.email
WHERE u.email IS NOT NULL OR t.email IS NOT NULL
ORDER BY COALESCE(u.email, t.email);

-- 3. 如果有衝突，顯示詳細信息
PRINT '--- 檢查實際的 email 衝突 ---';
WITH CrossTableEmails AS (
    SELECT email, 'users' as source_table, username as identifier
    FROM users
    UNION ALL
    SELECT email, 'teachers' as source_table, name as identifier  
    FROM teachers
)
SELECT 
    email,
    COUNT(*) as total_count,
    STRING_AGG(source_table + ':' + identifier, ', ') as locations
FROM CrossTableEmails
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. 備份當前數據
PRINT '--- 備份當前數據以防萬一 ---';
-- 這裡只是顯示數據，實際執行時可以考慮創建備份表

-- 5. 確認當前約束不會造成問題
-- 實際上，UNIQUE 約束只在表內生效，不應該跨表
-- 讓我們驗證一下當前的設置

PRINT '--- 檢查約束詳細信息 ---';
SELECT 
    t.name AS table_name,
    cc.name AS constraint_name,
    cc.type_desc AS constraint_type,
    c.name AS column_name
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id
WHERE t.name IN ('users', 'teachers')
UNION ALL
SELECT 
    t.name AS table_name,
    kc.name AS constraint_name,
    'UNIQUE' AS constraint_type,
    c.name AS column_name
FROM sys.key_constraints kc
INNER JOIN sys.tables t ON kc.parent_object_id = t.object_id
INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name IN ('users', 'teachers')
  AND c.name = 'email'
ORDER BY table_name, constraint_type;

-- 6. 測試插入相同 email 到兩個表
PRINT '--- 測試跨表 email 插入 ---';
BEGIN TRY
    BEGIN TRANSACTION;
    
    -- 測試用的 email
    DECLARE @test_email NVARCHAR(100) = 'test.cross.table@example.com';
    
    -- 先確保測試 email 不存在
    DELETE FROM teachers WHERE email = @test_email;
    DELETE FROM users WHERE email = @test_email;
    
    -- 嘗試在 users 表插入
    INSERT INTO users (username, email, password_hash, full_name, role, is_active)
    VALUES ('test_user', @test_email, 'test_hash', 'Test User', 'user', 1);
    
    PRINT '成功在 users 表插入測試 email';
    
    -- 嘗試在 teachers 表插入相同的 email
    INSERT INTO teachers (name, email, phone, specialties, available_days, hourly_rate, experience, bio, is_active)
    VALUES ('Test Teacher', @test_email, '0900-000-000', '[]', '[]', 1000, 1, 'Test bio', 1);
    
    PRINT '成功在 teachers 表插入相同的測試 email';
    
    -- 清理測試數據
    DELETE FROM teachers WHERE email = @test_email;
    DELETE FROM users WHERE email = @test_email;
    
    ROLLBACK TRANSACTION;
    PRINT '測試完成：跨表 email 插入成功';
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '錯誤：無法在兩個表中使用相同的 email';
    PRINT '錯誤信息：' + ERROR_MESSAGE();
    PRINT '錯誤號碼：' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
END CATCH;

-- 7. 結論和建議
PRINT '=== 分析結果 ===';
PRINT '如果上面的測試失敗，說明確實存在跨表的 email 約束問題';
PRINT '如果測試成功，問題可能出在其他地方';
PRINT '';
PRINT '可能的原因：';
PRINT '1. 資料庫層級的觸發器或約束';
PRINT '2. 應用層級的額外檢查';
PRINT '3. 實際的 email 已經存在於其中一個表中';
PRINT '';
PRINT '建議的調查步驟：';
PRINT '1. 檢查是否有全域的 email 唯一性觸發器';
PRINT '2. 查看應用程式碼中的 email 驗證邏輯';
PRINT '3. 確認具體的 email 是否真的存在衝突';

GO 