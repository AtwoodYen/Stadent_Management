-- =====================================================
-- 新增介紹人 API 端點支援腳本
-- 創建日期: 2025-01-28
-- 說明: 為介紹人功能提供資料庫查詢支援
-- =====================================================

-- 1. 查詢所有不重複的介紹人 (用於下拉選單)
PRINT '=== 查詢所有不重複的介紹人 ===';
SELECT DISTINCT 
    referrer,
    COUNT(*) as student_count
FROM students 
WHERE is_active = 1 
    AND referrer IS NOT NULL 
    AND referrer != ''
GROUP BY referrer
ORDER BY student_count DESC, referrer;

-- 2. 按介紹人統計學生人數
PRINT '=== 按介紹人統計學生人數 ===';
SELECT 
    COALESCE(referrer, '無介紹人') as referrer_name,
    COUNT(*) as student_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM students WHERE is_active = 1), 2) as percentage
FROM students 
WHERE is_active = 1
GROUP BY referrer
ORDER BY student_count DESC;

-- 3. 查詢特定介紹人的學生列表
PRINT '=== 查詢特定介紹人的學生列表 (範例) ===';
DECLARE @sample_referrer NVARCHAR(100) = (
    SELECT TOP 1 referrer 
    FROM students 
    WHERE is_active = 1 
        AND referrer IS NOT NULL 
        AND referrer != ''
    ORDER BY referrer
);

IF @sample_referrer IS NOT NULL
BEGIN
    SELECT 
        chinese_name as '學生姓名',
        english_name as '英文姓名',
        school as '學校',
        grade as '年級',
        level_type as '程度',
        created_at as '註冊時間'
    FROM students 
    WHERE is_active = 1 
        AND referrer = @sample_referrer
    ORDER BY created_at DESC;
    
    PRINT '範例介紹人: ' + @sample_referrer;
END
ELSE
BEGIN
    PRINT '目前沒有介紹人資料';
END

-- 4. 查詢沒有介紹人的學生
PRINT '=== 查詢沒有介紹人的學生 ===';
SELECT 
    chinese_name as '學生姓名',
    english_name as '英文姓名',
    school as '學校',
    grade as '年級',
    created_at as '註冊時間'
FROM students 
WHERE is_active = 1 
    AND (referrer IS NULL OR referrer = '')
ORDER BY created_at DESC;

-- 5. 更新範例資料 (可選)
PRINT '=== 更新範例資料 (可選) ===';
PRINT '如需更新範例資料，請執行以下 SQL:';
PRINT 'UPDATE students SET referrer = N''家長推薦'' WHERE id = 1;';
PRINT 'UPDATE students SET referrer = N''朋友介紹'' WHERE id = 2;';
PRINT 'UPDATE students SET referrer = N''網路搜尋'' WHERE id = 3;';
PRINT 'UPDATE students SET referrer = N''學校推薦'' WHERE id = 4;';

PRINT '=== 介紹人 API 支援腳本完成 ===';
PRINT '1. 已提供查詢所有介紹人的 SQL';
PRINT '2. 已提供按介紹人統計的 SQL';
PRINT '3. 已提供查詢特定介紹人學生的 SQL';
PRINT '4. 已提供查詢無介紹人學生的 SQL'; 