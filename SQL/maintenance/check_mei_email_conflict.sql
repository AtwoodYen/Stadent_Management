-- 檢查 mei@example.com 的使用情況
-- 創建日期：2025-01-29

USE TutoringDB;
GO

DECLARE @conflict_email NVARCHAR(100) = 'mei@example.com';

PRINT '=== 檢查 mei@example.com 的使用情況 ===';
PRINT '衝突的 Email: ' + @conflict_email;
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
WHERE email = @conflict_email
ORDER BY id;

-- 2. 檢查這些記錄的詳細信息
PRINT '';
PRINT '--- 詳細記錄信息 ---';
SELECT 
    id,
    name,
    email,
    phone,
    specialties,
    available_days,
    hourly_rate,
    experience,
    bio,
    is_active
FROM teachers 
WHERE email = @conflict_email
ORDER BY id;

-- 3. 建議的解決方案
PRINT '';
PRINT '=== 解決方案建議 ===';
PRINT '發現重複的 email 記錄，可以採取以下行動：';
PRINT '1. 如果有重複記錄，刪除多餘的記錄';
PRINT '2. 將其中一筆記錄的 email 改為不同的值';
PRINT '3. 使用完全不同的 email 進行更新';
PRINT '';

-- 4. 檢查是否有其他師資沒有email或email為空
PRINT '--- 檢查空email的師資 ---';
SELECT 
    id,
    name,
    email,
    phone,
    is_active
FROM teachers 
WHERE email IS NULL OR email = ''
ORDER BY id;

-- 5. 提供刪除重複記錄的腳本（註解掉，需要手動執行）
PRINT '';
PRINT '--- 如果需要刪除重複記錄，可以使用以下腳本 ---';
PRINT '-- 保留ID最小的記錄，刪除其他重複記錄';
PRINT '-- DELETE FROM teachers WHERE email = ''' + @conflict_email + ''' AND id NOT IN (';
PRINT '--     SELECT MIN(id) FROM teachers WHERE email = ''' + @conflict_email + '''';
PRINT '-- );';

-- 6. 提供修改email的腳本（註解掉，需要手動執行）
PRINT '';
PRINT '--- 或者修改其中一筆記錄的email ---';
PRINT '-- UPDATE teachers SET email = ''new.email@example.com'' ';
PRINT '-- WHERE email = ''' + @conflict_email + ''' AND id = (最大的ID);';

PRINT '';
PRINT '=== 檢查完成 ===';

GO 