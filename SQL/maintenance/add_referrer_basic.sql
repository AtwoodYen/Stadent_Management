-- =====================================================
-- 新增學生介紹人欄位 - 基本版 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 只新增 referrer 欄位，不做其他操作
-- =====================================================

PRINT '=== 新增介紹人欄位 ===';

-- 新增 referrer 欄位
ALTER TABLE students ADD referrer NVARCHAR(100) NULL;

PRINT '✓ referrer 欄位已新增';

PRINT '=== 完成 ==='; 