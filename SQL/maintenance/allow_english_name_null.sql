-- 修改students表的english_name欄位允許NULL值
-- 執行時間: 2024-12-19
-- 目的: 將english_name欄位從必填改為選填

-- 檢查現有的english_name欄位約束
PRINT '=== 檢查現有english_name欄位約束 ===';
SELECT 
    c.COLUMN_NAME,
    c.IS_NULLABLE,
    c.DATA_TYPE,
    c.CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = 'students' 
    AND c.COLUMN_NAME = 'english_name';

-- 修改english_name欄位允許NULL值
PRINT '=== 修改english_name欄位允許NULL值 ===';
ALTER TABLE students 
ALTER COLUMN english_name NVARCHAR(100) NULL;

-- 驗證修改結果
PRINT '=== 驗證修改結果 ===';
SELECT 
    c.COLUMN_NAME,
    c.IS_NULLABLE,
    c.DATA_TYPE,
    c.CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = 'students' 
    AND c.COLUMN_NAME = 'english_name';

-- 顯示確認訊息
PRINT '✅ english_name欄位已成功修改為允許NULL值';

-- 可選：將現有空字串轉為NULL（如果需要的話）
PRINT '=== 將空字串轉換為NULL ===';
UPDATE students 
SET english_name = NULL 
WHERE english_name = '' OR LTRIM(RTRIM(english_name)) = '';

PRINT '✅ 已將空字串的english_name轉換為NULL';

-- 查看修改後的資料樣本
PRINT '=== 查看修改後的資料樣本 ===';
SELECT TOP 10 
    id,
    chinese_name,
    english_name,
    school,
    grade,
    created_at
FROM students
ORDER BY id DESC;

PRINT '✅ 資料庫結構修改完成！english_name現在允許NULL值';
PRINT '✅ 可以重啟後端服務以使用新的驗證規則'; 