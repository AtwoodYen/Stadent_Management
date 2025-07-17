-- =====================================================
-- 新增介紹人欄位索引 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 為 referrer 欄位建立索引
-- =====================================================

PRINT '=== 新增介紹人欄位索引 ===';

-- 建立索引
CREATE INDEX IX_students_referrer ON students(referrer);

PRINT '✓ referrer 索引已建立';

PRINT '=== 完成 ==='; 