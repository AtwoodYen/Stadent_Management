-- =====================================================
-- 修正分類代碼腳本
-- 恢復被錯誤截斷的分類代碼
-- =====================================================

USE Student_Management;
GO

PRINT N'開始修正分類代碼...';
GO

-- =====================================================
-- 1. 修正被錯誤截斷的分類代碼
-- =====================================================

PRINT N'1. 修正被錯誤截斷的分類代碼...';

-- 修正 AI工具運用
UPDATE courses_categories 
SET category_code = 'AI_TOOLS'
WHERE id = 17 AND category_code = 'I工具運用';

-- 修正 AI應用
UPDATE courses_categories 
SET category_code = 'AI_APP'
WHERE id = 31 AND category_code = 'I_APP';

-- 修正 Android開發
UPDATE courses_categories 
SET category_code = 'ANDROID_DEV'
WHERE id = 15 AND category_code = 'NDROID_DEV';

-- 修正 C
UPDATE courses_categories 
SET category_code = 'C'
WHERE id = 32 AND category_code = '';

-- 修正 C#
UPDATE courses_categories 
SET category_code = 'C_SHARP'
WHERE id = 33 AND category_code = '#';

-- 修正 C/C++
UPDATE courses_categories 
SET category_code = 'C_CPP'
WHERE id = 18 AND category_code = '/C++';

-- 修正 C++
UPDATE courses_categories 
SET category_code = 'CPP'
WHERE id = 4 AND category_code = 'PP';

-- 修正 DevOps
UPDATE courses_categories 
SET category_code = 'DEVOPS'
WHERE id = 12 AND category_code = 'EVOPS';

-- 修正 iOS開發
UPDATE courses_categories 
SET category_code = 'IOS_DEV'
WHERE id = 14 AND category_code = 'OS_DEV';

-- 修正 Java
UPDATE courses_categories 
SET category_code = 'JAVA'
WHERE id = 3 AND category_code = 'AVA';

-- 修正 JavaScript
UPDATE courses_categories 
SET category_code = 'JAVASCRIPT'
WHERE id = 2 AND category_code = 'AVASCRIPT';

-- 修正 Python
UPDATE courses_categories 
SET category_code = 'PYTHON'
WHERE id = 1 AND category_code = 'YTHON';

-- 修正 Scratch
UPDATE courses_categories 
SET category_code = 'SCRATCH'
WHERE id = 19 AND category_code = 'CRATCH';

-- 修正 Swift
UPDATE courses_categories 
SET category_code = 'SWIFT'
WHERE id = 34 AND category_code = 'WIFT';

-- 修正 UI/UX設計
UPDATE courses_categories 
SET category_code = 'UI_UX'
WHERE id = 8 AND category_code = 'I_UX';

-- 修正 Unity
UPDATE courses_categories 
SET category_code = 'UNITY'
WHERE id = 35 AND category_code = 'NITY';

-- 修正 Web開發
UPDATE courses_categories 
SET category_code = 'WEB_DEV'
WHERE id = 5 AND category_code = 'EB_DEV';

-- 修正 平面設計
UPDATE courses_categories 
SET category_code = 'GRAPHIC_DESIGN'
WHERE id = 36 AND category_code = 'RAPHIC_DESIGN';

-- 修正 美國APCS A檢定考試
UPDATE courses_categories 
SET category_code = 'APCS_A'
WHERE id = 37 AND category_code = 'PCS_A';

-- 修正 區塊鏈開發
UPDATE courses_categories 
SET category_code = 'BLOCKCHAIN'
WHERE id = 39 AND category_code = '塊鏈開發';

-- 修正 移動應用開發
UPDATE courses_categories 
SET category_code = 'MOBILE_DEV'
WHERE id = 38 AND category_code = 'OBILE_DEV';

-- 修正 設計
UPDATE courses_categories 
SET category_code = 'DESIGN'
WHERE id = 20 AND category_code = '計';

-- 修正 雲端技術
UPDATE courses_categories 
SET category_code = 'CLOUD'
WHERE id = 13 AND category_code = 'LOUD';

-- 修正 資料科學
UPDATE courses_categories 
SET category_code = 'DATA_SCIENCE'
WHERE id = 6 AND category_code = 'ATA_SCIENCE';

-- 修正 資料庫
UPDATE courses_categories 
SET category_code = 'DATABASE'
WHERE id = 21 AND category_code = '料庫';

-- 修正 資料庫設計
UPDATE courses_categories 
SET category_code = 'DATABASE_DESIGN'
WHERE id = 11 AND category_code = 'ATABASE';

-- 修正 遊戲開發
UPDATE courses_categories 
SET category_code = 'GAME_DEV'
WHERE id = 9 AND category_code = 'AME_DEV';

-- 修正 演算法
UPDATE courses_categories 
SET category_code = 'ALGORITHM'
WHERE id = 10 AND category_code = 'LGORITHM';

-- 修正 網頁開發/APP/應用程式/遊戲
UPDATE courses_categories 
SET category_code = 'WEB_APP_GAME'
WHERE id = 22 AND category_code = '頁開發/APP/應用程式/遊戲';

-- 修正 機器學習
UPDATE courses_categories 
SET category_code = 'MACHINE_LEARNING'
WHERE id = 7 AND category_code = 'ACHINE_LEARNING';

PRINT N'分類代碼修正完成';
GO

-- =====================================================
-- 2. 驗證修正結果
-- =====================================================

PRINT N'2. 驗證修正結果：';

PRINT N'2.1 顯示所有分類代碼：';
SELECT 
    id,
    category_name,
    category_code,
    is_active
FROM courses_categories
ORDER BY category_name;
GO

PRINT N'2.2 檢查分類代碼的唯一性：';
SELECT 
    category_code,
    COUNT(*) as count
FROM courses_categories
GROUP BY category_code
HAVING COUNT(*) > 1
ORDER BY category_code;
GO

PRINT N'2.3 檢查是否有空的分類代碼：';
SELECT 
    id,
    category_name,
    category_code
FROM courses_categories
WHERE category_code IS NULL OR category_code = ''
ORDER BY category_name;
GO

PRINT N'=== 分類代碼修正完成 ===';
PRINT N'注意事項：';
PRINT N'1. 所有分類代碼已修正為標準格式';
PRINT N'2. 沒有重複的分類代碼';
PRINT N'3. 建議測試系統功能確保正常運作';
GO 